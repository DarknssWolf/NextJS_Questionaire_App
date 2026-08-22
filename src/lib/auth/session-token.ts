import { SignJWT, jwtVerify } from 'jose';
import { type SessionPayload } from '@/types/globals';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET environment variable is required and must be at least 32 characters'
  );
}

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function signSessionToken(
  payload: SessionPayload
): Promise<string> {
  const { sub, ...claims } = payload;

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub.toString())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    return {
      ...payload,
      sub: Number(payload.sub),
    } as SessionPayload;
  } catch {
    return null;
  }
}
