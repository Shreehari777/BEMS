import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

// GET — Check if a user account is still active (used by layout to force-logout paused users)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId, 'isActive') as any;
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
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ username: username.trim() }) as any;

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

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        displayName: user.displayName || user.username,
      },
    });
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
