import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SubscriptionPlan from '@/lib/models/SubscriptionPlan';

export const dynamic = 'force-dynamic';

// GET — List plans (active only for users, all for admin)
export async function GET(req: Request) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const all = url.searchParams.get('all');
    const query = all === 'true' ? {} : { isActive: true };
    const plans = await SubscriptionPlan.find(query).sort({ order: 1, price: 1 });
    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — Create a new plan (admin only)
export async function POST(req: Request) {
  try {
    const data = await req.json();
    await dbConnect();
    const plan = await SubscriptionPlan.create(data);
    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH — Update a plan (admin only)
export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

    await dbConnect();
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, updates, { new: true });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    return NextResponse.json(plan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE — Delete a plan (admin only)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

    await dbConnect();
    await SubscriptionPlan.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
