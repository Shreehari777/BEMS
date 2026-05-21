'use client';

import { useEffect, useState } from 'react';
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

import DashboardPage from './dashboard/page';
import NewEntryPage from './new-entry/page';
import CustomersPage from './customers/page';
import VehiclesPage from './vehicles/page';
import RecipesPage from './recipes/page';
import HistoryPage from './history/page';
import ManageUsersPage from './manage-users/page';
import ManagePlansPage from './manage-plans/page';
import PricingPage from './pricing/page';
import SubscriptionPopup from '@/components/SubscriptionPopup';

import { TabContext } from '@/lib/TabContext';

// Admin-only tabs
const ADMIN_ITEMS = [
  { name: 'Dashboard', component: DashboardPage, icon: LayoutDashboard },
  { name: 'Manage Users', component: ManageUsersPage, icon: UserCog },
  { name: 'Manage Plans', component: ManagePlansPage, icon: CreditCard },
];

// User/Operator tabs — all visible, but interactions blocked if not subscribed
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
  const router = useRouter();

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

  // Check subscription status for users (not admin)
  const checkSubscription = async (userId: string) => {
    if (!initialSubChecked) {
      setSubLoading(true);
    }
    try {
      const [subRes, plansRes] = await Promise.all([
        fetch(`/api/subscriptions?userId=${userId}&t=` + Date.now()),
        cachedPlans.length === 0 ? fetch('/api/plans?t=' + Date.now()) : Promise.resolve(null),
      ]);
      if (subRes.ok) {
        const data = await subRes.json();
        setSubStatus(data.status || 'none');
        setSubDaysLeft(data.daysLeft || 0);
        setSubData(data);
      }
      if (plansRes && plansRes.ok) {
        setCachedPlans(await plansRes.json());
      }
    } catch (e) {
      console.error('Subscription check failed');
    } finally {
      if (!initialSubChecked) {
        setSubLoading(false);
        setInitialSubChecked(true);
      }
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      checkSubscription(currentUser.id);
    } else if (currentUser) {
      setSubLoading(false);
      setSubStatus('active');
    }
  }, [currentUser, activeTab]);

  // Check if the user's account is still active (force-logout paused users)
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const checkAccountActive = async () => {
      try {
        const res = await fetch(`/api/auth?userId=${currentUser.id}&t=` + Date.now());
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

    // Check immediately on mount and on every tab switch
    checkAccountActive();
  }, [currentUser, router, activeTab]);

  // Listen for subscription updates (after payment/trial)
  useEffect(() => {
    const handleSubUpdate = () => {
      if (currentUser?.id && currentUser.role !== 'admin') {
        checkSubscription(currentUser.id);
      }
    };
    window.addEventListener('subscriptionUpdated', handleSubUpdate);
    return () => window.removeEventListener('subscriptionUpdated', handleSubUpdate);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('bems_user');
    router.push('/login');
  };

  if (!authChecked || !currentUser || subLoading) return null;

  const isAdmin = currentUser.role === 'admin';
  const isSubscribed = subStatus === 'active' || subStatus === 'trial';
  const isBlocked = !isAdmin && !isSubscribed;
  const menuItems = isAdmin ? ADMIN_ITEMS : USER_ITEMS;

  const renderNavItem = (item: any) => {
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
      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200/80 z-50 flex items-center justify-between px-4 py-3.5 print:hidden">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity" 
          onClick={() => {
            setActiveTab(isAdmin ? 'Dashboard' : 'New Entry');
            setIsMobileMenuOpen(false);
          }}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm shadow-blue-600/10">S</div>
          <div className="flex items-center">
            <h1 className="text-base font-bold tracking-tight text-slate-900">SURJAN</h1>
            <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100/50 font-bold px-1.5 py-0.5 rounded ml-2 uppercase tracking-widest">RMC</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-40 md:hidden print:hidden backdrop-blur-xs" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-slate-200/80 z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky top-0 flex flex-col print:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header Section */}
          <div 
            className="p-6 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity" 
            onClick={() => { 
              setActiveTab(isAdmin ? 'Dashboard' : 'New Entry'); 
              setIsMobileMenuOpen(false); 
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-blue-600/10">S</div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-tight">SURJAN</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100/50 font-bold px-1.5 py-0.2 rounded uppercase tracking-widest">RMC</span>
                  {isAdmin ? (
                    <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100/50 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">Admin</span>
                  ) : (
                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100/50 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">Operator</span>
                  )}
                </div>
              </div>
            </div>
            {/* Close button inside drawer for mobile */}
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
                   {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-4 md:mt-2">
            {menuItems.map((item) => renderNavItem(item))}
          </nav>

          {/* Logout Section */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 print:hidden">
          <h1 className="text-lg font-semibold text-slate-800 hidden md:block">{activeTab || 'Plant Dashboard'}</h1>
          <div className="flex items-center space-x-4 ml-auto">
            {/* Subscription warning */}
            {!isAdmin && isSubscribed && subDaysLeft <= 3 && subDaysLeft > 0 && (
              <div className="hidden lg:flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-200">
                ⚠️ Expires in {subDaysLeft} day{subDaysLeft !== 1 ? 's' : ''}
              </div>
            )}
            {/* Not subscribed badge */}
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
            {isBlocked && activeTab !== 'Pricing' && (
              <div 
                className="absolute inset-0 z-50 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSubPopup(true);
                }}
              />
            )}
            {menuItems.map((item) => (
              <div key={item.name} className={activeTab === item.name ? 'block' : 'hidden'}>
                <item.component />
              </div>
            ))}
          </div>
        </TabContext.Provider>
      </main>

      {/* Subscription Popup */}
      <SubscriptionPopup
        open={showSubPopup}
        onClose={() => setShowSubPopup(false)}
        subscription={subData}
        preloadedPlans={cachedPlans}
      />
    </div>
  );
}
