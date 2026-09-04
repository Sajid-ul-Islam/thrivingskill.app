import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotebookSource } from '../types/notebookLM';

const STORAGE_KEY = '@thriving_google_gemini_api_key';
const MODEL_STORAGE_KEY = '@thriving_google_gemini_active_model';

// Candidate models in preference order (2026 active Google Gemini models)
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-1.5-flash',
];

export interface GeminiResponse {
  text: string;
  isRealApi: boolean;
  model: string;
  error?: string;
}

export class GeminiService {
  private static cachedKey: string | null = null;
  private static activeModel: string = CANDIDATE_MODELS[0];

  /**
   * Format Google API error into human-readable, helpful message
   */
  private static formatGoogleError(errMsg: string): string {
    const lower = errMsg.toLowerCase();
    if (lower.includes('leaked') || lower.includes('reported as leaked')) {
      return 'Google has disabled this API key because it was reported as publicly leaked. For your security, Google automatically blocks exposed keys. Please go to https://aistudio.google.com/app/apikey and create a new key.';
    }
    if (lower.includes('api_key_invalid') || lower.includes('api key not valid')) {
      return 'The API key provided is not valid. Please ensure you copied the complete key without trailing spaces.';
    }
    if (lower.includes('resource_exhausted') || lower.includes('quota')) {
      return 'Google Gemini API quota exceeded for this key. Please verify your billing or rate limits at Google AI Studio.';
    }
    return errMsg;
  }

  /**
   * Get the saved Google Gemini API Key
   */
  public static async getApiKey(): Promise<string | null> {
    if (this.cachedKey) return this.cachedKey;

    try {
      const [stored, storedModel] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(MODEL_STORAGE_KEY),
      ]);
      if (storedModel) {
        this.activeModel = storedModel;
      }
      if (stored && stored.trim().length > 0) {
        this.cachedKey = stored.trim();
        return this.cachedKey;
      }
    } catch {
      // ignore
    }

    // Check environment variables if configured
    const envKey =
      (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GEMINI_API_KEY) ||
      (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_API_KEY);

    if (envKey && envKey.trim().length > 0) {
      this.cachedKey = envKey.trim();
      return this.cachedKey;
    }

    return null;
  }

  /**
   * Save a new Google Gemini API Key
   */
  public static async setApiKey(key: string, model: string = CANDIDATE_MODELS[0]): Promise<void> {
    const trimmed = key.trim();
    this.cachedKey = trimmed;
    this.activeModel = model;
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, trimmed),
      AsyncStorage.setItem(MODEL_STORAGE_KEY, model),
    ]);
  }

  /**
   * Remove the saved API Key
   */
  public static async clearApiKey(): Promise<void> {
    this.cachedKey = null;
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEY),
      AsyncStorage.removeItem(MODEL_STORAGE_KEY),
    ]);
  }

  /**
   * Test if the provided key is valid by running a lightweight ping across candidate models
   */
  public static async testApiKey(key: string): Promise<{ valid: boolean; model?: string; error?: string }> {
    const trimmed = key.trim();
    if (!trimmed) {
      return { valid: false, error: 'API Key cannot be empty.' };
    }

    let lastError = 'Google API connection failed.';

    for (const model of CANDIDATE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmed}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with OK.' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        });

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates.length > 0) {
          this.activeModel = model;
          return { valid: true, model };
        }

        const rawMsg = data.error?.message || `Status ${response.status}: ${response.statusText}`;

        // If it's a permanent auth error like "leaked" or "invalid key", don't loop through other models
        if (
          rawMsg.toLowerCase().includes('leaked') ||
          rawMsg.toLowerCase().includes('api_key_invalid') ||
          rawMsg.toLowerCase().includes('api key not valid')
        ) {
          return { valid: false, error: this.formatGoogleError(rawMsg) };
        }

        lastError = this.formatGoogleError(rawMsg);
      } catch (err: any) {
        lastError = err.message || 'Network request failed when connecting to Google Gemini.';
      }
    }

    return {
      valid: false,
      error: lastError,
    };
  }

  /**
   * Call Google Gemini with grounded prompt and optional sources
   */
  public static async generateContent(
    userPrompt: string,
    activeSources: NotebookSource[] = [],
    history: { role: 'user' | 'assistant'; text: string }[] = [],
    modeInstruction?: string
  ): Promise<GeminiResponse> {
    const apiKey = await this.getApiKey();

    if (!apiKey) {
      return {
        text: '',
        isRealApi: false,
        model: 'offline',
        error: 'NO_API_KEY',
      };
    }

    // Build system instructions with source grounding
    let systemText =
      'You are the official executive AI Assistant for ThrivingSkills (thrivingskill.app), Bangladesh\'s premier 21st-century skill development and executive learning platform.\n' +
      'Your tone is professional, insightful, actionable, and encouraging. You support both English and Bangla queries fluently.\n';

    if (modeInstruction && modeInstruction.trim().length > 0) {
      systemText += `\n--- ACTIVE SPECIALIZED ROLE ---\n${modeInstruction.trim()}\n`;
    }

    if (activeSources.length > 0) {
      systemText +=
        '\n--- ACTIVE NOTEBOOK GROUNDING SOURCES ---\n' +
        'Answer the user\'s question prioritizing and citing the following verified course/notebook materials whenever applicable:\n\n' +
        activeSources
          .map(
            (src, idx) =>
              `[Source ${idx + 1}: ${src.title} (${src.type})]\n${src.content.slice(0, 1500)}`
          )
          .join('\n\n') +
        '\n--- END SOURCES ---\n';
    }

    // Format chat history
    const contents: any[] = [];

    // Include recent history (last 4 turns)
    const recentHistory = history.slice(-4);
    for (const h of recentHistory) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }

    // Current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }],
    });

    const bodyPayload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1200,
      },
    };

    // Try active model first, then fallback to candidate models
    const modelsToTry = [this.activeModel, ...CANDIDATE_MODELS.filter((m) => m !== this.activeModel)];

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          this.activeModel = model;
          return {
            text: data.candidates[0].content.parts[0].text,
            isRealApi: true,
            model,
          };
        }

        // Check if error is fatal auth error
        const errMsg = data.error?.message || '';
        if (
          errMsg.toLowerCase().includes('leaked') ||
          errMsg.toLowerCase().includes('api_key_invalid') ||
          errMsg.toLowerCase().includes('api key not valid')
        ) {
          return {
            text: '',
            isRealApi: false,
            model: 'error',
            error: this.formatGoogleError(errMsg),
          };
        }
      } catch (err: any) {
        // continue to next model candidate
      }
    }

    return {
      text: '',
      isRealApi: false,
      model: 'error',
      error: 'Unable to reach Google Gemini models. Please check your network or API Key.',
    };
  }
}
