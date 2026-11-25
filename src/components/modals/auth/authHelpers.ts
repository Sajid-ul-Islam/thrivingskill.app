export type AuthMode =
  | 'login'
  | 'register'
  | 'forgot_password'
  | 'set_password'
  | 'register_webview'
  | 'register_success';

export interface PasswordStrengthResult {
  label: string;
  color: string;
  pct: number;
  isValid: boolean;
}

export function getPasswordStrength(pass: string, isDark: boolean): PasswordStrengthResult | null {
  if (pass.length === 0) return null;
  let score = 0;
  if (pass.length >= 8) score += 1;
  if (pass.length >= 12) score += 1;
  if (pass.length >= 16) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

  if (pass.length < 12) {
    return {
      label: `Weak (${pass.length}/12 chars - at least 12 required)`,
      color: '#E34234',
      pct: Math.min(Math.round((pass.length / 12) * 60), 60),
      isValid: false,
    };
  }
  if (score <= 3) {
    return { label: 'Medium', color: isDark ? '#34D399' : '#059669', pct: 80, isValid: true };
  }
  return { label: 'Strong', color: isDark ? '#34D399' : '#047857', pct: 100, isValid: true };
}

export function generateUsernameFromEmail(emailStr: string): string {
  const raw = emailStr
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const base = raw.length >= 3 ? raw : `student${raw}`;
  const rand = Math.floor(100 + Math.random() * 900);
  return `${base}${rand}`;
}
