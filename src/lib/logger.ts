/**
 * Thin logging shim. Everything routes through here so a crash reporter
 * (Sentry, Bugsnag) can be attached in one place later.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const enabled = __DEV__;

function emit(level: Level, message: string, ...rest: unknown[]) {
  if (!enabled && level !== 'error') return;
  const prefix = `[rootly:${level}]`;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(prefix, message, ...rest);
}

export const logger = {
  debug: (message: string, ...rest: unknown[]) => emit('debug', message, ...rest),
  info: (message: string, ...rest: unknown[]) => emit('info', message, ...rest),
  warn: (message: string, ...rest: unknown[]) => emit('warn', message, ...rest),
  error: (message: string, ...rest: unknown[]) => emit('error', message, ...rest),
};
