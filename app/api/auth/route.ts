import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { signToken, getSession, setSessionCookie, clearSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting for login
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const limitWindow = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;
  
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + limitWindow });
    return { allowed: true, remaining: maxAttempts - 1, resetSeconds: Math.ceil(limitWindow / 1000) };
  }
  
  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetSeconds: Math.ceil((record.resetTime - now) / 1000) };
  }
  
  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count, resetSeconds: Math.ceil((record.resetTime - now) / 1000) };
}

// GET — Check if a user account is still active (used by layout to force-logout paused users)
export async function GET(req: Request) {
  try {
    let userId = null;
    
    // 1. Try session first
    const session = await getSession(req);
    if (session) {
      userId = session.userId;
    } else {
      // 2. Fallback to query param
      const url = new URL(req.url);
      userId = url.searchParams.get('userId');
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId, 'isActive').lean() as any;
    if (!user) {
      return NextResponse.json({ isActive: false, reason: 'deleted' });
    }

    const active = user.isActive !== false;
    return NextResponse.json({ isActive: active, ...(!active ? { reason: 'paused' } : {}) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Block paused accounts
    if (user.isActive === false) {
      return NextResponse.json({ error: 'Your account has been paused by the administrator. Please contact admin.' }, { status: 403 });
    }

    // Reset login attempts on successful login
    loginAttempts.delete(ip);

    // Sign JWT token
    const token = await signToken({
      userId: user._id.toString(),
      role: user.role,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName || user.username,
      },
    });

    // Set JWT in HTTP-only cookie
    setSessionCookie(response, token);

    return response;
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// DELETE — Logout (clear the cookie)
export async function DELETE(req: Request) {
  try {
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

