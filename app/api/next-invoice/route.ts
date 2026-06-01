import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';
import { requireAuth } from '@/lib/session';

// GET /api/next-invoice
// Returns the next invoice number across all customers (common count)
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;

    await dbConnect();

    // Find the highest invoice number across all customers
    const query: any = {
      invoiceEnabled: true,
      invoiceNumber: { $gt: 0 },
    };
    if (auth.session.role !== 'admin') {
      query.createdBy = userId;
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

