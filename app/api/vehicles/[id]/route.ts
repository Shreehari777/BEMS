import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';
import { requireAuth } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    
    const existingVehicle = await Vehicle.findById(id).lean() as any;
    if (!existingVehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (auth.session.role !== 'admin' && existingVehicle.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to update this vehicle' }, { status: 403 });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;

    await dbConnect();
    
    const existingVehicle = await Vehicle.findById(id).lean() as any;
    if (!existingVehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (auth.session.role !== 'admin' && existingVehicle.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this vehicle' }, { status: 403 });
    }

    await Vehicle.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

