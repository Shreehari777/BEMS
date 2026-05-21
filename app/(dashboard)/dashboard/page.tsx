'use client';

import { useEffect, useState, useContext } from 'react';
import {
  FileText,
  CalendarDays,
  BarChart3,
  Loader2,
  Users,
  UserCheck,
  UserX,
  CreditCard,
  IndianRupee,
  Clock,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { TabContext } from '@/lib/TabContext';

interface DashboardData {
  todayCount: number;
  monthCount: number;
  totalCount: number;
  userSummary: {
    totalUsers: number;
    activeUsers: number;
    pausedUsers: number;
    activeSubCount: number;
    expiredSubCount: number;
    noPlanCount: number;
  };
  expiringSoon: {
    userId: string;
    displayName: string;
    planName: string;
    daysLeft: number;
    endDate: string;
  }[];
  revenue: {
    totalRevenue: number;
    monthRevenue: number;
    totalPayments: number;
  };
  recentPayments: {
    _id: string;
    userName: string;
    planName: string;
    amount: number;
    date: string;
  }[];
  docketsPerUser: {
    userId: string;
    displayName: string;
    docketCount: number;
  }[];
}

export default function DashboardPage() {
  const activeTab = useContext(TabContext);
  const isActive = activeTab === 'Dashboard';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) return;
    // Only show spinner on first load; silently refresh when data already cached
    if (!data) setLoading(true);
    fetch('/api/dashboard?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isActive]);

  if (loading || !data) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const formatCurrency = (val: number) =>
    '₹' + val.toLocaleString('en-IN');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      {/* ======= REPORT STATS ======= */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Report Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={FileText}
            label="Today's Reports"
            value={data.todayCount}
            color="blue"
          />
          <StatCard
            icon={CalendarDays}
            label="This Month"
            value={data.monthCount}
            color="indigo"
          />
          <StatCard
            icon={BarChart3}
            label="Total Reports"
            value={data.totalCount}
            color="purple"
          />
        </div>
      </div>

      {/* ======= USER SUMMARY ======= */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" />
          User Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MiniCard icon={Users} label="Total Users" value={data.userSummary.totalUsers} color="slate" />
          <MiniCard icon={UserCheck} label="Active Subs" value={data.userSummary.activeSubCount} color="green" />
          <MiniCard icon={Clock} label="Expired" value={data.userSummary.expiredSubCount} color="red" />
          <MiniCard icon={UserX} label="No Plan" value={data.userSummary.noPlanCount} color="amber" />
          <MiniCard icon={UserX} label="Paused" value={data.userSummary.pausedUsers} color="orange" />
        </div>
      </div>

      {/* ======= REVENUE OVERVIEW ======= */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-600" />
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={TrendingUp}
            label="This Month Revenue"
            value={formatCurrency(data.revenue.monthRevenue)}
            color="emerald"
          />
          <StatCard
            icon={IndianRupee}
            label="Total Revenue"
            value={formatCurrency(data.revenue.totalRevenue)}
            color="green"
          />
          <StatCard
            icon={Receipt}
            label="Total Payments"
            value={data.revenue.totalPayments}
            color="teal"
          />
        </div>
      </div>

      {/* ======= BOTTOM GRID: 3 Tables ======= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Soon */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-700">Expiring in 7 Days</h3>
          </div>
          {data.expiringSoon.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No subscriptions expiring soon
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.expiringSoon.map((item) => (
                <div key={item.userId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.displayName}</p>
                    <p className="text-xs text-slate-400">{item.planName}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.daysLeft <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.daysLeft}d left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-slate-700">Recent Payments</h3>
          </div>
          {data.recentPayments.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No payments yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentPayments.map((p) => (
                <div key={p._id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.userName}</p>
                    <p className="text-xs text-slate-400">{p.planName} · {formatDate(p.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dockets Per User */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Dockets Per User</h3>
          </div>
          {data.docketsPerUser.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No dockets created yet
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.docketsPerUser.map((d) => (
                <div key={d.userId} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                      {d.displayName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-slate-700">{d.displayName}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {d.docketCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Reusable Card Components ---- */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`${c.bg} p-5 rounded-xl border border-slate-200/60`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`${c.iconBg} p-2 rounded-lg`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <h3 className={`text-2xl font-bold ${c.text}`}>{value}</h3>
    </div>
  );
}

function MiniCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, { text: string; dot: string }> = {
    slate: { text: 'text-slate-700', dot: 'bg-slate-400' },
    green: { text: 'text-green-700', dot: 'bg-green-500' },
    red: { text: 'text-red-700', dot: 'bg-red-500' },
    amber: { text: 'text-amber-700', dot: 'bg-amber-500' },
    orange: { text: 'text-orange-700', dot: 'bg-orange-500' },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <h3 className={`text-2xl font-bold ${c.text}`}>{value}</h3>
    </div>
  );
}
