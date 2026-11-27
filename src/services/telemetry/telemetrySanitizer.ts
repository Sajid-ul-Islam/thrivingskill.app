const SENSITIVE_QUERY_PARAM_REGEX =
  /([?&](?:order_key|key|rp_key|token|tsmb_handoff|otp|password|reset_key)=)[^&#\s]+/gi;

const SENSITIVE_FIELD_KEYS = new Set([
  'order_key',
  'orderkey',
  'tsmb_handoff',
  'token',
  'password',
  'otp',
]);

/**
 * Redacts sensitive query string parameters (order keys, tokens, OTPs) from URLs before storage/reporting.
 */
export function sanitizeSensitiveUrl(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replace(SENSITIVE_QUERY_PARAM_REGEX, '$1[REDACTED]');
}

/**
 * Recursively scrubs sensitive query strings and secret keys from telemetry/analytics payloads.
 */
export function sanitizeTelemetryRecord(value: any, depth: number = 0): any {
  if (depth > 3 || value === null || value === undefined) return value;
  if (typeof value === 'string') return sanitizeSensitiveUrl(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeTelemetryRecord(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const lowerKey = k.toLowerCase();
      if (SENSITIVE_FIELD_KEYS.has(lowerKey)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = sanitizeTelemetryRecord(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

export function sanitizeSentryBreadcrumb<T extends Record<string, any> | null | undefined>(
  breadcrumb: T
): T {
  if (!breadcrumb || typeof breadcrumb !== 'object') return breadcrumb;
  return {
    ...breadcrumb,
    ...(typeof breadcrumb.message === 'string'
      ? { message: sanitizeSensitiveUrl(breadcrumb.message) }
      : {}),
    ...(breadcrumb.data ? { data: sanitizeTelemetryRecord(breadcrumb.data) } : {}),
  } as T;
}

export function sanitizeSentryEvent<T extends Record<string, any> | null | undefined>(event: T): T {
  if (!event || typeof event !== 'object') return event;
  const copy: any = { ...event };
  if (copy.request) {
    copy.request = sanitizeTelemetryRecord(copy.request);
  }
  if (Array.isArray(copy.breadcrumbs)) {
    copy.breadcrumbs = copy.breadcrumbs.map((b: any) => sanitizeSentryBreadcrumb(b));
  } else if (copy.breadcrumbs && Array.isArray(copy.breadcrumbs.values)) {
    copy.breadcrumbs = {
      ...copy.breadcrumbs,
      values: copy.breadcrumbs.values.map((b: any) => sanitizeSentryBreadcrumb(b)),
    };
  }
  if (copy.user && typeof copy.user === 'object') {
    const cleanUser: Record<string, any> = {};
    if (copy.user.id !== undefined) cleanUser.id = copy.user.id;
    if (
      typeof copy.user.username === 'string' &&
      !isPhoneNumberUsername(copy.user.username) &&
      !copy.user.username.endsWith('@phone.thrivingskill.com')
    ) {
      cleanUser.username = copy.user.username;
    }
    copy.user = cleanUser;
  }
  return copy;
}

export function isPhoneNumberUsername(username?: string | null): boolean {
  if (!username || typeof username !== 'string') return false;
  const clean = username.trim();
  return /^\+?\d[\d\s()-]{6,}$/.test(clean);
}
