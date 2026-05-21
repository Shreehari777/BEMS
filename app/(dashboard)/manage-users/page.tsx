'use client';

import { useState, useEffect, useContext } from 'react';
import { Loader2, UserPlus, Trash2, Shield, User, Eye, EyeOff, CreditCard, X, Check, Clock } from 'lucide-react';
import { TabContext } from '@/lib/TabContext';

export default function ManageUsersPage() {
  const activeTab = useContext(TabContext);
  const isActive = activeTab === 'Manage Users';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [error, setError] = useState('');

  // Manual activation state
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any>({});
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [activating, setActivating] = useState(false);

  // Manual activation/editing extensions
  const [activationMode, setActivationMode] = useState<'predefined' | 'custom'>('predefined');
  const [customYears, setCustomYears] = useState('0');
  const [customMonths, setCustomMonths] = useState('0');
  const [customDays, setCustomDays] = useState('10');
  const [customPlanName, setCustomPlanName] = useState('');
  const [customAmount, setCustomAmount] = useState('0');
  const [editRemainingDays, setEditRemainingDays] = useState('');

  const resetCustomForm = () => {
    setActivationMode('predefined');
    setCustomYears('0');
    setCustomMonths('0');
    setCustomDays('10');
    setCustomPlanName('');
    setCustomAmount('0');
  };

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/users?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to load users');
    }
    if (!silent) setLoading(false);
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans?all=true&t=' + Date.now());
      if (res.ok) setPlans(await res.json());
    } catch (e) {}
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions?all=true&t=' + Date.now());
      if (res.ok) {
        const subs = await res.json();
        // Group by userId — latest first (already sorted)
        const map: any = {};
        for (const sub of subs) {
          if (!map[sub.userId]) map[sub.userId] = sub;
        }
        setSubscriptions(map);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isActive) {
      const hasData = users.length > 0;
      const t = setTimeout(() => {
        fetchUsers(hasData);
        fetchPlans();
        fetchSubscriptions();
      }, 10);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create user');
      } else {
        setForm({ username: '', password: '', displayName: '' });
        setShowForm(false);
        fetchUsers();
      }
    } catch (e) {
      setError('Failed to create user');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (!res.ok) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: currentStatus } : u));
        const data = await res.json();
        alert(data.error || 'Failed to update user status');
      } else {
        // Refresh subscription data to reflect freeze/unfreeze
        fetchSubscriptions();
      }
    } catch (e) {
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: currentStatus } : u));
      alert('Failed to update user status');
    }
  };

  const handleManualActivate = async () => {
    if (!activatingUserId) return;
    setActivating(true);

    let planName = '';
    let amount = 0;
    let durationDays = 0;
    let planId = 'custom';

    if (activationMode === 'predefined') {
      if (!selectedPlanId) {
        alert('Please select a plan');
        setActivating(false);
        return;
      }
      const plan = plans.find(p => p._id === selectedPlanId);
      if (!plan) { setActivating(false); return; }
      planId = plan._id;
      planName = plan.name + ' (Manual)';
      amount = plan.price;
      durationDays = plan.durationDays;
    } else {
      const y = parseInt(customYears) || 0;
      const m = parseInt(customMonths) || 0;
      const d = parseInt(customDays) || 0;
      durationDays = (y * 365) + (m * 30) + d;
      if (durationDays <= 0) {
        alert('Please enter a duration greater than 0 days');
        setActivating(false);
        return;
      }
      planName = customPlanName || 'Custom Manual Plan';
      amount = parseFloat(customAmount) || 0;
    }

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activatingUserId,
          action: 'activate',
          planId,
          planName,
          amount,
          durationDays,
        }),
      });

      if (res.ok) {
        setActivatingUserId(null);
        setSelectedPlanId('');
        resetCustomForm();
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to activate subscription');
      }
    } catch (e) {
      alert('Failed to activate subscription');
    }
    setActivating(false);
  };

  const handleEditSubscription = async () => {
    if (!activatingUserId) return;
    setActivating(true);

    const sub = subscriptions[activatingUserId];
    if (!sub) {
      alert('No subscription to edit');
      setActivating(false);
      return;
    }

    const remainingDays = parseInt(editRemainingDays);
    if (isNaN(remainingDays) || remainingDays < 0) {
      alert('Please enter a valid number of remaining days (>= 0)');
      setActivating(false);
      return;
    }

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activatingUserId,
          action: 'set-remaining',
          remainingDays,
        }),
      });

      if (res.ok) {
        setActivatingUserId(null);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update subscription');
      }
    } catch (e) {
      alert('Failed to update subscription');
    }
    setActivating(false);
  };

  // Get subscription status label for a user
  const getSubInfo = (userId: string) => {
    const sub = subscriptions[userId];
    if (!sub) return { label: 'No Plan', color: 'bg-slate-100 text-slate-500', daysLeft: 0 };

    const now = new Date();
    const end = new Date(sub.endDate);
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    if (sub.status === 'active' && daysLeft > 0) {
      return { label: `${sub.planName} · ${daysLeft}d left`, color: 'bg-green-100 text-green-700', daysLeft };
    }
    if (sub.status === 'trial' && daysLeft > 0) {
      return { label: `Trial · ${daysLeft}d left`, color: 'bg-amber-100 text-amber-700', daysLeft };
    }
    if (sub.status === 'paused') {
      const frozen = sub.pausedDaysLeft || 0;
      return { label: `Paused · ${frozen}d frozen`, color: 'bg-orange-100 text-orange-700', daysLeft: frozen };
    }
    return { label: 'Expired', color: 'bg-red-100 text-red-600', daysLeft: 0 };
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Users</h2>
          <p className="text-sm text-gray-500 mt-1">Add or remove operator accounts who can access the system.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.97]"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Create User Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Create New User</h3>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. operator1"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 4 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Raj Kumar"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Activate / Manage Popup */}
      {activatingUserId && (() => {
        const existingSub = subscriptions[activatingUserId];
        const isEditMode = !!existingSub;
        const userObj = users.find(u => u._id === activatingUserId);
        const displayName = userObj?.displayName || userObj?.username || '';

        // Compute dynamic expiry date for Edit Mode
        let computedNewExpiry = '';
        if (isEditMode) {
          const daysNum = parseInt(editRemainingDays) || 0;
          const newExpDate = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);
          computedNewExpiry = newExpDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }

        // Compute dynamic total days & expiry for Activation Mode (Custom)
        let computedCustomDays = 0;
        let computedCustomExpiry = '';
        if (!isEditMode && activationMode === 'custom') {
          const y = parseInt(customYears) || 0;
          const m = parseInt(customMonths) || 0;
          const d = parseInt(customDays) || 0;
          computedCustomDays = (y * 365) + (m * 30) + d;
          const newExpDate = new Date(Date.now() + computedCustomDays * 24 * 60 * 60 * 1000);
          computedCustomExpiry = newExpDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
              onClick={() => { setActivatingUserId(null); setSelectedPlanId(''); }} 
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-hidden animate-in">
              <button
                onClick={() => { setActivatingUserId(null); setSelectedPlanId(''); }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${
                  isEditMode ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  <CreditCard className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {isEditMode ? 'Manage Subscription' : 'Activate Subscription'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    For: <strong className="text-slate-700">{displayName}</strong> (Offline Payment)
                  </p>
                </div>
              </div>

              {isEditMode ? (
                /* CASE B: Has Subscription (Edit Mode) */
                <div className="space-y-5">
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Current Plan:</span>
                      <span className="font-bold text-slate-800">{existingSub.planName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        existingSub.status === 'active' || existingSub.status === 'trial'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {existingSub.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Starts:</span>
                      <span className="text-slate-700">{new Date(existingSub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">Expires:</span>
                      <span className="text-slate-700">{new Date(existingSub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Remaining Days
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editRemainingDays}
                      onChange={(e) => setEditRemainingDays(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                      📅 New Expiry Date will be: <strong className="text-blue-600 font-bold">{computedNewExpiry || 'Invalid date'}</strong>
                    </p>
                  </div>

                  <button
                    onClick={handleEditSubscription}
                    disabled={editRemainingDays === '' || activating}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm shadow-blue-200"
                  >
                    {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              ) : (
                /* CASE A: No Subscription (Activation Mode) */
                <div className="space-y-5">
                  {/* Mode Selector Tabs */}
                  <div className="flex bg-slate-100 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActivationMode('predefined')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                        activationMode === 'predefined'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Predefined Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivationMode('custom')}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                        activationMode === 'custom'
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Custom Duration
                    </button>
                  </div>

                  {activationMode === 'predefined' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Select Plan
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                      >
                        <option value="">-- Choose a plan --</option>
                        {plans.filter(p => p.isActive).map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.durationDays} days)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Years
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={customYears}
                            onChange={(e) => setCustomYears(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Months
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={customMonths}
                            onChange={(e) => setCustomMonths(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Days
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={customDays}
                            onChange={(e) => setCustomDays(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-center"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-green-50/50 border border-green-100 rounded-xl text-xs text-green-800 space-y-1">
                        <p className="flex justify-between">
                          <span>Total Assigned Duration:</span>
                          <strong className="font-bold">{computedCustomDays} days</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Expiration Date:</span>
                          <strong className="font-bold">{computedCustomExpiry || 'Invalid date'}</strong>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Plan Label / Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Offline Pro"
                            value={customPlanName}
                            onChange={(e) => setCustomPlanName(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Amount (Paid Offline)
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 5000"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleManualActivate}
                    disabled={
                      (activationMode === 'predefined' && !selectedPlanId) ||
                      (activationMode === 'custom' && computedCustomDays <= 0) ||
                      activating
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm shadow-green-200"
                  >
                    {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Activate Subscription
                  </button>
                </div>
              )}
            </div>
            
            <style jsx>{`
              .animate-in {
                animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
              }
              @keyframes popIn {
                from { opacity: 0; transform: scale(0.96) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
          </div>
        );
      })()}

      {/* Users List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription</th>
              <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No users found. Create one to get started.
                </td>
              </tr>
            )}
            {users.map((user) => {
              const subInfo = getSubInfo(user._id);
              return (
                <tr key={user._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${user.isActive === false ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        user.isActive === false ? 'bg-slate-400' : 'bg-blue-500'
                      }`}>
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">
                          {user.displayName || user.username}
                        </span>
                        {user.isActive === false && (
                          <span className="ml-2 text-xs text-red-500 font-medium">Paused</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role !== 'admin' ? (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${subInfo.color}`}>
                        {subInfo.label}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleActive(user._id, user.isActive !== false)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      style={{ backgroundColor: user.isActive !== false ? '#22c55e' : '#d1d5db' }}
                      title={user.isActive !== false ? 'Click to pause account' : 'Click to resume account'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          user.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {user.role !== 'admin' && (() => {
                        const hasSub = !!subscriptions[user._id];
                        return (
                          <>
                            <button
                              onClick={() => {
                                setActivatingUserId(user._id);
                                setSelectedPlanId('');
                                if (hasSub) {
                                  const sub = subscriptions[user._id];
                                  const now = new Date();
                                  const end = new Date(sub.endDate);
                                  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                                  setEditRemainingDays(daysLeft.toString());
                                } else {
                                  setEditRemainingDays('');
                                  resetCustomForm();
                                }
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                hasSub
                                  ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                  : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={hasSub ? "Manage subscription / Edit remaining days" : "Activate subscription (offline payment)"}
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id, user.username)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
