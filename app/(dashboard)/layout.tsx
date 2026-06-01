'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus2,
  Users,
  Truck,
  ClipboardList,
  History,
  LogOut,
  Menu,
  X,
  UserCog,
  Shield,
  User,
  CreditCard,
} from 'lucide-react';

import SubscriptionPopup from '@/components/SubscriptionPopup';
import { authHeaders } from '@/lib/auth';
import {
  CACHE_TTL,
  invalidateCache,
  peekCache,
  safeCachedFetch,
  seedCache,
  setupCacheInvalidationListener,
} from '@/lib/api-cache';
import { TabContext } from '@/lib/TabContext';

const tabLoading = () => (
  <div className="min-h-[300px] space-y-6 animate-pulse p-2">
    <div className="flex items-center justify-between">
      <div className="h-7 w-48 bg-slate-200 rounded-lg" />
      <div className="h-9 w-32 bg-slate-200 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-3">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="h-6 w-16 bg-slate-200 rounded" />
          <div className="h-3 w-32 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
      <div className="h-5 w-36 bg-slate-200 rounded" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-3/4 bg-slate-100 rounded" />
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const DashboardPage = dynamic(() => import('./dashboard/page'), { loading: tabLoading });
const NewEntryPage = dynamic(() => import('./new-entry/page'), { loading: tabLoading });
const CustomersPage = dynamic(() => import('./customers/page'), { loading: tabLoading });
const VehiclesPage = dynamic(() => import('./vehicles/page'), { loading: tabLoading });
const RecipesPage = dynamic(() => import('./recipes/page'), { loading: tabLoading });
const HistoryPage = dynamic(() => import('./history/page'), { loading: tabLoading });
const ManageUsersPage = dynamic(() => import('./manage-users/page'), { loading: tabLoading });
const ManagePlansPage = dynamic(() => import('./manage-plans/page'), { loading: tabLoading });
const PricingPage = dynamic(() => import('./pricing/page'), { loading: tabLoading });

const ADMIN_ITEMS = [
  { name: 'Dashboard', component: DashboardPage, icon: LayoutDashboard },
  { name: 'Manage Users', component: ManageUsersPage, icon: UserCog },
  { name: 'Manage Plans', component: ManagePlansPage, icon: CreditCard },
];

const USER_ITEMS = [
  { name: 'New Entry', component: NewEntryPage, icon: FilePlus2 },
  { name: 'Add Customer', component: CustomersPage, icon: Users },
  { name: 'Add Vehicle', component: VehiclesPage, icon: Truck },
  { name: 'Edit Recipe', component: RecipesPage, icon: ClipboardList },
  { name: 'History', component: HistoryPage, icon: History },
  { name: 'Pricing', component: PricingPage, icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [subDaysLeft, setSubDaysLeft] = useState(0);
  const [subData, setSubData] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [initialSubChecked, setInitialSubChecked] = useState(false);
  const [showSubPopup, setShowSubPopup] = useState(false);
  const [cachedPlans, setCachedPlans] = useState<any[]>([]);
  const [visitedTabs, setVisitedTabs] = useState<string[]>([]);
  const [dbOffline, setDbOffline] = useState(false);
  const router = useRouter();

  useEffect(() => setupCacheInvalidationListener(), []);

  useEffect(() => {
    if (!activeTab) return;
    setVisitedTabs((prev) => (prev.includes(activeTab) ? prev : [...prev, activeTab]));
  }, [activeTab]);

  useEffect(() => {
    const raw = localStorage.getItem('bems_user');
    if (!raw) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(raw);
      setCurrentUser(user);
      setActiveTab(user.role === 'admin' ? 'Dashboard' : 'New Entry');
    } catch {
      localStorage.removeItem('bems_user');
      router.push('/login');
    }
    setAuthChecked(true);
  }, [router]);

  const applySession = (
    data: {
      subscription: any;
      plans: any[];
      bootstrap?: {
        customers: unknown[];
        vehicles: unknown[];
        recipes: unknown[];
        nextDocketNumber: number;
      } | null;
    },
    headers: Record<string, string>,
  ) => {
    const sub = data.subscription;
    setSubStatus(sub?.status || 'none');
    setSubDaysLeft(sub?.daysLeft || 0);
    setSubData(sub);
    setCachedPlans(data.plans || []);
    setDbOffline(false);

    if (data.bootstrap) {
      const b = data.bootstrap;
      seedCache('/api/bootstrap', b, { headers });
      seedCache('/api/customers', b.customers, { headers });
      seedCache('/api/vehicles', b.vehicles, { headers });
      seedCache('/api/recipes', b.recipes);
      seedCache('/api/next-docket', { nextDocketNumber: b.nextDocketNumber }, { headers });
    }
  };

  const loadSession = async (user: { id: string; role: string }, force = false) => {
    const headers = authHeaders();
    const sessionUrl = `/api/session?userId=${user.id}&role=${user.role}`;

    if (!force) {
      const cached = peekCache<{
        subscription: any;
        plans: any[];
        bootstrap?: any;
      }>(sessionUrl, { headers });
      if (cached) {
        applySession(cached, headers);
        setSubLoading(false);
        setInitialSubChecked(true);
        return;
      }
    }

    if (!initialSubChecked) setSubLoading(true);

    const data = await safeCachedFetch<{
      subscription: any;
      plans: any[];
      bootstrap?: any;
    }>(sessionUrl, { headers, ttl: CACHE_TTL.plans, force });

    if (!data) {
      setDbOffline(true);
    } else {
      applySession(data, headers);
      seedCache(sessionUrl, data, { headers });
    }

    setSubLoading(false);
    setInitialSubChecked(true);
  };

  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'admin') {
      setSubLoading(false);
      setSubStatus('active');
      setInitialSubChecked(true);
      void import('./dashboard/page');
      void import('./manage-users/page');
      return;
    }

    void import('./new-entry/page');
    void import('./history/page');
    loadSession(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const checkAccountActive = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const res = await fetch(`/api/auth?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (!data.isActive) {
            const msg = data.reason === 'deleted'
              ? 'Your account has been removed by the administrator.'
              : 'Your account has been paused by the administrator. Please contact admin.';
            alert(msg);
            localStorage.removeItem('bems_user');
            router.push('/login');
          }
        }
      } catch (e) {
        console.error('Account status check failed');
      }
    };

    checkAccountActive();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAccountActive();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(checkAccountActive, 180000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser, router]);

  useEffect(() => {
    const handleSubUpdate = () => {
      if (currentUser?.id && currentUser.role !== 'admin') {
        invalidateCache('/api/session');
        loadSession(currentUser, true);
      }
    };
    window.addEventListener('subscriptionUpdated', handleSubUpdate);
    return () => window.removeEventListener('subscriptionUpdated', handleSubUpdate);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('bems_user');
    router.push('/login');
  };

  if (!authChecked || !currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isSubscribed = subStatus === 'active' || subStatus === 'trial';
  const isBlocked = !isAdmin && !isSubscribed;
  const menuItems = isAdmin ? ADMIN_ITEMS : USER_ITEMS;

  const renderNavItem = (item: (typeof menuItems)[number]) => {
    const active = activeTab === item.name;
    const Icon = item.icon;
    const itemId = `nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <button
        key={item.name}
        id={itemId}
        onClick={() => {
          setActiveTab(item.name);
          setIsMobileMenuOpen(false);
        }}
        className={`group flex w-full items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer relative ${
          active
            ? 'bg-blue-50 text-blue-600 font-semibold'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80'
        }`}
      >
        <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
        <span id={`${itemId}-label`} className="truncate">{item.name}</span>
        {active && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <div className="flex bg-[#f8fafc] text-slate-800 font-sans min-h-screen w-full">
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200/80 z-50 flex items-center justify-between px-4 py-3.5 print:hidden">
        <div
          className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => {
            setActiveTab(isAdmin ? 'Dashboard' : 'New Entry');
            setIsMobileMenuOpen(false);
          }}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-600/10">B</div>
          <div className="flex items-center">
            <h1 className="text-base font-bold tracking-tight text-slate-900">BEMS</h1>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40 md:hidden print:hidden backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-slate-200/80 z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky top-0 flex flex-col print:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div
            className="p-6 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => {
              setActiveTab(isAdmin ? 'Dashboard' : 'New Entry');
              setIsMobileMenuOpen(false);
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-600/10">B</div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">BEMS</span>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100/50 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">Admin</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(false);
              }}
              className="md:hidden text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-4 md:mt-2">
            {menuItems.map((item) => renderNavItem(item))}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/30">
            <button
              onClick={handleLogout}
              className="flex w-full items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/80 transition-all duration-200 cursor-pointer text-sm"
            >
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 print:hidden">
          <h1 className="text-lg font-semibold text-slate-800 hidden md:block">{activeTab || 'Plant Dashboard'}</h1>
          <div className="flex items-center space-x-4 ml-auto">
            {!isAdmin && isSubscribed && subDaysLeft <= 3 && subDaysLeft > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                ⚠️ Expires in {subDaysLeft} day{subDaysLeft !== 1 ? 's' : ''}
              </div>
            )}
            {isBlocked && (
              <button
                onClick={() => setShowSubPopup(true)}
                className="hidden lg:flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
              >
                🔒 Subscribe to use
              </button>
            )}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                {isAdmin
                  ? <Shield className="w-3.5 h-3.5 text-amber-500" />
                  : <User className="w-3.5 h-3.5 text-blue-500" />
                }
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  {isAdmin ? 'Admin' : 'Operator'}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {currentUser.displayName || currentUser.username}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
              isAdmin ? 'bg-amber-500' : 'bg-blue-500'
            }`}>
              {(currentUser.displayName || currentUser.username).charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <TabContext.Provider value={activeTab}>
          <div className="p-4 md:p-8 space-y-8 w-full max-w-7xl mx-auto overflow-y-auto relative">
            <>
              {dbOffline && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 print:hidden">
                  <strong>Database offline.</strong> APIs cannot reach MongoDB. Open{' '}
                  <a
                    href="https://cloud.mongodb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium"
                  >
                    MongoDB Atlas
                  </a>
                  , confirm the cluster is running, copy a new connection string into{' '}
                  <code className="text-xs bg-red-100 px-1 rounded">.env</code> as{' '}
                  <code className="text-xs bg-red-100 px-1 rounded">MONGODB_URI</code>, and add your IP under
                  Network Access. Then restart <code className="text-xs bg-red-100 px-1 rounded">npm run dev</code>.
                </div>
              )}
              {subLoading && !initialSubChecked && (
                <div className="mb-4 space-y-6 print:hidden animate-pulse">
                  {/* Header skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-7 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-9 w-32 bg-slate-200 rounded-lg" />
                  </div>
                  {/* Card skeleton row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-24 bg-slate-200 rounded" />
                          <div className="h-8 w-8 bg-slate-100 rounded-lg" />
                        </div>
                        <div className="h-6 w-16 bg-slate-200 rounded" />
                        <div className="h-3 w-32 bg-slate-100 rounded" />
                      </div>
                    ))}
                  </div>
                  {/* Table skeleton */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
                    <div className="h-5 w-36 bg-slate-200 rounded" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-4 w-full bg-slate-100 rounded" />
                          <div className="h-4 w-3/4 bg-slate-100 rounded" />
                          <div className="h-4 w-1/2 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {initialSubChecked && isBlocked && activeTab !== 'Pricing' && (
                <div
                  className="absolute inset-0 z-50 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowSubPopup(true);
                  }}
                />
              )}
              {initialSubChecked && visitedTabs.map((tabName) => {
                const item = menuItems.find((i) => i.name === tabName);
                if (!item) return null;
                const TabComponent = item.component;
                const isCurrent = activeTab === tabName;
                return (
                  <div
                    key={tabName}
                    className={isCurrent ? 'block' : 'hidden'}
                    aria-hidden={!isCurrent}
                  >
                    <TabComponent />
                  </div>
                );
              })}
            </>
          </div>
        </TabContext.Provider>
      </main>

      <SubscriptionPopup
        open={showSubPopup}
        onClose={() => setShowSubPopup(false)}
        subscription={subData}
        preloadedPlans={cachedPlans}
      />
    </div>
  );
}
