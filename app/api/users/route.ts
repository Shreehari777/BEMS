import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET — List only regular users (excludes admin, passwords excluded)
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    await dbConnect();
    const users = await User.find({ role: 'user' }, '-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Create a new user (admin only)
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const { username, password, displayName } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    await dbConnect();

    // Check if username already exists
    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Always create as 'user' role — only seed-admin.js creates admins
    const user = await User.create({
      username: username.trim(),
      password, // hashed by pre-save hook
      role: 'user',
      displayName: displayName || username.trim(),
    });

    return NextResponse.json({
      _id: user._id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE — Delete a user by ID (admin only, cannot delete admin)
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete the admin account' }, { status: 403 });
    }

    // Cascade delete related records
    const BatchReport = (await import('@/lib/models/BatchReport')).default;
    const Customer = (await import('@/lib/models/Customer')).default;
    const Vehicle = (await import('@/lib/models/Vehicle')).default;
    const Subscription = (await import('@/lib/models/Subscription')).default;
    const Payment = (await import('@/lib/models/Payment')).default;

    await Promise.all([
      User.findByIdAndDelete(id),
      BatchReport.deleteMany({ createdBy: id }),
      Customer.deleteMany({ createdBy: id }),
      Vehicle.deleteMany({ createdBy: id }),
      Subscription.deleteMany({ userId: id }),
      Payment.deleteMany({ userId: id }),
    ]);

    return NextResponse.json({ success: true, message: 'User and all related data deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — Toggle user active status (admin only) + freeze/unfreeze subscription days
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- Reset Password ---
    if (body.resetPassword) {
      const newPassword = body.password;
      if (!newPassword || newPassword.length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
      }
      if (user.role === 'admin') {
        return NextResponse.json({ error: 'Cannot reset admin password from here' }, { status: 403 });
      }
      user.password = newPassword; // pre-save hook will hash it
      await user.save();
      return NextResponse.json({ success: true, message: 'Password reset successfully' });
    }

    // --- Toggle Active Status ---
    const { isActive } = body;
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive (boolean) is required' }, { status: 400 });
    }

    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Cannot pause the admin account' }, { status: 403 });
    }

    user.isActive = isActive;
    await user.save();

    // Freeze or unfreeze subscription days
    const Subscription = (await import('@/lib/models/Subscription')).default;
    const sub = await Subscription.findOne({ userId: id }).sort({ createdAt: -1 }) as any;

    if (sub) {
      const now = new Date();

      if (!isActive && (sub.status === 'active' || sub.status === 'trial')) {
        // PAUSING: freeze the remaining days
        const daysLeft = Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        sub.pausedDaysLeft = daysLeft;
        sub.status = 'paused';
        await sub.save();
      } else if (isActive && sub.status === 'paused' && sub.pausedDaysLeft > 0) {
        // UNPAUSING: restore the frozen days from now
        sub.endDate = new Date(now.getTime() + sub.pausedDaysLeft * 24 * 60 * 60 * 1000);
        sub.status = 'active';
        sub.pausedDaysLeft = 0;
        await sub.save();
      }
    }

    return NextResponse.json({ success: true, isActive: user.isActive });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

