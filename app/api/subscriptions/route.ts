import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/lib/models/Subscription';
import Setting from '@/lib/models/Setting';
import { requireAuth, requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET — Get subscription status for a user, or all subscriptions for admin
export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const all = url.searchParams.get('all');

    // Admin: get all subscriptions
    if (all === 'true') {
      const auth = await requireAdmin(req);
      if (!auth.authorized) return auth.response;

      const subs = await Subscription.find({}).sort({ createdAt: -1 });
      return NextResponse.json(subs);
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    // Enforce IDOR protection: non-admins can only check their own status
    if (auth.session.role !== 'admin' && auth.session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: You can only view your own subscription' }, { status: 403 });
    }

    // Find user's latest subscription
    const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });

    if (!sub) {
      // No subscription
      return NextResponse.json({ status: 'none' });
    }

    // Check if expired
    const now = new Date();
    if (sub.endDate < now && sub.status !== 'expired') {
      sub.status = 'expired';
      await sub.save();
    }

    const daysLeft = Math.max(0, Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      _id: sub._id,
      status: sub.status,
      planName: sub.planName,
      startDate: sub.startDate,
      endDate: sub.endDate,
      daysLeft,
      trialUsed: sub.trialUsed,
      amount: sub.amount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Start trial or activate subscription
export async function POST(req: Request) {
  try {
    const { userId, action, planId, planName, amount, durationDays } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    // IDOR check: users can only initialize trials / activate for themselves unless admin
    if (auth.session.role !== 'admin' && auth.session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Unauthorized action on this user subscription' }, { status: 403 });
    }

    await dbConnect();

    if (action === 'start-trial') {
      if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });
      // Check if trial already used
      const existingTrial = await Subscription.findOne({ userId, trialUsed: true });
      if (existingTrial) {
        return NextResponse.json({ error: 'Trial already used' }, { status: 400 });
      }

      const SubscriptionPlan = (await import('@/lib/models/SubscriptionPlan')).default;
      const plan = await SubscriptionPlan.findById(planId) as any;
      if (!plan || !plan.trialDays || plan.trialDays <= 0) {
        return NextResponse.json({ error: 'Trial not available for this plan' }, { status: 400 });
      }

      const now = new Date();
      const endDate = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);

      const sub = await Subscription.create({
        userId,
        status: 'trial',
        startDate: now,
        endDate,
        trialUsed: true,
        planId: plan._id,
        planName: `${plan.name} (${plan.trialDays}-Day Trial)`,
        amount: 0,
      });

      return NextResponse.json(sub);
    }

    if (action === 'activate') {
      // Called after successful payment or manual activation
      if (!durationDays) {
        return NextResponse.json({ error: 'durationDays required' }, { status: 400 });
      }

      const now = new Date();
      // Check if there is an existing active or trial subscription that hasn't expired yet
      const activeSub = await Subscription.findOne({
        userId,
        status: { $in: ['trial', 'active'] },
        endDate: { $gt: now },
      }).sort({ endDate: -1 });

      let newEndDate: Date;
      if (activeSub) {
        newEndDate = new Date(activeSub.endDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      } else {
        newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      // Mark old subscriptions as expired
      await Subscription.updateMany(
        { userId, status: { $in: ['trial', 'active'] } },
        { status: 'expired' }
      );

      const sub = await Subscription.create({
        userId,
        planId: planId || 'custom',
        planName: planName || 'Custom Manual Plan',
        status: 'active',
        startDate: now,
        endDate: newEndDate,
        trialUsed: true, // consuming trial since they paid
        amount: amount || 0,
      });

      return NextResponse.json(sub);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH — Admin: manually extend or update subscription
export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const { userId, action, extraDays, remainingDays, planName, amount } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    await dbConnect();

    const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
    if (!sub) {
      return NextResponse.json({ error: 'No subscription found for this user' }, { status: 404 });
    }

    if (action === 'set-remaining') {
      if (remainingDays === undefined) {
        return NextResponse.json({ error: 'remainingDays required' }, { status: 400 });
      }
      const now = new Date();
      sub.endDate = new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);
      sub.status = remainingDays > 0 ? 'active' : 'expired';
      if (planName !== undefined) sub.planName = planName;
      if (amount !== undefined) sub.amount = amount;
      await sub.save();
      return NextResponse.json(sub);
    }

    // Default legacy extend action
    if (!extraDays) {
      return NextResponse.json({ error: 'extraDays or action required' }, { status: 400 });
    }

    // Extend from current endDate (or from now if already expired)
    const base = sub.endDate > new Date() ? sub.endDate : new Date();
    sub.endDate = new Date(base.getTime() + extraDays * 24 * 60 * 60 * 1000);
    sub.status = 'active';
    await sub.save();

    return NextResponse.json(sub);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

