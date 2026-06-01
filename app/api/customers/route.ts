import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';
import BatchReport from '@/lib/models/BatchReport';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id') || '';
    const query = userId ? { createdBy: userId } : {};
    const customers = await Customer.find(query).sort({ createdAt: -1 }).lean();

    const reports = await BatchReport.find(query).select('customerName orderNumber').lean();
    const maxOrderByCustomer = new Map<string, number>();
    for (const r of reports) {
      const key = String(r.customerName || '').toLowerCase();
      const num = parseInt(String(r.orderNumber), 10);
      if (!key || Number.isNaN(num)) continue;
      maxOrderByCustomer.set(key, Math.max(maxOrderByCustomer.get(key) || 0, num));
    }

    const updatedCustomers = customers.map((c) => ({
      ...c,
      lastOrderNumber: maxOrderByCustomer.get(String(c.name).toLowerCase()) || 0,
    }));

    return NextResponse.json(updatedCustomers);
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
