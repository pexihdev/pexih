import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { APIContext } from 'astro';

const JWT_SECRET = new TextEncoder().encode(
  import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'pexih-super-secret-key-change-me'
);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: any) {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  return jwt;
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromCookies(cookies: APIContext['cookies']) {
  const token = cookies.get('pexih_session')?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export function setSessionCookie(cookies: APIContext['cookies'], token: string) {
  cookies.set('pexih_session', token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

export function clearSessionCookie(cookies: APIContext['cookies']) {
  cookies.delete('pexih_session', { path: '/' });
}
