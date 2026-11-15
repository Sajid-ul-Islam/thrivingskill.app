import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { LiteRtModule } = NativeModules;
const AI_SETTINGS_STORAGE_KEY = '@thrivingskill_ai_semantic_search';

export interface LiteRtRuntimeStatus {
  isAvailable: boolean;
  isInitialized: boolean;
  isGpuEnabled: boolean;
  runtimeSource: string;
  lastError?: string | null;
}

export class LiteRtService {
  private static isInitialized = false;
  private static isGpuActive = false;
  private static runtimeSource = Platform.OS === 'android' ? 'Google Play Services (Pending Init)' : 'JS On-Device Engine';
  private static isSemanticSearchEnabled = true;

  // Domain semantic vocabulary dimension map (64-dimensional dense projection)
  private static readonly VECTOR_DIMENSIONS = 64;

  // Domain Semantic Concept Clusters for On-Device Skill Embedding
  private static readonly CONCEPT_CLUSTERS = [
    // 0: Coding & Software Development
    ['code', 'develop', 'software', 'react', 'typescript', 'javascript', 'python', 'web', 'app', 'backend', 'frontend', 'program', 'api', 'bug', 'fullstack'],
    // 1: Conflict, Negotiation & Leadership
    ['conflict', 'dispute', 'argument', 'negotiat', 'resolv', 'mediat', 'peace', 'leader', 'team', 'consensus', 'communicat', 'discord', 'friction'],
    // 2: Business, Finance & Management
    ['business', 'money', 'finance', 'startup', 'management', 'accounting', 'invest', 'enterprise', 'revenue', 'strategy', 'profit'],
    // 3: Marketing & Growth
    ['market', 'seo', 'sem', 'growth', 'viral', 'audience', 'acquisition', 'sales', 'ads', 'advertising', 'brand'],
    // 4: Design & UI/UX
    ['design', 'ui', 'ux', 'visual', 'graphic', 'figma', 'art', 'typography', 'layout', 'wireframe', 'color'],
    // 5: Data Science & Machine Learning
    ['ai', 'ml', 'data', 'machine', 'learning', 'neural', 'model', 'analytics', 'statistics', 'deep'],
    // 6: Language & Communication
    ['english', 'spoken', 'language', 'grammar', 'fluency', 'vocabulary', 'bangla', 'speech', 'writing'],
    // 7: Productivity & Study
    ['study', 'notes', 'productivity', 'flashcard', 'memory', 'habit', 'focus', 'learn', 'skill', 'exam'],
  ];

  /**
   * Check if Native LiteRT module is present
   */
  static isNativeAvailable(): boolean {
    return Platform.OS === 'android' && !!LiteRtModule;
  }

  /**
   * Initialize LiteRT runtime (with GPU acceleration via Play Services if available)
   */
  static async initialize(enableGpu: boolean = true): Promise<LiteRtRuntimeStatus> {
    if (this.isNativeAvailable()) {
      try {
        const res = await LiteRtModule.initializeRuntime(enableGpu);
        this.isInitialized = res.isInitialized;
        this.isGpuActive = res.isGpuEnabled;
        this.runtimeSource = res.runtimeSource || 'Google Play Services (LiteRT)';
      } catch (err: any) {
        this.isInitialized = true; // Still ready with JS fallback
        this.isGpuActive = false;
        this.runtimeSource = 'JS On-Device Engine (Play Services Standby)';
      }
    } else {
      this.isInitialized = true;
      this.isGpuActive = false;
      this.runtimeSource = Platform.OS === 'ios' ? 'iOS On-Device Engine' : 'Web/JS Vector Engine';
    }

    try {
      const savedSetting = await AsyncStorage.getItem(AI_SETTINGS_STORAGE_KEY);
      if (savedSetting !== null) {
        this.isSemanticSearchEnabled = savedSetting === 'true';
      }
    } catch {}

    return this.getStatus();
  }

  /**
   * Get current LiteRT & AI runtime status
   */
  static async getStatus(): Promise<LiteRtRuntimeStatus> {
    if (this.isNativeAvailable()) {
      try {
        const nativeStatus = await LiteRtModule.getRuntimeStatus();
        return {
          isAvailable: true,
          isInitialized: nativeStatus.isInitialized,
          isGpuEnabled: nativeStatus.isGpuEnabled,
          runtimeSource: nativeStatus.runtimeSource,
          lastError: nativeStatus.lastError,
        };
      } catch {}
    }

    return {
      isAvailable: this.isNativeAvailable(),
      isInitialized: this.isInitialized,
      isGpuEnabled: this.isGpuActive,
      runtimeSource: this.runtimeSource,
      lastError: null,
    };
  }

  /**
   * Toggle semantic vector search
   */
  static async setSemanticSearchEnabled(enabled: boolean): Promise<void> {
    this.isSemanticSearchEnabled = enabled;
    try {
      await AsyncStorage.setItem(AI_SETTINGS_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {}
  }

  static isSemanticEnabled(): boolean {
    return this.isSemanticSearchEnabled;
  }

  /**
   * Generate a normalized dense vector embedding (64-dim) for text on-device.
   * Utilizes hybrid fastText subword n-grams combined with skill concept clusters.
   */
  static generateEmbedding(text?: string): number[] {
    if (!text || !text.trim()) {
      return new Array(this.VECTOR_DIMENSIONS).fill(0);
    }

    const clean = text.toLowerCase().replace(/<[^>]+>/g, ' ');
    const tokens = clean.split(/\s+/).filter((t) => t.length >= 2);

    const vector = new Array(this.VECTOR_DIMENSIONS).fill(0);

    for (const token of tokens) {
      // 1. Domain Concept Semantic Clustering (Dimensions 0..7)
      for (let clusterIdx = 0; clusterIdx < this.CONCEPT_CLUSTERS.length; clusterIdx++) {
        const keywords = this.CONCEPT_CLUSTERS[clusterIdx];
        for (const kw of keywords) {
          if (token.includes(kw) || kw.includes(token)) {
            vector[clusterIdx] += 2.0; // Anchor to domain concept
            break;
          }
        }
      }

      // 2. Character 3-gram subwords for morphological similarity (Dimensions 8..47)
      const subwordStart = 8;
      const subwordRange = 40;
      if (token.length >= 3) {
        for (let i = 0; i <= token.length - 3; i++) {
          const tri = token.slice(i, i + 3);
          let triHash = 0;
          for (let j = 0; j < 3; j++) {
            triHash = (triHash << 5) - triHash + tri.charCodeAt(j);
            triHash |= 0;
          }
          const dim = subwordStart + (Math.abs(triHash) % subwordRange);
          vector[dim] += 0.5;
        }
      }

      // 3. Full Token Generalized Hash (Dimensions 48..63)
      const tokenStart = 48;
      const tokenRange = 16;
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }
      const dim = tokenStart + (Math.abs(hash) % tokenRange);
      vector[dim] += 1.0;
    }

    // L2 Normalize the vector so cosine similarity is simply the dot product
    let norm = 0;
    for (let i = 0; i < this.VECTOR_DIMENSIONS; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
      for (let i = 0; i < this.VECTOR_DIMENSIONS; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * Compute Cosine Similarity between two dense embedding vectors.
   * Utilizes LiteRT native module on Android or high-speed JS fallback.
   */
  static async computeCosineSimilarity(vecA: number[], vecB: number[]): Promise<number> {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
      return 0;
    }

    if (this.isNativeAvailable()) {
      try {
        const similarity = await LiteRtModule.computeSimilarity(vecA, vecB);
        return typeof similarity === 'number' ? similarity : 0;
      } catch {}
    }

    // Pure JS vector dot product fallback
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }
}
