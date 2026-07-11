import { env } from '../config/env.ts';
import { AppError } from './AppError.ts';

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

function b64url(data: string | Uint8Array | ArrayBuffer): string {
  const bytes =
    typeof data === 'string'
      ? new TextEncoder().encode(data)
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : data;
  const b64 = Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  // Copy into a fresh ArrayBuffer so Web Crypto accepts it as BufferSource.
  return Uint8Array.from(Buffer.from(padded, 'base64'));
}

let cachedKey: CryptoKey | null = null;

async function getSigningKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  return cachedKey;
}

export async function signToken(userId: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + env.jwtExpiresInSeconds,
    }),
  );
  const data = `${header}.${payload}`;
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64url(signature)}`;
}

export async function verifyToken(token: string): Promise<string> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AppError('invalid token', 401);

  const header = parts[0]!;
  const payloadPart = parts[1]!;
  const signaturePart = parts[2]!;
  const data = `${header}.${payloadPart}`;

  const key = await getSigningKey();
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    b64urlDecode(signaturePart),
    new TextEncoder().encode(data),
  );
  if (!valid) throw new AppError('invalid token', 401);

  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadPart))) as JwtPayload;
  if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError('token expired', 401);
  }
  return String(payload.sub);
}
