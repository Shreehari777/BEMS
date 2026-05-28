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

    // Dynamically calculate lastOrderNumber based on actual reports in the database
    const updatedCustomers = await Promise.all(customers.map(async (c) => {
      const reports = await BatchReport.find({ 
        customerName: { $regex: new RegExp(`^${c.name}$`, 'i') }, 
        createdBy: c.createdBy 
      }).select('orderNumber').lean();
      
      let maxOrder = 0;
      reports.forEach(r => {
        const num = parseInt(r.orderNumber, 10);
        if (!isNaN(num) && num > maxOrder) {
          maxOrder = num;
        }
      });
      
      return {
        ...c,
        lastOrderNumber: maxOrder
      };
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
