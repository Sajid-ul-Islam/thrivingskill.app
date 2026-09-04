import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotebookSource } from '../types/notebookLM';

const STORAGE_KEY = '@thriving_google_gemini_api_key';

export interface GeminiResponse {
  text: string;
  isRealApi: boolean;
  model: string;
  error?: string;
}

export class GeminiService {
  private static cachedKey: string | null = null;

  /**
   * Get the saved Google Gemini API Key
   */
  public static async getApiKey(): Promise<string | null> {
    if (this.cachedKey) return this.cachedKey;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
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
  public static async setApiKey(key: string): Promise<void> {
    const trimmed = key.trim();
    this.cachedKey = trimmed;
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  }

  /**
   * Remove the saved API Key
   */
  public static async clearApiKey(): Promise<void> {
    this.cachedKey = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Test if the provided key is valid by running a lightweight ping
   */
  public static async testApiKey(key: string): Promise<{ valid: boolean; error?: string }> {
    const trimmed = key.trim();
    if (!trimmed) {
      return { valid: false, error: 'API Key cannot be empty.' };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${trimmed}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello, respond with OK.' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      const data = await response.json();

      if (response.ok && data.candidates && data.candidates.length > 0) {
        return { valid: true };
      }

      const errMsg =
        data.error?.message ||
        `Google API returned status ${response.status}: ${response.statusText}`;
      return { valid: false, error: errMsg };
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Network request failed when connecting to Google Gemini.',
      };
    }
  }

  /**
   * Call Google Gemini with grounded prompt and optional sources
   */
  public static async generateContent(
    userPrompt: string,
    activeSources: NotebookSource[] = [],
    history: { role: 'user' | 'assistant'; text: string }[] = []
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          text: data.candidates[0].content.parts[0].text,
          isRealApi: true,
          model: 'gemini-1.5-flash',
        };
      }

      // If systemInstruction failed on older API versions, try without systemInstruction
      if (!response.ok && data.error?.message?.includes('systemInstruction')) {
        const fallbackPayload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemText}\n\nUser Question: ${userPrompt}` }],
            },
          ],
        };
        const fallbackRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallbackPayload),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.candidates?.[0]?.content?.parts?.[0]?.text) {
          return {
            text: fallbackData.candidates[0].content.parts[0].text,
            isRealApi: true,
            model: 'gemini-1.5-flash (compat)',
          };
        }
      }

      const errMsg = data.error?.message || 'Google Gemini API request failed.';
      return {
        text: '',
        isRealApi: false,
        model: 'error',
        error: errMsg,
      };
    } catch (err: any) {
      return {
        text: '',
        isRealApi: false,
        model: 'error',
        error: err.message || 'Network error connecting to Google Gemini.',
      };
    }
  }
}
