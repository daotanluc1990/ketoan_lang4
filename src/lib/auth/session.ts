import { getServerEnv } from '@/lib/env/server-env';
import type { AppRole, AuthUser, SessionUser } from './auth-types';

export const AUTH_COOKIE_NAME = 'ctl_session';
export const AUTH_ALLOWED_ROLES: AppRole[] = ['CEO', 'Kế toán'];

type LoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string; code: 'AUTH_DISABLED' | 'AUTH_NOT_CONFIGURED' | 'INVALID_CREDENTIALS' };

function getCrypto() {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle) throw new Error('Web Crypto API is not available for auth signing.');
  return webCrypto;
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function sign(value: string, secret: string) {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey('raw', encodeText(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await cryptoApi.subtle.sign('HMAC', key, encodeText(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function isAllowedRole(role: unknown): role is AppRole {
  return role === 'CEO' || role === 'Kế toán';
}

export function getAuthSessionMaxAgeSeconds() {
  return getServerEnv().authSessionMaxAgeHours * 60 * 60;
}

export function isAuthEnabled() {
  return getServerEnv().authEnabled;
}

export function isAuthConfigured() {
  const env = getServerEnv();
  if (!env.authEnabled) return true;
  return Boolean(
    env.authSessionSecret &&
    env.authCeoUsername &&
    env.authCeoPassword &&
    env.authAccountantUsername &&
    env.authAccountantPassword
  );
}

export function getConfiguredUsers(): Array<AuthUser & { password?: string }> {
  const env = getServerEnv();
  const users: Array<AuthUser & { password?: string }> = [
    {
      username: env.authCeoUsername ?? '',
      password: env.authCeoPassword,
      displayName: env.authCeoName,
      role: 'CEO'
    },
    {
      username: env.authAccountantUsername ?? '',
      password: env.authAccountantPassword,
      displayName: env.authAccountantName,
      role: 'Kế toán'
    }
  ];
  return users.filter((user) => user.username && user.password);
}

export async function validateLogin(username: string, password: string): Promise<LoginResult> {
  const env = getServerEnv();
  if (!env.authEnabled) return { ok: false, code: 'AUTH_DISABLED', message: 'Đăng nhập đang tắt bằng AUTH_ENABLED=false.' };
  if (!isAuthConfigured()) return { ok: false, code: 'AUTH_NOT_CONFIGURED', message: 'Chưa cấu hình đủ AUTH_* trong Vercel Env.' };

  const normalizedUsername = username.trim();
  const user = getConfiguredUsers().find((item) => item.username === normalizedUsername && item.password === password);
  if (!user) return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Sai tài khoản hoặc mật khẩu.' };

  return { ok: true, user: { username: user.username, role: user.role, displayName: user.displayName } };
}

export async function createSessionToken(user: AuthUser) {
  const env = getServerEnv();
  if (!env.authSessionSecret) throw new Error('AUTH_SESSION_SECRET is not configured.');
  const payload: SessionUser = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    exp: Math.floor(Date.now() / 1000) + getAuthSessionMaxAgeSeconds()
  };
  const encodedPayload = bytesToBase64Url(encodeText(JSON.stringify(payload)));
  const signature = await sign(encodedPayload, env.authSessionSecret);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  const env = getServerEnv();
  if (!env.authEnabled) {
    return { username: 'auth-disabled', role: 'CEO', displayName: 'Auth disabled', exp: Math.floor(Date.now() / 1000) + 3600 };
  }
  if (!token || !env.authSessionSecret) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expectedSignature = await sign(encodedPayload, env.authSessionSecret);
  if (signature !== expectedSignature) return null;

  const decoded = new TextDecoder().decode(base64UrlToBytes(encodedPayload));
  const payload = safeJsonParse<SessionUser>(decoded);
  if (!payload || !payload.username || !isAllowedRole(payload.role) || typeof payload.exp !== 'number') return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function redactUserForClient(user: SessionUser | AuthUser) {
  return {
    username: user.username,
    role: user.role,
    displayName: user.displayName
  } satisfies AuthUser;
}
