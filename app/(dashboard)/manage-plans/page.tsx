'use client';

import { useState, useEffect, useContext } from 'react';
import { Loader2, Plus, Trash2, Edit2, X, Check, CreditCard } from 'lucide-react';
import { TabContext } from '@/lib/TabContext';

export default function ManagePlansPage() {
  const activeTab = useContext(TabContext);
  const isActive = activeTab === 'Manage Plans';

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    durationDays: 30,
    price: 0,
    trialDays: 0,
    description: '',
    order: 0,
  });

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans?all=true&t=' + Date.now());
      if (res.ok) setPlans(await res.json());
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    if (isActive) {
      fetchPlans();
    }
  }, [isActive]);

  const resetForm = () => {
    setForm({ name: '', durationDays: 30, price: 0, trialDays: 0, description: '', order: 0 });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = '/api/plans';
      const method = editingId ? 'PATCH' : 'POST';
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save plan');
      } else {
        resetForm();
        fetchPlans();
      }
    } catch (e) {
      setError('Failed to save plan');
    }
    setSaving(false);
  };

  const handleEdit = (plan: any) => {
    setForm({
      name: plan.name,
      durationDays: plan.durationDays,
      price: plan.price,
      trialDays: plan.trialDays || 0,
      description: plan.description || '',
      order: plan.order || 0,
    });
    setEditingId(plan._id);
    setShowForm(true);
    setError('');
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setPlans(prev => prev.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));
    try {
      await fetch('/api/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
    } catch (e) {
      setPlans(prev => prev.map(p => p._id === id ? { ...p, isActive: currentStatus } : p));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPlans();
    } catch (e) {}
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Plans</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage subscription plans for operators.</p>
        </div>
        <button
          onClick={() => { showForm ? resetForm() : setShowForm(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.97]"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Plan</>}
        </button>
      </div>


      {/* Create/Edit Plan Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            {editingId ? 'Edit Plan' : 'Create New Plan'}
          </h3>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 1 Month"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Duration (Days) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 30"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Trial (Days)
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Best for starters"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Trial</th>
              <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Active</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No plans created yet. Add one to get started.
                </td>
              </tr>
            )}
            {plans.map((plan) => (
              <tr key={plan._id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!plan.isActive ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">{plan.name}</span>
                      {plan.description && (
                        <p className="text-xs text-slate-500">{plan.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{plan.durationDays} days</td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-800 text-lg">₹{plan.price.toLocaleString('en-IN')}</span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{plan.trialDays ? `${plan.trialDays} days` : 'None'}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggleActive(plan._id, plan.isActive)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    style={{ backgroundColor: plan.isActive ? '#22c55e' : '#d1d5db' }}
                    title={plan.isActive ? 'Visible to users' : 'Hidden from users'}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${plan.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan._id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
