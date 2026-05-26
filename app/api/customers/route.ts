import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    const query = userId ? { createdBy: userId } : {};
    const customers = await Customer.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const userId = req.headers.get('x-user-id') || '';
    await dbConnect();
    const customer = await Customer.create({ ...data, createdBy: userId });
    return NextResponse.json(customer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    const query = userId ? { createdBy: userId } : {};
    await Customer.deleteMany(query);
    return NextResponse.json({ success: true, message: 'Customers deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
