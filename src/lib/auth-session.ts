const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return buffer;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function createSessionToken(
  userId: string,
  accessToken: string,
  secret: string,
  maxAge = SESSION_DURATION_SECONDS,
): Promise<string> {
  if (secret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET must contain at least 32 characters.');
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(
    JSON.stringify({
      sub: userId,
      accessToken,
      exp: Math.floor(Date.now() / 1000) + Math.min(SESSION_DURATION_SECONDS, maxAge),
    }),
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    await getEncryptionKey(secret),
    toArrayBuffer(payload),
  );

  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
}

export interface AuthSession {
  userId: string;
  accessToken: string;
  expiresAt: number;
}

export async function readSession(
  token: string | undefined,
  secret: string | undefined,
): Promise<AuthSession | null> {
  if (!token || !secret || secret.length < 32) {
    return null;
  }

  const separatorIndex = token.indexOf('.');
  if (separatorIndex < 1) {
    return null;
  }

  try {
    const iv = fromBase64Url(token.slice(0, separatorIndex));
    const ciphertext = fromBase64Url(token.slice(separatorIndex + 1));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      await getEncryptionKey(secret),
      ciphertext,
    );

    const payload = JSON.parse(new TextDecoder().decode(decrypted)) as {
      sub?: unknown;
      accessToken?: unknown;
      exp?: unknown;
    };

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.accessToken !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { userId: payload.sub, accessToken: payload.accessToken, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<boolean> {
  return (await readSession(token, secret)) !== null;
}

export const SESSION_COOKIE_NAME = 'priceverify_session';
export const SESSION_DURATION = SESSION_DURATION_SECONDS;
