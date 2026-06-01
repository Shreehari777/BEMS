import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/lib/models/SubscriptionPlan';
import Payment from '@/lib/models/Payment';
import { requireAuth } from '@/lib/session';

// Prevent Next.js/Turbopack from evaluating this route at build time
export const dynamic = 'force-dynamic';

// Lazy initialize Razorpay client using dynamic import to avoid build-time module evaluation errors
async function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are not configured.');
  }

  const Razorpay = (await import('razorpay')).default;
  return new Razorpay({
    key_id,
    key_secret,
  });
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: 'planId and userId required' }, { status: 400 });
    }

    // IDOR protection check
    if (auth.session.role !== 'admin' && auth.session.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Cannot create orders for another user' }, { status: 403 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay not configured. Contact admin.' }, { status: 500 });
    }

    await dbConnect();

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create Razorpay order
    const razorpay = await getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `s_${userId.slice(-8)}_${Date.now()}`,
      notes: {
        userId,
        planId,
        planName: plan.name,
      },
    });

    // Save payment record
    await Payment.create({
      userId,
      planId,
      planName: plan.name,
      amount: plan.price,
      razorpayOrderId: order.id,
      status: 'created',
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}

