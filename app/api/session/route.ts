import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Customer from '@/lib/models/Customer';
import Vehicle from '@/lib/models/Vehicle';
import Recipe from '@/lib/models/Recipe';
import BatchReport from '@/lib/models/BatchReport';
import Subscription from '@/lib/models/Subscription';
import SubscriptionPlan from '@/lib/models/SubscriptionPlan';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * One DB connection + one HTTP round-trip for dashboard shell:
 * subscription, plans, and (for operators) bootstrap data.
 */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;
    const userId = auth.session.userId;
    const role = auth.session.role;

    await dbConnect();

    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ order: 1, price: 1 }).lean();

    let subscription: Record<string, unknown> = { status: 'active' };
    if (userId && role !== 'admin') {
      const sub = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
      if (!sub) {
        subscription = { status: 'none' };
      } else {
        const now = new Date();
        if (sub.endDate < now && sub.status !== 'expired') {
          sub.status = 'expired';
          await sub.save();
        }
        const daysLeft = Math.max(
          0,
          Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        );
        subscription = {
          _id: sub._id,
          status: sub.status,
          planName: sub.planName,
          startDate: sub.startDate,
          endDate: sub.endDate,
          daysLeft,
          trialUsed: sub.trialUsed,
          amount: sub.amount,
        };
      }
    }

    let bootstrap = null;
    if (userId && role !== 'admin') {
      const ownerQuery = { createdBy: userId };
      const [customers, vehicles, recipes, lastReport, maxOrderAgg] = await Promise.all([
        Customer.find(ownerQuery).sort({ createdAt: -1 }).lean(),
        Vehicle.find(ownerQuery).sort({ createdAt: -1 }).lean(),
        Recipe.find({}).sort({ createdAt: -1 }).lean(),
        BatchReport.findOne(ownerQuery).sort({ docketNumber: -1 }).select('docketNumber').lean(),
        BatchReport.aggregate([
          { $match: ownerQuery },
          { $addFields: { orderNum: { $toInt: { $ifNull: ['$orderNumber', '0'] } } } },
          { $group: { _id: '$customerName', maxOrder: { $max: '$orderNum' } } },
        ]),
      ]);

      // Dynamically compute max order number per customer from aggregation results
      const maxOrderByCustomer = new Map<string, number>();
      let maxOrderNumber = 0;
      for (const item of maxOrderAgg) {
        const key = String(item._id || '').toLowerCase();
        const num = item.maxOrder || 0;
        if (num > maxOrderNumber) maxOrderNumber = num;
        if (key) maxOrderByCustomer.set(key, num);
      }

      const nextOrderNumber = maxOrderNumber + 1;

      bootstrap = {
        customers: customers.map((c) => ({
          ...c,
          lastOrderNumber: maxOrderByCustomer.get(String(c.name).toLowerCase()) || 0,
        })),
        vehicles,
        recipes,
        nextDocketNumber: lastReport
          ? parseInt(String(lastReport.docketNumber), 10) + 1 || 1
          : 1,
        nextOrderNumber,
      };
    }

    return NextResponse.json({ subscription, plans, bootstrap });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

