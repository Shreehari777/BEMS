import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is missing in production!');
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bems-dev-secret-change-in-production-surjanrmc'
);

export async function signToken(payload: { userId: string; role: string; username: string }) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; role: string; username: string };
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
}


async function getSessionToken(req: Request) {
  // First try request header cookies (useful for middleware / request-based parsing)
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/session=([^;]+)/);
  if (match) return match[1];

  // Fallback to Next.js cookie store
  try {
    const cookieStore = await cookies();
    return cookieStore.get('session')?.value;
  } catch {
    return undefined;
  }
}

export async function getSession(req: Request) {
  const token = await getSessionToken(req);
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth(req: Request) {
  const session = await getSession(req);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
      session: null as any,
    };
  }
  return {
    authorized: true,
    response: null as any,
    session,
  };
}

export async function requireAdmin(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.authorized) return auth;
  if (auth.session.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
      session: auth.session,
    };
  }
  return auth;
}

export function escapeRegex(string: string): string {
  if (typeof string !== 'string') return '';
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function truncate(str: string, maxLength: number = 200): string {
  if (typeof str !== 'string') return '';
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}
