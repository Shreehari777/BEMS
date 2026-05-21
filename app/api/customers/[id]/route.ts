import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    
    const customer = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await dbConnect();
    
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
