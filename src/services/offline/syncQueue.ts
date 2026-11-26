import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HttpClient } from '../api/httpClient';

const QUEUE_STORAGE_KEY_PREFIX = '@ts_sync_mutation_queue_';

const ALLOWED_PROFILE_UPDATE_KEYS = new Set([
  'name',
  'first_name',
  'last_name',
  'description',
  'meta',
]);

const DISALLOWED_OBJECT_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'roles',
  'role',
  'capabilities',
]);

/**
 * SEC-05: Strict allowlist pattern for offline sync mutations.
 * Prevents arbitrary endpoint execution / SSRF / path traversal via local queue tampering.
 */
export function isAllowedSyncEndpoint(endpoint: string): boolean {
  if (!endpoint || typeof endpoint !== 'string') return false;
  // Disallow any full URLs, scheme prefixes, or directory traversal
  if (endpoint.includes('://') || endpoint.includes('..') || endpoint.includes('\\')) {
    return false;
  }

  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Allowlist patterns for valid student learning mutations
  const allowedPrefixes = [
    '/learnpress/v1/lessons/finish',
    '/learnpress/v1/courses/enroll',
    '/learnpress/v1/courses/finish',
    '/learnpress/v1/courses/retake',
    '/learnpress/v1/quiz/start',
    '/learnpress/v1/quiz/finish',
    '/learnpress/v1/quiz/check_answer',
    '/wp/v2/users/me',
  ];

  return allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableSerialize(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableSerialize(obj[k])}`).join(',')}}`;
}

function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function computeSyncIdempotencyKey(
  action: MutationAction,
  endpoint: string,
  method: string,
  payload: unknown
): string {
  const canonical = `${action}|${method.toUpperCase()}|${endpoint}|${stableSerialize(payload ?? {})}`;
  return `sync_${action.toLowerCase()}_${fnv1aHex(canonical)}_${canonical.length}`;
}

export function validateSyncPayload(
  action: MutationAction,
  endpoint: string,
  payload: unknown
): { valid: true } | { valid: false; reason: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, reason: `Invalid payload type for ${action}` };
  }

  const record = payload as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (DISALLOWED_OBJECT_KEYS.has(key)) {
      return { valid: false, reason: `Disallowed payload property "${key}"` };
    }
  }

  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (normalized.startsWith('/wp/v2/users/me')) {
    const keys = Object.keys(record);
    if (keys.length === 0) {
      return { valid: false, reason: 'Profile sync payload cannot be empty' };
    }
    for (const k of keys) {
      if (!ALLOWED_PROFILE_UPDATE_KEYS.has(k)) {
        return { valid: false, reason: `Disallowed profile field "${k}" in offline queue` };
      }
    }
    return { valid: true };
  }

  // LearnPress mutations require a non-empty entity ID
  if (normalized.startsWith('/learnpress/v1/')) {
    const rawId = record.id;
    if (
      rawId === undefined ||
      rawId === null ||
      (typeof rawId !== 'string' && typeof rawId !== 'number') ||
      String(rawId).trim().length === 0
    ) {
      return { valid: false, reason: `Missing required entity id for ${endpoint}` };
    }
    return { valid: true };
  }

  return { valid: true };
}

export type MutationAction =
  | 'COMPLETE_LESSON'
  | 'COMPLETE_COURSE'
  | 'SUBMIT_QUIZ'
  | 'ENROLL_COURSE'
  | 'ADD_NOTE'
  | 'UPDATE_PROGRESS'
  | 'UPDATE_PROFILE';

export interface OfflineMutation {
  id: string;
  idempotencyKey?: string;
  action: MutationAction;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}

export interface SyncProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export type QueueListener = (pendingCount: number, isSyncing: boolean) => void;

export class SyncQueueManager {
  private static userScope = '_guest';
  private static syncingScopes = new Set<string>();
  private static activeProcessors = new Map<string, Promise<SyncProcessResult>>();
  private static pendingForceRerunScopes = new Set<string>();
  private static storageLocks = new Map<string, Promise<void>>();
  private static listeners = new Set<QueueListener>();

  private static resolveScope(explicitScope?: string): string {
    return typeof explicitScope === 'string' && explicitScope.trim().length > 0
      ? explicitScope.trim()
      : this.userScope;
  }

  private static getStorageKeyForScope(scope: string): string {
    return `${QUEUE_STORAGE_KEY_PREFIX}${scope}`;
  }

  private static async withScopeStorageLock<T>(scope: string, task: () => Promise<T>): Promise<T> {
    const prev = this.storageLocks.get(scope) || Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = prev.then(() => gate);
    this.storageLocks.set(scope, chained);

    await prev;
    try {
      return await task();
    } finally {
      release();
      if (this.storageLocks.get(scope) === chained) {
        this.storageLocks.delete(scope);
      }
    }
  }

  private static async readMutationsForScope(scope: string): Promise<OfflineMutation[]> {
    try {
      const raw = await AsyncStorage.getItem(this.getStorageKeyForScope(scope));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static async writeMutationsForScope(
    scope: string,
    items: OfflineMutation[]
  ): Promise<void> {
    const storageKey = this.getStorageKeyForScope(scope);
    if (items.length === 0) {
      await AsyncStorage.removeItem(storageKey);
    } else {
      await AsyncStorage.setItem(storageKey, JSON.stringify(items));
    }
  }

  /**
   * Set the active user scope so offline actions are isolated per learner.
   */
  static setUserScope(scope: string): void {
    const normalized = this.resolveScope(scope);
    this.userScope = normalized;
    this.notifyListeners(normalized);
  }

  static getUserScope(): string {
    return this.userScope;
  }

  /**
   * Subscribe to queue size and sync status changes for the active user scope.
   */
  static subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    const activeScope = this.userScope;
    this.getPendingCount(activeScope).then((count) => {
      if (this.userScope === activeScope && this.listeners.has(listener)) {
        listener(count, this.syncingScopes.has(activeScope));
      }
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static async notifyListeners(scopeSnapshot?: string): Promise<void> {
    const activeScope = scopeSnapshot ?? this.userScope;
    const count = await this.getPendingCount(activeScope);
    // Only emit UI notifications for whichever scope is still currently active
    if (activeScope !== this.userScope) return;
    const isScopeSyncing = this.syncingScopes.has(activeScope);
    this.listeners.forEach((fn) => {
      try {
        fn(count, isScopeSyncing);
      } catch {}
    });
  }

  /**
   * Enqueue a new validated & idempotent mutation into a captured learner scope.
   */
  static async enqueue(
    action: MutationAction,
    endpoint: string,
    payload: any,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    maxAttempts: number = 5,
    scope?: string
  ): Promise<OfflineMutation> {
    if (!isAllowedSyncEndpoint(endpoint)) {
      throw new Error(
        `[SyncQueue] Untrusted or disallowed endpoint for offline synchronization: ${endpoint}`
      );
    }

    const validation = validateSyncPayload(action, endpoint, payload);
    if (!validation.valid) {
      throw new Error(`[SyncQueue] Invalid payload: ${validation.reason}`);
    }

    const capturedScope = this.resolveScope(scope);
    const idempotencyKey = computeSyncIdempotencyKey(action, endpoint, method, payload);

    const mutation = await this.withScopeStorageLock(capturedScope, async () => {
      const queue = await this.readMutationsForScope(capturedScope);

      const duplicate = queue.find(
        (m) =>
          (m.idempotencyKey && m.idempotencyKey === idempotencyKey) ||
          (m.action === action &&
            m.endpoint === endpoint &&
            stableSerialize(m.payload) === stableSerialize(payload))
      );

      if (duplicate) {
        return duplicate;
      }

      const created: OfflineMutation = {
        id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        idempotencyKey,
        action,
        endpoint,
        method,
        payload,
        createdAt: Date.now(),
        attempts: 0,
        maxAttempts,
      };

      queue.push(created);
      await this.writeMutationsForScope(capturedScope, queue);
      return created;
    });

    await this.notifyListeners(capturedScope);
    return mutation;
  }

  /**
   * Retrieve all pending mutations in FIFO order for a captured scope.
   */
  static async getPendingMutations(scope?: string): Promise<OfflineMutation[]> {
    const capturedScope = this.resolveScope(scope);
    return this.readMutationsForScope(capturedScope);
  }

  /**
   * Return number of pending mutations in a captured scope.
   */
  static async getPendingCount(scope?: string): Promise<number> {
    const capturedScope = this.resolveScope(scope);
    const items = await this.readMutationsForScope(capturedScope);
    return items.length;
  }

  /**
   * Remove a mutation from a captured scope's queue.
   */
  static async removeMutation(id: string, scope?: string): Promise<void> {
    const capturedScope = this.resolveScope(scope);
    await this.withScopeStorageLock(capturedScope, async () => {
      const queue = await this.readMutationsForScope(capturedScope);
      const filtered = queue.filter((m) => m.id !== id);
      await this.writeMutationsForScope(capturedScope, filtered);
    });
    await this.notifyListeners(capturedScope);
  }

  /**
   * Clear all mutations for a captured scope.
   */
  static async clearQueue(scope?: string): Promise<void> {
    const capturedScope = this.resolveScope(scope);
    await this.withScopeStorageLock(capturedScope, async () => {
      await AsyncStorage.removeItem(this.getStorageKeyForScope(capturedScope));
    });
    await this.notifyListeners(capturedScope);
  }

  /**
   * Process pending mutations sequentially with per-scope lock & captured scope isolation.
   * Prevents concurrent processors on the same scope and halts immediately if the active
   * account changes mid-flight so mutations are never replayed under another user's session.
   */
  static async processQueue(force: boolean = false, scope?: string): Promise<SyncProcessResult> {
    const capturedScope = this.resolveScope(scope);
    const existingProcessor = this.activeProcessors.get(capturedScope);

    if (existingProcessor) {
      if (force) {
        this.pendingForceRerunScopes.add(capturedScope);
      }
      return existingProcessor;
    }

    const processorPromise = this.runScopedProcessor(capturedScope).finally(() => {
      this.activeProcessors.delete(capturedScope);
      this.syncingScopes.delete(capturedScope);
      this.pendingForceRerunScopes.delete(capturedScope);
    });

    this.activeProcessors.set(capturedScope, processorPromise);
    return processorPromise;
  }

  private static async runScopedProcessor(capturedScope: string): Promise<SyncProcessResult> {
    this.syncingScopes.add(capturedScope);
    void this.notifyListeners(capturedScope);

    let totalProcessed = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let passCount = 0;
    const MAX_PASSES = 3;

    try {
      do {
        this.pendingForceRerunScopes.delete(capturedScope);
        passCount++;

        // Refuse to replay HTTP mutations if user switched accounts before this pass started
        if (this.userScope !== capturedScope) {
          break;
        }

        const queueSnapshot = await this.withScopeStorageLock(capturedScope, () =>
          this.readMutationsForScope(capturedScope)
        );

        if (queueSnapshot.length === 0) {
          break;
        }

        const succeededIds = new Set<string>();
        const droppedIds = new Set<string>();
        const updatedFailedById = new Map<string, OfflineMutation>();

        for (const rawMutation of queueSnapshot) {
          // Stop mid-loop immediately if user signed out or switched accounts while previous request was awaiting
          if (this.userScope !== capturedScope) {
            break;
          }

          totalProcessed++;

          if (!isAllowedSyncEndpoint(rawMutation.endpoint)) {
            console.warn(
              `[SyncQueue] Dropping unauthorized endpoint in offline queue: ${rawMutation.endpoint}`
            );
            droppedIds.add(rawMutation.id);
            totalFailed++;
            continue;
          }

          const validation = validateSyncPayload(
            rawMutation.action,
            rawMutation.endpoint,
            rawMutation.payload
          );
          if (!validation.valid) {
            console.warn(`[SyncQueue] Dropping malformed offline mutation: ${validation.reason}`);
            droppedIds.add(rawMutation.id);
            totalFailed++;
            continue;
          }

          const idempotencyKey =
            rawMutation.idempotencyKey ||
            computeSyncIdempotencyKey(
              rawMutation.action,
              rawMutation.endpoint,
              rawMutation.method,
              rawMutation.payload
            );
          const requestOptions =
            Platform.OS !== 'web'
              ? { headers: { 'X-Idempotency-Key': idempotencyKey } }
              : undefined;

          try {
            if (rawMutation.method === 'POST') {
              await HttpClient.post(rawMutation.endpoint, rawMutation.payload, requestOptions);
            } else if (rawMutation.method === 'PUT') {
              await HttpClient.put(rawMutation.endpoint, rawMutation.payload, requestOptions);
            } else if (rawMutation.method === 'PATCH') {
              await HttpClient.patch(rawMutation.endpoint, rawMutation.payload, requestOptions);
            } else if (rawMutation.method === 'DELETE') {
              await HttpClient.delete(rawMutation.endpoint, requestOptions);
            }
            succeededIds.add(rawMutation.id);
            totalSucceeded++;
          } catch (err: any) {
            const nextAttempts = (rawMutation.attempts || 0) + 1;
            const maxAttempts = rawMutation.maxAttempts || 5;
            const isPermanentClientError =
              err?.status >= 400 &&
              err?.status < 500 &&
              err?.status !== 401 &&
              err?.status !== 408 &&
              err?.status !== 429;

            totalFailed++;
            if (nextAttempts < maxAttempts && !isPermanentClientError) {
              updatedFailedById.set(rawMutation.id, {
                ...rawMutation,
                idempotencyKey,
                attempts: nextAttempts,
                lastError: err?.message || 'Network request failed',
              });
            } else {
              droppedIds.add(rawMutation.id);
            }

            // Pause remaining replay on 401 session expiry without discarding subsequent queued mutations
            if (err?.status === 401) {
              break;
            }
          }
        }

        // Atomic read-merge-write into capturedScope ONLY so concurrent enqueues or account switches never race
        await this.withScopeStorageLock(capturedScope, async () => {
          const latestQueue = await this.readMutationsForScope(capturedScope);
          const mergedQueue: OfflineMutation[] = [];

          for (const item of latestQueue) {
            if (succeededIds.has(item.id) || droppedIds.has(item.id)) {
              continue;
            }
            mergedQueue.push(updatedFailedById.get(item.id) || item);
          }

          await this.writeMutationsForScope(capturedScope, mergedQueue);
        });
      } while (
        this.pendingForceRerunScopes.has(capturedScope) &&
        this.userScope === capturedScope &&
        passCount < MAX_PASSES
      );
    } finally {
      this.syncingScopes.delete(capturedScope);
      await this.notifyListeners(capturedScope);
    }

    return {
      processed: totalProcessed,
      succeeded: totalSucceeded,
      failed: totalFailed,
    };
  }
}
