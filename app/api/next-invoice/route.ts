import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';

// GET /api/next-invoice?customerName=XYZ&createdBy=user123
// Returns the next invoice number for the given customer
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerName = searchParams.get('customerName');
    const createdBy = searchParams.get('createdBy');

    if (!customerName) {
      return NextResponse.json({ error: 'customerName is required' }, { status: 400 });
    }

    await dbConnect();

    // Find the highest invoice number for this customer
    const query: any = {
      customerName: { $regex: new RegExp(`^${customerName}$`, 'i') },
      invoiceEnabled: true,
      invoiceNumber: { $gt: 0 },
    };
    if (createdBy) {
      query.createdBy = createdBy;
    }

    const lastInvoice = await BatchReport.findOne(query)
      .sort({ invoiceNumber: -1 })
      .select('invoiceNumber')
      .lean();

    const nextNumber = lastInvoice ? (lastInvoice.invoiceNumber || 0) + 1 : 1;

    return NextResponse.json({ nextInvoiceNumber: nextNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
