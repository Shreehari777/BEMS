'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Autocomplete } from '@/components/Autocomplete';
import { useRouter } from 'next/navigation';
import { authHeaders } from '@/lib/auth';
import { CACHE_TTL, invalidateCache, peekCache, safeCachedFetch, seedCache } from '@/lib/api-cache';

const MATERIALS = [
  { id: 'stone20mm', label: '20MM' },
  { id: 'sand', label: 'SAND' },
  { id: 'moisture', label: 'MOI' },
  { id: 'sand1', label: 'SAND1' },
  { id: 'stone10mm', label: '10MM' },
  { id: 'cem1', label: 'CEM1' },
  { id: 'cem2', label: 'CEM2' },
  { id: 'flyAsh', label: 'FLASH' },
  { id: 'water', label: 'WATER' },
  { id: 'watIce', label: 'WAT/I' },
  { id: 'silica', label: 'SILICA' },
  { id: 'adm1', label: 'ADM1' },
  { id: 'adm2', label: 'ADM2' },
];

export default function NewEntryPage() {
  const router = useRouter();
  const customerRef = useRef<HTMLInputElement>(null);
  const siteRef = useRef<HTMLInputElement>(null);
  const vehicleRef = useRef<HTMLInputElement>(null);
  const driverRef = useRef<HTMLInputElement>(null);
  const gradeRef = useRef<HTMLSelectElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const stopTimeRef = useRef<HTMLInputElement>(null);
  const startTimeNowBtnRef = useRef<HTMLButtonElement>(null);
  const stopTimeNowBtnRef = useRef<HTMLButtonElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  const getCurrentTimeFormatted = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: true });
  };

  const [docketNumber, setDocketNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [site, setSite] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [grade, setGrade] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [quantity, setQuantity] = useState('');
  const [startTime, setStartTime] = useState('');
  const [stopTime, setStopTime] = useState('');

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const applyBootstrap = (payload: {
      customers: any[];
      vehicles: any[];
      recipes: any[];
      nextDocketNumber: number;
      nextOrderNumber?: number;
    }) => {
      const headers = authHeaders();
      setCustomers(payload.customers);
      setVehicles(payload.vehicles);
      setRecipes(payload.recipes);
      setDocketNumber(String(payload.nextDocketNumber).padStart(3, '0'));
      if (payload.nextOrderNumber !== undefined) {
        setOrderNumber(String(payload.nextOrderNumber));
      }
      setGrade(payload.recipes.length > 0 ? payload.recipes[0].grade : '');

      seedCache('/api/customers', payload.customers, { headers });
      seedCache('/api/vehicles', payload.vehicles, { headers });
      seedCache('/api/recipes', payload.recipes);
      seedCache('/api/next-docket', { nextDocketNumber: payload.nextDocketNumber }, { headers });
    };

    const loadInitialData = async (force = false) => {
      const headers = authHeaders();
      const cached = !force
        ? peekCache<{
            customers: any[];
            vehicles: any[];
            recipes: any[];
            nextDocketNumber: number;
            nextOrderNumber?: number;
          }>('/api/bootstrap', { headers })
        : null;
      if (cached) {
        applyBootstrap(cached);
        return;
      }

      setLoadingInitial(true);
      try {
        const payload = await safeCachedFetch<{
          customers: any[];
          vehicles: any[];
          recipes: any[];
          nextDocketNumber: number;
          nextOrderNumber?: number;
        }>('/api/bootstrap', { headers, ttl: CACHE_TTL.long, force });

        if (payload) {
          applyBootstrap(payload);
        }
      } catch {
        /* DB offline — layout banner explains */
      }
      setLoadingInitial(false);
    };

    loadInitialData();

    const handleUpdate = () => {
      invalidateCache('/api/bootstrap');
      invalidateCache('/api/session');
      loadInitialData(true);
    };
    window.addEventListener('bemsDataUpdated', handleUpdate);
    return () => window.removeEventListener('bemsDataUpdated', handleUpdate);
  }, []);

  const handleCustomerSelect = (customer: any) => {
    setSite(customer.site);
    setTimeout(() => {
      vehicleRef.current?.focus();
    }, 0);
  };

  const handleVehicleSelect = (vehicle: any) => {
    setDriverName(vehicle.driverName);
    setTimeout(() => {
      gradeRef.current?.focus();
    }, 0);
  };

  const loadNextDocket = async () => {
    try {
      const data = await safeCachedFetch<{ nextDocketNumber?: number }>('/api/next-docket', {
        headers: authHeaders(),
        ttl: CACHE_TTL.short,
        force: true,
      });
      if (data?.nextDocketNumber) {
        setDocketNumber(String(data.nextDocketNumber).padStart(3, '0'));
      }
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Auto-save logic handles new customers/vehicles if manually typed
    
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          docketNumber: Number(docketNumber),
          orderNumber,
          customerName,
          site,
          vehicleNumber,
          driverName,
          grade,
          quantity: Number(quantity),
          startTime,
          stopTime
        }),
      });

      if (res.ok) {
        const createdReport = await res.json();
        const createdId = createdReport._id;
        invalidateCache('/api/reports');
        invalidateCache('/api/customers');
        invalidateCache('/api/bootstrap');
        invalidateCache('/api/next-docket');

        // Clear form
        setOrderNumber('');
        setCustomerName('');
        setSite('');
        setVehicleNumber('');
        setDriverName('');
        setGrade(recipes.length > 0 ? recipes[0].grade : '');
        setQuantity('');
        setStartTime(getCurrentTimeFormatted());
        setStopTime('');
        
        // Dispatch event to invalidate cache across layout & active tabs,
        // which clears the cache and fetches the fresh next-docket and customer orders list!
        window.dispatchEvent(new Event('bemsDataUpdated'));
        
        // Redirect to print page with auto-print instruction
        router.push(`/print/${createdId}?print=true`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save entry');
      }
    } catch (e) {
      alert('An error occurred');
    }
    setSaving(false);
  };

  if (loadingInitial) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="h-6 w-36 bg-slate-200 rounded"></div>
            <div className="h-6 w-24 bg-slate-200 rounded"></div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                  <div className="h-10 bg-slate-50 border border-slate-200 rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="h-1 bg-slate-100 my-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded"></div>
                  <div className="h-10 bg-slate-50 border border-slate-200 rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-900">Batch New Entry</h2>
            <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 tracking-wider">DOCKET NO:</span>
            <input
              id="input-docket-number"
              type="text"
              required
              value={docketNumber}
              onChange={e => setDocketNumber(e.target.value)}
              className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-blue-700 font-bold text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* ROW 1 */}
            <div className="relative" id="field-customer-name">
              <label htmlFor="customer-name-autocomplete" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
              <Autocomplete
                id="customer-name-autocomplete"
                items={customers}
                displayKey="name"
                value={customerName}
                inputRef={customerRef}
                onChange={setCustomerName}
                onSelect={handleCustomerSelect}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTimeout(() => {
                        vehicleRef.current?.focus();
                    }, 100);
                  }
                }}
                placeholder="Select or type customer"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <div id="field-vehicle-number">
              <label htmlFor="vehicle-number-autocomplete" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle Number</label>
              <Autocomplete
                id="vehicle-number-autocomplete"
                items={vehicles}
                displayKey="number"
                value={vehicleNumber}
                onChange={(val) => setVehicleNumber(val.toUpperCase())}
                onSelect={handleVehicleSelect}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setTimeout(() => {
                      gradeRef.current?.focus();
                    }, 100);
                  }
                }}
                placeholder="e.g. MH14 7778"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm uppercase"
                inputRef={vehicleRef}
              />
            </div>

            <div id="field-grade">
              <label htmlFor="select-grade" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Grade</label>
              <select
                id="select-grade"
                required
                value={grade}
                ref={gradeRef}
                onChange={e => {
                  setGrade(e.target.value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    quantityRef.current?.focus();
                  }
                }}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              >
                {recipes.length > 0 ? (
                  recipes.map(r => <option key={r.grade} value={r.grade}>{r.grade}</option>)
                ) : (
                  <option value="">No grades available</option>
                )}
              </select>
            </div>

            <div id="field-quantity">
              <label htmlFor="input-quantity" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity (m³)</label>
              <input
                id="input-quantity"
                type="number"
                step="any"
                required
                value={quantity}
                ref={quantityRef}
                onChange={e => setQuantity(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setStartTime(getCurrentTimeFormatted());
                    stopTimeNowBtnRef.current?.focus();
                  }
                }}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="e.g. 6.5"
              />
            </div>

            {/* ROW 2 */}
            <div id="field-site">
              <label htmlFor="input-site" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Site</label>
              <input
                id="input-site"
                type="text"
                required
                maxLength={150}
                value={site}
                ref={siteRef}
                onChange={e => setSite(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    vehicleRef.current?.focus();
                  }
                }}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                placeholder="Site name"
              />
            </div>

            <div id="field-driver-name">
              <label htmlFor="input-driver-name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Driver Name</label>
              <input
                id="input-driver-name"
                type="text"
                required
                maxLength={100}
                value={driverName}
                ref={driverRef}
                onChange={e => setDriverName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    gradeRef.current?.focus();
                  }
                }}
                className="w-full px-4 py-2 bg-slate-200 border border-slate-200 rounded-lg outline-none text-sm"
                placeholder="Driver name"
              />
            </div>

            <div id="field-start-time">
              <label htmlFor="input-start-time" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</label>
              <div className="flex space-x-2">
                <input
                  id="input-start-time"
                  type="text"
                  required
                  maxLength={25}
                  value={startTime}
                  ref={startTimeRef}
                  onChange={e => setStartTime(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      stopTimeRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-center"
                />
                <button
                  id="btn-start-time-now"
                  type="button"
                  ref={startTimeNowBtnRef}
                  onClick={() => {
                    setStartTime(getCurrentTimeFormatted());
                    stopTimeNowBtnRef.current?.focus();
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs tracking-wider transition-colors shrink-0"
                >
                  NOW
                </button>
              </div>
            </div>

            <div id="field-stop-time">
              <label htmlFor="input-stop-time" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stop Time</label>
              <div className="flex space-x-2">
                <input
                  id="input-stop-time"
                  type="text"
                  required
                  maxLength={25}
                  value={stopTime}
                  ref={stopTimeRef}
                  onChange={e => setStopTime(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveBtnRef.current?.focus();
                    }
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-center"
                />
                <button
                  id="btn-stop-time-now"
                  type="button"
                  ref={stopTimeNowBtnRef}
                  onClick={() => {
                    setStopTime(getCurrentTimeFormatted());
                    saveBtnRef.current?.focus();
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs tracking-wider transition-colors shrink-0"
                >
                  NOW
                </button>
              </div>
            </div>

            <div className="md:col-span-2 xl:col-span-4 pt-4 flex justify-end">
              <button
                id="btn-save-entry"
                type="submit"
                ref={saveBtnRef}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>SAVE ENTRY</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
