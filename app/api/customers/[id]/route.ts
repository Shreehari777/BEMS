import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';
import { requireAuth } from '@/lib/session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    
    const existingCustomer = await Customer.findById(id).lean() as any;
    if (!existingCustomer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (auth.session.role !== 'admin' && existingCustomer.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to update this customer' }, { status: 403 });
    }

    const customer = await Customer.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json(customer);
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
    
    const existingCustomer = await Customer.findById(id).lean() as any;
    if (!existingCustomer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (auth.session.role !== 'admin' && existingCustomer.createdBy !== auth.session.userId) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to delete this customer' }, { status: 403 });
    }

    await Customer.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

