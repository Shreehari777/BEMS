import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    const query = userId ? { createdBy: userId } : {};
    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    return NextResponse.json(vehicles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const userId = req.headers.get('x-user-id') || '';
    await dbConnect();
    const vehicle = await Vehicle.create({ ...data, createdBy: userId });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    const query = userId ? { createdBy: userId } : {};
    await Vehicle.deleteMany(query);
    return NextResponse.json({ success: true, message: 'Vehicles deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
