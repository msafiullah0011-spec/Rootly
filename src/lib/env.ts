/**
 * Runtime configuration.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so these must be
 * referenced as full static property accesses — destructuring `process.env`
 * or building the key dynamically will not work.
 */

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  /** Base URL of the real API. Ignored while `useMocks` is on. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.rootly.app/v1',

  /**
   * Serve every request from the in-memory mock server instead of the network.
   * Defaults to on so the app runs with zero backend configuration.
   */
  useMocks: bool(process.env.EXPO_PUBLIC_USE_MOCKS, true),

  /** Per-request timeout in milliseconds. */
  requestTimeoutMs: int(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS, 15_000),

  /** Simulated mock latency, so loading states are actually visible. */
  mockLatencyMs: int(process.env.EXPO_PUBLIC_MOCK_LATENCY_MS, 450),

  /**
   * Fraction of mock requests that fail (0–1). Set to e.g. 0.5 to exercise
   * every error state without touching code.
   */
  mockFailureRate: Number.parseFloat(process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE ?? '0') || 0,

  isDev: __DEV__,
} as const;

export type Env = typeof env;
