import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;

    await dbConnect();
    const query = auth.session.role === 'admin' ? {} : { createdBy: userId };
    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(vehicles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;

    const data = await req.json();
    await dbConnect();
    const vehicle = await Vehicle.create({ ...data, createdBy: userId });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;

    await dbConnect();
    const query = auth.session.role === 'admin' ? {} : { createdBy: userId };
    await Vehicle.deleteMany(query);
    return NextResponse.json({ success: true, message: 'Vehicles deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

