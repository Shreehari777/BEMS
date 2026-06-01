import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BatchReport from '@/lib/models/BatchReport';
import User from '@/lib/models/User';
import Subscription from '@/lib/models/Subscription';
import Payment from '@/lib/models/Payment';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    await dbConnect();


    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // --- Batch Report Stats ---
    const [todayCount, monthCount, totalCount] = await Promise.all([
      BatchReport.countDocuments({ date: { $gte: today } }),
      BatchReport.countDocuments({ date: { $gte: startOfMonth } }),
      BatchReport.countDocuments(),
    ]);

    // --- User Summary ---
    const allUsers = await User.find({ role: 'user' }, '_id displayName username isActive').lean() as any[];
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((u: any) => u.isActive !== false).length;
    const pausedUsers = totalUsers - activeUsers;

    // Use aggregation pipeline to get latest sub per user in the DB
    const latestSubs = await Subscription.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$userId', sub: { $first: '$$ROOT' } } },
    ]);
    const latestSubByUser: Record<string, any> = {};
    for (const item of latestSubs) {
      if (item._id) {
        latestSubByUser[item._id.toString()] = item.sub;
      }
    }

    let activeSubCount = 0;
    let expiredSubCount = 0;
    let noPlanCount = 0;
    const expiringSoon: any[] = [];

    for (const user of allUsers) {
      const sub = latestSubByUser[user._id.toString()];
      if (!sub) {
        noPlanCount++;
        continue;
      }
      const endDate = new Date(sub.endDate);
      const isActive = (sub.status === 'active' || sub.status === 'trial') && endDate > now;
      const isPaused = sub.status === 'paused';

      if (isActive) {
        activeSubCount++;
        // Check if expiring within 7 days
        if (endDate <= sevenDaysFromNow) {
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expiringSoon.push({
            userId: user._id,
            displayName: user.displayName || user.username,
            planName: sub.planName || 'Unknown',
            daysLeft,
            endDate: sub.endDate,
          });
        }
      } else if (isPaused) {
        // Count paused subs as their own category (user is paused)
        activeSubCount++; // still has a valid sub, just paused
      } else {
        expiredSubCount++;
      }
    }

    // Sort expiring soon by days left (ascending)
    expiringSoon.sort((a, b) => a.daysLeft - b.daysLeft);

    const [revenueStats, recentPayments] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalPayments: { $sum: 1 },
            monthRevenue: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', startOfMonth] },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]),
      Payment.find({ status: 'paid' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]) as [any[], any[]];

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const monthRevenue = revenueStats[0]?.monthRevenue || 0;
    const totalPaymentsCount = revenueStats[0]?.totalPayments || 0;

    // Map user names to recent payments
    const userMap: Record<string, string> = {};
    for (const u of allUsers) {
      userMap[u._id.toString()] = u.displayName || u.username;
    }
    const recentPaymentsWithNames = recentPayments.map((p: any) => ({
      _id: p._id,
      userName: userMap[p.userId] || 'Unknown',
      planName: p.planName,
      amount: p.amount,
      date: p.createdAt,
    }));

    // --- Dockets Per User ---
    const docketAggregation = await BatchReport.aggregate([
      { $group: { _id: '$createdBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Map createdBy (userId) to display names
    const docketsPerUser = docketAggregation.map((d: any) => ({
      userId: d._id,
      displayName: userMap[d._id] || d._id || 'Unknown',
      docketCount: d.count,
    }));

    return NextResponse.json({
      // Existing
      todayCount,
      monthCount,
      totalCount,
      // User summary
      userSummary: {
        totalUsers,
        activeUsers,
        pausedUsers,
        activeSubCount,
        expiredSubCount,
        noPlanCount,
      },
      // Expiring soon
      expiringSoon,
      // Revenue
      revenue: {
        totalRevenue,
        monthRevenue,
        totalPayments: totalPaymentsCount,
      },
      recentPayments: recentPaymentsWithNames,
      // Dockets per user
      docketsPerUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
