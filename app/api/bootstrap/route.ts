import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';
import Vehicle from '@/lib/models/Vehicle';
import Recipe from '@/lib/models/Recipe';
import BatchReport from '@/lib/models/BatchReport';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Single round-trip for New Entry initial load (one DB connection). */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;

    await dbConnect();
    const ownerQuery = auth.session.role === 'admin' ? {} : { createdBy: userId };

    const [customers, vehicles, recipes, lastReport, reports] = await Promise.all([
      Customer.find(ownerQuery).sort({ createdAt: -1 }).lean(),
      Vehicle.find(ownerQuery).sort({ createdAt: -1 }).lean(),
      Recipe.find({}).sort({ createdAt: -1 }).lean(),
      BatchReport.findOne(ownerQuery).sort({ docketNumber: -1 }).select('docketNumber').lean(),
      BatchReport.find(ownerQuery).select('customerName orderNumber').lean(),
    ]);

    const maxOrderByCustomer = new Map<string, number>();
    for (const r of reports) {
      const key = String(r.customerName || '').toLowerCase();
      const num = parseInt(String(r.orderNumber), 10);
      if (!key || Number.isNaN(num)) continue;
      maxOrderByCustomer.set(key, Math.max(maxOrderByCustomer.get(key) || 0, num));
    }

    const customersWithOrders = customers.map((c) => ({
      ...c,
      lastOrderNumber: maxOrderByCustomer.get(String(c.name).toLowerCase()) || 0,
    }));

    const nextDocketNumber = lastReport
      ? parseInt(String(lastReport.docketNumber), 10) + 1 || 1
      : 1;

    return NextResponse.json({
      customers: customersWithOrders,
      vehicles,
      recipes,
      nextDocketNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

