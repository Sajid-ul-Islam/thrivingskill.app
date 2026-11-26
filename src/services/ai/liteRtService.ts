import { NativeModules, Platform } from 'react-native';

const { LiteRtModule } = NativeModules;

export interface LiteRtRuntimeStatus {
  isAvailable: boolean;
  isInitialized: boolean;
  isGpuEnabled: boolean;
  runtimeSource: string;
  lastError?: string | null;
}

/**
 * Native LiteRT runtime status bridge.
 * No neural sentence-embedding TFLite model is bundled with the app, so on-device search
 * and recommendations use honest BM25 keyword scoring rather than fabricated vector projections.
 */
export class LiteRtService {
  private static isInitialized = false;
  private static isGpuActive = false;
  private static runtimeSource =
    Platform.OS === 'android' ? 'Google Play Services (Standby)' : 'Unavailable on Platform';

  /**
   * Check if Native LiteRT module is present.
   */
  static isNativeAvailable(): boolean {
    return Platform.OS === 'android' && !!LiteRtModule;
  }

  /**
   * Probe LiteRT runtime availability on device without synthesizing fake vector embeddings.
   */
  static async initialize(enableGpu: boolean = true): Promise<LiteRtRuntimeStatus> {
    if (this.isNativeAvailable()) {
      try {
        const res = await LiteRtModule.initializeRuntime(enableGpu);
        this.isInitialized = Boolean(res?.isInitialized);
        this.isGpuActive = Boolean(res?.isGpuEnabled);
        this.runtimeSource = res?.runtimeSource || 'Google Play Services (LiteRT)';
      } catch {
        this.isInitialized = false;
        this.isGpuActive = false;
        this.runtimeSource = 'Unavailable';
      }
    } else {
      this.isInitialized = false;
      this.isGpuActive = false;
      this.runtimeSource = 'Unavailable (No Bundled TFLite Embedding Model)';
    }

    return this.getStatus();
  }

  /**
   * Get current LiteRT native runtime status.
   */
  static async getStatus(): Promise<LiteRtRuntimeStatus> {
    if (this.isNativeAvailable()) {
      try {
        const nativeStatus = await LiteRtModule.getRuntimeStatus();
        return {
          isAvailable: true,
          isInitialized: Boolean(nativeStatus?.isInitialized),
          isGpuEnabled: Boolean(nativeStatus?.isGpuEnabled),
          runtimeSource: nativeStatus?.runtimeSource || this.runtimeSource,
          lastError: nativeStatus?.lastError ?? null,
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
   * Compute cosine similarity between two equal-length numeric vectors.
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
