import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiNanoService, GeminiNanoStatus } from './geminiNanoService';
import { LiteRtService } from './liteRtService';

export interface AiTutorContext {
  courseId: string;
  courseTitle: string;
  courseCategory?: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  lessonSummary?: string;
  instructorName: string;
  currentTimestamp?: string;
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AiTutorResponse {
  available: boolean;
  text: string;
  source: 'gemini-nano' | 'lesson-search' | 'unavailable';
}

const STORAGE_KEY_PREFIX = '@thrivingskill_ai_tutor_';

export class AiTutorService {
  /**
   * Answers a lecture question honestly without fabricated cloud/template filler:
   * 1. Uses on-device Gemini Nano (AICore) when loaded on the device.
   * 2. Otherwise searches real lesson text with LiteRT semantic similarity when available.
   * 3. Otherwise returns an honest unavailable state so users are never fed canned filler.
   */
  static async askTutorDetailed(
    question: string,
    context: AiTutorContext,
    _conversationHistory: TutorMessage[] = [],
    isBangla: boolean = false
  ): Promise<AiTutorResponse> {
    const trimmed = question.trim();
    if (!trimmed) {
      return {
        available: false,
        source: 'unavailable',
        text: isBangla
          ? 'অনুগ্রহ করে লেকচার সংক্রান্ত একটি প্রশ্ন লিখুন।'
          : 'Please enter a question about this lecture.',
      };
    }

    // 1. Try genuinely available On-Device Gemini Nano (AICore)
    if (await GeminiNanoService.isAvailable()) {
      try {
        const nanoRes = await GeminiNanoService.generateText(trimmed, {
          isBangla,
          context: {
            courseTitle: context.courseTitle,
            lessonTitle: context.lessonTitle,
            lessonSummary: context.lessonSummary,
            instructorName: context.instructorName,
          },
        });
        if (nanoRes?.text) {
          return {
            available: true,
            text: nanoRes.text,
            source: 'gemini-nano',
          };
        }
      } catch {
        // Fall through to honest local search / unavailable state
      }
    }

    // 2. Semantic excerpt lookup strictly over real lesson summary/content via LiteRT embeddings
    const excerptMatch = await this.findRelevantLessonExcerpt(
      trimmed,
      context.lessonSummary,
      isBangla
    );
    if (excerptMatch) {
      return {
        available: true,
        text: excerptMatch,
        source: 'lesson-search',
      };
    }

    // 3. Honest unavailable response when neither on-device LLM nor matching lesson text exists
    return {
      available: false,
      source: 'unavailable',
      text: isBangla
        ? `এই ডিভাইসে লাইভ AI চ্যাট (Gemini Nano) সাপোর্ট নেই এবং "${context.lessonTitle}" পাঠে এই প্রশ্নের সাথে মিলে এমন লিখিত নোট পাওয়া যায়নি।\n\nআপনি নিচের বাস্তব কুইজ, ফ্ল্যাশকার্ড বা নোটস ট্যাব ব্যবহার করে অনুশীলন করতে পারেন।`
        : `Live AI Tutor chat is unavailable on this device (requires on-device Gemini Nano), and no matching written excerpt was found in "${context.lessonTitle}".\n\nUse the Quiz, Flashcards, or Notes tools to practice with verified course materials.`,
    };
  }

  /**
   * Backwards-compatible wrapper returning text output from askTutorDetailed.
   */
  static async askTutor(
    question: string,
    context: AiTutorContext,
    conversationHistory: TutorMessage[] = [],
    isBangla: boolean = false
  ): Promise<string> {
    const res = await this.askTutorDetailed(question, context, conversationHistory, isBangla);
    return res.text;
  }

  private static async findRelevantLessonExcerpt(
    question: string,
    lessonSummary?: string,
    isBangla: boolean = false
  ): Promise<string | null> {
    const clean = (lessonSummary || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length < 30) {
      return null;
    }

    const sentences = clean
      .split(/(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 20);
    if (sentences.length === 0) {
      return null;
    }

    const queryVec = LiteRtService.generateEmbedding(question);
    const scored = await Promise.all(
      sentences.map(async (sentence) => ({
        sentence,
        similarity: await LiteRtService.computeCosineSimilarity(
          queryVec,
          LiteRtService.generateEmbedding(sentence)
        ),
      }))
    );

    const best = scored
      .filter((item) => item.similarity >= 0.28)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 2);

    if (best.length === 0) {
      return null;
    }

    const header = isBangla
      ? '🔎 **লেকচার নোট থেকে প্রাসঙ্গিক অংশ (অফলাইন সার্চ):**\n\n'
      : '🔎 **Relevant Excerpts From This Lesson:**\n\n';
    return `${header}${best.map((b) => `• ${b.sentence}`).join('\n')}`;
  }

  /**
   * Summarizes real lecture text via Gemini Nano when ready, or extractive sentences when available.
   */
  static async summarizeLectureOnDevice(
    content: string,
    isBangla: boolean = false
  ): Promise<{ summary: string; isOffline: boolean; source: string }> {
    return GeminiNanoService.summarizeLecture(content, isBangla);
  }

  /**
   * Returns prompt chips only when on-device AI or searchable lesson content exists.
   */
  static async getSmartReplies(_lastMessage: string, isBangla: boolean = false): Promise<string[]> {
    const nanoReady = await GeminiNanoService.isAvailable();
    if (!nanoReady) {
      return [];
    }
    return GeminiNanoService.generateSmartReplies(_lastMessage, { isBangla });
  }

  /**
   * Check runtime status of on-device AI (AICore / Gemini Nano).
   */
  static async getExecutionStatus(): Promise<GeminiNanoStatus> {
    return GeminiNanoService.checkStatus();
  }

  /**
   * Retrieves persistent conversation history for a given lesson.
   */
  static async getStoredHistory(lessonId: string): Promise<TutorMessage[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${lessonId}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  /**
   * Saves conversation history for a given lesson.
   */
  static async saveHistory(lessonId: string, messages: TutorMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEY_PREFIX}${lessonId}`,
        JSON.stringify(messages.slice(-20))
      );
    } catch {}
  }

  /**
   * Clears conversation history for a given lesson.
   */
  static async clearHistory(lessonId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}${lessonId}`);
    } catch {}
  }
}
