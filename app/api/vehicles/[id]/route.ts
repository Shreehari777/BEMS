import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    
    const vehicle = await Vehicle.findByIdAndUpdate(id, body, { new: true });
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await dbConnect();
    
    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
