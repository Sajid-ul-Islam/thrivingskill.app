// Jest test environment setup — prevents unmocked network calls in CI
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const mockStorage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => (mockStorage.has(key) ? mockStorage.get(key)! : null)),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, String(value));
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
    clear: jest.fn(async () => {
      mockStorage.clear();
    }),
    getAllKeys: jest.fn(async () => Array.from(mockStorage.keys())),
    multiGet: jest.fn(async (keys: string[]) => keys.map((k) => [k, mockStorage.get(k) ?? null])),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
      pairs.forEach(([k, v]) => mockStorage.set(k, String(v)));
    }),
    multiRemove: jest.fn(async (keys: string[]) => {
      keys.forEach((k) => mockStorage.delete(k));
    }),
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock(
  'expo-haptics',
  () => ({
    impactAsync: jest.fn(async () => undefined),
    notificationAsync: jest.fn(async () => undefined),
    selectionAsync: jest.fn(async () => undefined),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  }),
  { virtual: true }
);

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: jest.fn((Component: any) => Component),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
}));

// Default global fetch guard: fail loudly if any test forgets to mock fetch
globalThis.fetch = jest.fn(() =>
  Promise.reject(new Error('Unmocked network request attempted during Jest unit tests'))
) as unknown as typeof fetch;

beforeEach(() => {
  mockStorage.clear();
});
