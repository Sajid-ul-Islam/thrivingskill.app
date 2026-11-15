import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpClient } from '../api/httpClient';

const QUEUE_STORAGE_KEY_PREFIX = '@ts_sync_mutation_queue_';

export type MutationAction =
  | 'COMPLETE_LESSON'
  | 'SUBMIT_QUIZ'
  | 'ENROLL_COURSE'
  | 'ADD_NOTE'
  | 'UPDATE_PROGRESS';

export interface OfflineMutation {
  id: string;
  action: MutationAction;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}

export type QueueListener = (pendingCount: number, isSyncing: boolean) => void;

export class SyncQueueManager {
  private static userScope = '_guest';
  private static isSyncing = false;
  private static listeners = new Set<QueueListener>();

  /**
   * Set the active user scope so offline actions are isolated per learner
   */
  static setUserScope(scope: string): void {
    this.userScope = scope;
    this.notifyListeners();
  }

  private static getStorageKey(): string {
    return `${QUEUE_STORAGE_KEY_PREFIX}${this.userScope}`;
  }

  /**
   * Subscribe to queue size and sync status changes
   */
  static subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Initial notification
    this.getPendingCount().then((count) => listener(count, this.isSyncing));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static async notifyListeners(): Promise<void> {
    const count = await this.getPendingCount();
    this.listeners.forEach((fn) => {
      try {
        fn(count, this.isSyncing);
      } catch {}
    });
  }

  /**
   * Enqueue a new mutation to be replayed when online
   */
  static async enqueue(
    action: MutationAction,
    endpoint: string,
    payload: any,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    maxAttempts: number = 5
  ): Promise<OfflineMutation> {
    const queue = await this.getPendingMutations();

    // Check for existing duplicate unattempted mutation to prevent redundant duplicate calls
    const duplicateIdx = queue.findIndex(
      (m) => m.action === action && m.endpoint === endpoint && JSON.stringify(m.payload) === JSON.stringify(payload)
    );

    if (duplicateIdx >= 0) {
      return queue[duplicateIdx];
    }

    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      endpoint,
      method,
      payload,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts,
    };

    queue.push(mutation);
    await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
    await this.notifyListeners();
    return mutation;
  }

  /**
   * Retrieve all pending mutations in FIFO order
   */
  static async getPendingMutations(): Promise<OfflineMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(this.getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Return number of pending mutations in current scope
   */
  static async getPendingCount(): Promise<number> {
    const items = await this.getPendingMutations();
    return items.length;
  }

  /**
   * Remove a mutation from the queue
   */
  static async removeMutation(id: string): Promise<void> {
    const queue = await this.getPendingMutations();
    const filtered = queue.filter((m) => m.id !== id);
    await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(filtered));
    await this.notifyListeners();
  }

  /**
   * Clear all mutations for the active user
   */
  static async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(this.getStorageKey());
    await this.notifyListeners();
  }

  /**
   * Process all pending mutations sequentially
   */
  static async processQueue(force: boolean = false): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isSyncing && !force) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isSyncing = true;
    await this.notifyListeners();

    let succeeded = 0;
    let failed = 0;
    const queue = await this.getPendingMutations();

    if (queue.length === 0) {
      this.isSyncing = false;
      await this.notifyListeners();
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const remainingQueue: OfflineMutation[] = [];

    for (const mutation of queue) {
      try {
        if (mutation.method === 'POST') {
          await HttpClient.post(mutation.endpoint, mutation.payload);
        } else if (mutation.method === 'PUT') {
          await HttpClient.put(mutation.endpoint, mutation.payload);
        } else if (mutation.method === 'PATCH') {
          await HttpClient.patch(mutation.endpoint, mutation.payload);
        } else if (mutation.method === 'DELETE') {
          await HttpClient.delete(mutation.endpoint);
        }
        succeeded++;
      } catch (err: any) {
        mutation.attempts += 1;
        mutation.lastError = err?.message || 'Network request failed';

        // Keep in queue if retry limit not exceeded and not a 4xx terminal error
        const isClientError = err?.status >= 400 && err?.status < 500 && err?.status !== 408;
        if (mutation.attempts < mutation.maxAttempts && !isClientError) {
          remainingQueue.push(mutation);
        }
        failed++;
      }
    }

    await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(remainingQueue));
    this.isSyncing = false;
    await this.notifyListeners();

    return {
      processed: queue.length,
      succeeded,
      failed,
    };
  }
}
