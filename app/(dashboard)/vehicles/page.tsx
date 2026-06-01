'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { authHeaders } from '@/lib/auth';
import { cachedFetch, CACHE_TTL } from '@/lib/api-cache';

export default function VehiclesPage() {
  const numberRef = useRef<HTMLInputElement>(null);
  const driverRef = useRef<HTMLInputElement>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [number, setNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchVehicles = async (showSpinner = true, force = false) => {
    if (showSpinner && vehicles.length === 0) setLoading(true);
    try {
      const data = await cachedFetch<any[]>('/api/vehicles', {
        headers: authHeaders(),
        ttl: CACHE_TTL.long,
        force,
      });
      if (data) setVehicles(data);
    } catch (e) {}
    if (showSpinner) setLoading(false);
  };

  useEffect(() => {
    fetchVehicles(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentNumber = number;
    const currentDriver = driverName;
    const currentEditingId = editingId;

    if (currentEditingId) {
      setVehicles(prev => prev.map(v => v._id === currentEditingId ? { ...v, number: currentNumber, driverName: currentDriver } : v));
    } else {
      const tempId = Math.random().toString(36).substr(2, 9);
      setVehicles(prev => [{ _id: tempId, number: currentNumber, driverName: currentDriver }, ...prev]);
    }

    setNumber('');
    setDriverName('');
    setEditingId(null);
    numberRef.current?.focus();

    try {
      const url = currentEditingId ? `/api/vehicles/${currentEditingId}` : '/api/vehicles';
      const method = currentEditingId ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({ number: currentNumber, driverName: currentDriver }),
      });
      // Invalidate cache first, then force-fetch the fresh data
      window.dispatchEvent(new Event('bemsDataUpdated'));
      fetchVehicles(false, true);
    } catch (e) {}
  };

  const handleEdit = (v: any) => {
    setNumber(v.number);
    setDriverName(v.driverName);
    setEditingId(v._id);
  };

  const handleDelete = async (id: string) => {
    setVehicles(prev => prev.filter(v => v._id !== id));
    try {
      await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      // Invalidate cache first, then force-fetch the fresh data
      window.dispatchEvent(new Event('bemsDataUpdated'));
      fetchVehicles(false, true);
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
    setVehicles([]);
    setCurrentPage(1);

    try {
      await fetch('/api/vehicles', { method: 'DELETE', headers: authHeaders() });
      // Invalidate cache first, then force-fetch the fresh data
      window.dispatchEvent(new Event('bemsDataUpdated'));
      fetchVehicles(false, true);
    } catch (e) {}
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Vehicles</h2>
          <p className="text-sm text-gray-500 mt-1">Manage transport vehicles and drivers.</p>
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
              {editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Number</label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={number}
                  ref={numberRef}
                  onChange={e => setNumber(e.target.value.toUpperCase())}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      driverRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="e.g. MH14 7778"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={driverName}
                  ref={driverRef}
                  onChange={e => setDriverName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSubmit(e);
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                  placeholder="Enter driver name"
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
                    onClick={() => { setEditingId(null); setNumber(''); setDriverName(''); }}
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
            ) : vehicles.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No vehicles found.</div>
            ) : (
              <div className="overflow-x-auto flex flex-col h-full">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">S.No</th>
                      <th className="px-6 py-4 font-medium">Vehicle No.</th>
                      <th className="px-6 py-4 font-medium">Driver</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((v, idx) => (
                      <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-500">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{v.number}</td>
                        <td className="px-6 py-4 text-gray-600">{v.driverName}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleEdit(v)} className="text-blue-600 hover:underline mr-4 p-1">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(v._id)} className="text-red-500 hover:underline p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vehicles.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white mt-auto">
                    <span className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, vehicles.length)} of {vehicles.length} entries
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
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(vehicles.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(vehicles.length / itemsPerPage)}
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
