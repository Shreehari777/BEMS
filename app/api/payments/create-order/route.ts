import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/lib/models/SubscriptionPlan';
import Payment from '@/lib/models/Payment';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(req: Request) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: 'planId and userId required' }, { status: 400 });
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
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `sub_${userId}_${Date.now()}`,
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
