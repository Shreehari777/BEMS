'use client';

import { useState, useEffect, useContext } from 'react';
import { Loader2, Trash2, Download, Search, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import * as xlsx from 'xlsx';
import { TabContext } from '@/lib/TabContext';
import { useRouter } from 'next/navigation';
import { authHeaders } from '@/lib/auth';

export default function HistoryPage() {
  const router = useRouter();
  const activeTab = useContext(TabContext);
  const isActive = activeTab === 'History' || activeTab === 'Dashboard';

  const [reports, setReports] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'single' | 'all'; id?: string }>({ open: false, type: 'single' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!isActive) return;
    
    const fetchReports = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.append('search', debouncedSearch);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('page', String(currentPage));
        params.append('limit', String(itemsPerPage));
        params.append('_t', String(Date.now())); // cache buster
        
        const res = await fetch(`/api/reports?${params.toString()}`, { cache: 'no-store', headers: authHeaders() });
        if (res.ok) {
          const result = await res.json();
          setReports(result.data || []);
          setTotalItems(result.total || 0);
        }
      } catch (e) {}
      setLoading(false);
    };

    fetchReports();
  }, [debouncedSearch, startDate, endDate, isActive, currentPage]);

  const handleDelete = (id: string) => {
    setConfirmDialog({ open: true, type: 'single', id });
  };

  const handleDeleteAll = () => {
    setConfirmDialog({ open: true, type: 'all' });
  };

  const executeDelete = async () => {
    const dialogType = confirmDialog.type;
    const dialogId = confirmDialog.id;
    const previousReports = [...reports];

    // Optimistic update
    if (dialogType === 'single' && dialogId) {
      setReports(reports.filter(r => r._id !== dialogId));
    } else if (dialogType === 'all') {
      setReports([]);
    }

    setConfirmDialog({ open: false, type: 'single' });

    try {
      if (dialogType === 'single' && dialogId) {
        await fetch(`/api/reports/${dialogId}`, { method: 'DELETE', headers: authHeaders() });
      } else if (dialogType === 'all') {
        await fetch('/api/reports', { method: 'DELETE', headers: authHeaders() });
      }
    } catch (e) {
      console.error(e);
      setReports(previousReports); // Revert on failure
    }
  };

  const handleDownloadExcel = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const res = await fetch(`/api/reports?${params.toString()}`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch data for export');
      
      const allReports = await res.json();
      
      const dataForExcel = allReports.map((r: any) => ({
        'Docket Number': r.docketNumber,
        'Customer Name': r.customerName,
        'Site': r.site,
        'Vehicle Number': r.vehicleNumber,
        'Driver Name': r.driverName,
        'Grade': r.grade,
        'Quantity': r.quantity,
        'Start Time': r.startTime,
        'Stop Time': r.stopTime,
        'Date': format(new Date(r.date), 'dd/MM/yyyy'),
      }));

      const ws = xlsx.utils.json_to_sheet(dataForExcel);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Reports');
      xlsx.writeFile(wb, `BEMS_Reports_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedReports = reports;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">History</h2>
          <p className="text-sm text-gray-500 mt-1">View past batch entries and generate reports.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Clear All</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 print:hidden">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-history"
            type="text"
            placeholder="Search customer name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="input-start-date"
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <span className="text-slate-400">to</span>
          <input
            id="input-end-date"
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print-container">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No reports found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table id="table-history" className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Docket</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Site</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Grade</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Time (Start-Stop)</th>
                  <th className="px-4 py-3 font-medium text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((r) => (
                  <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">#{r.docketNumber}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-gray-800">{r.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.site}</td>
                    <td className="px-4 py-3 text-gray-800 font-mono text-xs">{r.vehicleNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{r.driverName}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{r.grade}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.quantity} m³</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {r.startTime} - {r.stopTime}
                    </td>
                    <td className="px-4 py-3 text-right print:hidden flex justify-end gap-2 items-center">
                      <button 
                        onClick={() => router.push(`/print/${r._id}`)} 
                        className="text-blue-600 hover:text-blue-700 p-1" 
                        title="View Report"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(r._id)} className="text-red-500 hover:text-red-600 p-1" title="Delete report">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && reports.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center print:hidden">
            <div className="text-sm text-gray-500">
              Showing {reports.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
              <p className="text-sm text-gray-500">
                {confirmDialog.type === 'all' 
                  ? 'Are you sure you want to delete ALL reports? This action cannot be undone.'
                  : 'Are you sure you want to delete this report? This action cannot be undone.'}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog({ open: false, type: 'single' })}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { background-color: white; }
          nav, aside, .print\\:hidden, #nprogress { display: none !important; }
          .print-container { box-shadow: none !important; border: 1px solid #eee; }
          main { padding: 0 !important; margin: 0 !important; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
        }
      `}</style>
    </div>
  );
}
