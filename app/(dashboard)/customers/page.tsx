'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { Loader2, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { authHeaders } from '@/lib/auth';
import { TabContext } from '@/lib/TabContext';

export default function CustomersPage() {
  const nameRef = useRef<HTMLInputElement>(null);
  const siteRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [site, setSite] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchCustomers = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch('/api/customers', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {}
    if (showSpinner) setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCustomers(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentName = name;
    const currentSite = site;
    const currentGstNumber = gstNumber;
    const currentEditingId = editingId;

    // Optimistic UI update: instant feedback
    if (currentEditingId) {
      setCustomers(prev => prev.map(c => c._id === currentEditingId ? { ...c, name: currentName, site: currentSite, gstNumber: currentGstNumber } : c));
    } else {
      const tempId = Math.random().toString(36).substr(2, 9);
      setCustomers(prev => [{ _id: tempId, name: currentName, site: currentSite, gstNumber: currentGstNumber }, ...prev]);
    }

    setName('');
    setSite('');
    setGstNumber('');
    setEditingId(null);
    nameRef.current?.focus();

    // Run network request in background
    try {
      const url = currentEditingId ? `/api/customers/${currentEditingId}` : '/api/customers';
      const method = currentEditingId ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ name: currentName, site: currentSite, gstNumber: currentGstNumber }),
      });
      // Silent sync without spinner
      fetchCustomers(false);
      window.dispatchEvent(new Event('bemsDataUpdated'));
    } catch (e) {}
  };

  const handleEdit = (c: any) => {
    setName(c.name);
    setSite(c.site);
    setGstNumber(c.gstNumber || '');
    setEditingId(c._id);
  };

  const handleDelete = async (id: string) => {
    // Fast optimistic delete
    setCustomers(prev => prev.filter(c => c._id !== id));

    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      // Silent sync without spinner
      fetchCustomers(false);
      window.dispatchEvent(new Event('bemsDataUpdated'));
    } catch (e) {}
  };

  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);

  const handleDeleteAll = async () => {
    if (!showConfirmDeleteAll) {
      setShowConfirmDeleteAll(true);
      setTimeout(() => setShowConfirmDeleteAll(false), 3000);
      return;
    }
    
    setShowConfirmDeleteAll(false);
    // Fast optimistic empty
    setCustomers([]);
    setCurrentPage(1);
    
    try {
      await fetch('/api/customers', { method: 'DELETE', headers: authHeaders() });
      // Silent sync without spinner
      fetchCustomers(false);
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h2>
          <p className="text-sm text-gray-500 mt-1">Manage customers and sites.</p>
        </div>
        <button
          onClick={handleDeleteAll}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showConfirmDeleteAll ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>{showConfirmDeleteAll ? 'Confirm Delete All?' : 'Delete All'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  ref={nameRef}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      siteRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Site</label>
                <input
                  type="text"
                  required
                  value={site}
                  ref={siteRef}
                  onChange={e => setSite(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      gstRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="Enter site name"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GST Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  ref={gstRef}
                  onChange={e => setGstNumber(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSubmit(e);
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="Enter GST number (optional)"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex justify-center text-sm items-center cursor-pointer"
                >
                  {editingId ? 'Update' : 'Save'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setName(''); setSite(''); setGstNumber(''); }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No customers found.</div>
            ) : (
              <div className="overflow-x-auto flex flex-col h-full">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">S.No</th>
                      <th className="px-6 py-4 font-medium">Customer Name</th>
                      <th className="px-6 py-4 font-medium">Site</th>
                      <th className="px-6 py-4 font-medium">GST Number</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((c, idx) => (
                      <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-gray-600">{c.site}</td>
                        <td className="px-6 py-4 text-gray-600">{c.gstNumber || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEdit(c)} className="text-blue-600 hover:underline mr-4 p-1">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:underline p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customers.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white mt-auto">
                    <span className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, customers.length)} of {customers.length} entries
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(customers.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(customers.length / itemsPerPage)}
                        className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
