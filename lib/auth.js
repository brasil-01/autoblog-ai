// Hash SHA-256 hex (node) — usado pelas rotas de auth.
// O middleware faz o mesmo cálculo no Edge Runtime.
import crypto from 'crypto';

export function sha256Hex(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex');
}

export const AUTH_COOKIE = 'autoblog_auth';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
