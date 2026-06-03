import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/lib/models/Payment';
import Subscription from '@/lib/models/Subscription';
import SubscriptionPlan from '@/lib/models/SubscriptionPlan';
import crypto from 'crypto';
import { requireAuth } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId,
    } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // IDOR protection check
    if (auth.session.role !== 'admin' && auth.session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Cannot verify payments for another user' }, { status: 403 });
    }

    // Verify Razorpay signature (HMAC SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: 'Payment verification failed — invalid signature' }, { status: 400 });
    }

    await dbConnect();

    // Update payment record and return the updated document
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
      },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    // Look up actual subscription plan to get durationDays and verify details
    const plan = await SubscriptionPlan.findById(payment.planId);
    if (!plan) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    const durationDays = plan.durationDays;

    // Check if there is an existing active or trial subscription that hasn't expired yet
    const now = new Date();
    const activeSub = await Subscription.findOne({
      userId,
      status: { $in: ['trial', 'active'] },
      endDate: { $gt: now },
    }).sort({ endDate: -1 });

    let newEndDate: Date;
    if (activeSub) {
      // Extend from the existing endDate
      newEndDate = new Date(activeSub.endDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      // Start from now
      newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    // Mark old subscriptions as expired
    await Subscription.updateMany(
      { userId, status: { $in: ['trial', 'active'] } },
      { status: 'expired' }
    );

    const sub = await Subscription.create({
      userId,
      planId: payment.planId,
      planName: payment.planName || plan.name || '',
      status: 'active',
      startDate: now,
      endDate: newEndDate,
      trialUsed: true,
      amount: payment.amount || plan.price || 0,
    });

    return NextResponse.json({ success: true, subscription: sub });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}

