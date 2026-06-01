import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';

// GET /api/next-invoice?createdBy=user123
// Returns the next invoice number across all customers (common count)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const createdBy = searchParams.get('createdBy');

    await dbConnect();

    // Find the highest invoice number across all customers
    const query: any = {
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
