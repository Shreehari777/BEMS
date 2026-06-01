'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { cachedFetch, CACHE_TTL } from '@/lib/api-cache';

const DEFAULT_GRADES = ['M10', 'M15', 'M20', 'M25', 'M30', 'M35', 'M40', 'M45', 'M50', 'M55', 'M60', 'M65', 'M70'];
const MATERIALS = [
  { id: 'stone20mm', label: '20MM' },
  { id: 'sand', label: 'SAND' },
  { id: 'moisture', label: 'Moi' },
  { id: 'sand1', label: 'SAND1' },
  { id: 'stone10mm', label: '10MM' },
  { id: 'cem1', label: 'CEM1' },
  { id: 'cem2', label: 'CEM2' },
  { id: 'flyAsh', label: 'FILL' },
  { id: 'water', label: 'WATER' },
  { id: 'watIce', label: 'WAT/I' },
  { id: 'silica', label: 'Silica' },
  { id: 'adm1', label: 'ADM1' },
  { id: 'adm2', label: 'ADM2' },
];

export default function RecipesPage() {
  const [data, setDataState] = useState<{
    grades: string[];
    recipes: Record<string, any>;
    tolerances: Record<string, number>;
  }>({ grades: [], recipes: {}, tolerances: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newGrade, setNewGrade] = useState('');

  const recipes = data.recipes;
  const grades = data.grades;
  const tolerances = data.tolerances;

  const fetchData = async (showSpinner = true) => {
    if (showSpinner && data.grades.length === 0) setLoading(true);
    try {
      const [recData, setDataVal] = await Promise.all([
        cachedFetch<any[]>('/api/recipes', { ttl: CACHE_TTL.long }),
        cachedFetch<any>('/api/settings', { ttl: CACHE_TTL.long }),
      ]);
      if (!recData) return;

      let dbGrades = Array.isArray(recData) ? recData.map((r: any) => r.grade) : [];
      const recObj: Record<string, any> = {};
      dbGrades.forEach((g: string) => {
        const existing = Array.isArray(recData) ? recData.find((r: any) => r.grade === g) : null;
        recObj[g] = existing || { grade: g };
        MATERIALS.forEach(m => {
          if (recObj[g][m.id] === undefined) recObj[g][m.id] = 0;
        });
      });

      const newTolerances = setDataVal?.materialTolerances || {};
      
      // Batch state update
      setDataState({ grades: dbGrades, recipes: recObj, tolerances: newTolerances });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('recipes_cache', JSON.stringify(recObj));
        localStorage.setItem('grades_cache', JSON.stringify(dbGrades));
        localStorage.setItem('tolerances_cache', JSON.stringify(newTolerances));
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
    setLoading(false);
  };

  // Initial load from cache
  useEffect(() => {
    const loadCache = () => {
      if (typeof window === 'undefined') return;

      const cachedRecipes = localStorage.getItem('recipes_cache');
      const cachedTolerances = localStorage.getItem('tolerances_cache');
      const cachedGrades = localStorage.getItem('grades_cache');
      
      if (cachedRecipes && cachedGrades) {
        try {
          const parsedRecipes = JSON.parse(cachedRecipes);
          const parsedGrades = JSON.parse(cachedGrades);
          const parsedTolerances = cachedTolerances ? JSON.parse(cachedTolerances) : {};
          
          setDataState({
            recipes: parsedRecipes,
            grades: parsedGrades,
            tolerances: parsedTolerances
          });
          setLoading(false);
        } catch (e) {
          console.error('Failed to parse cache', e);
        }
      }
    };
    
    // Wrap in timeout to satisfy "no sync setState in effect" linter
    const t = setTimeout(loadCache, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchData(data.grades.length === 0), 0);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (grade: string, field: string, value: string) => {
    // Store raw string while typing to allow intermediate states like "0.", "1.2"
    // Convert to number only when the string represents a complete number
    const isIntermediate = value.endsWith('.') || value.endsWith('-') || value === '';
    const storeValue = value === '' ? '' : (isIntermediate ? value : Number(value));
    setDataState(prev => ({
      ...prev,
      recipes: {
        ...prev.recipes,
        [grade]: {
          ...prev.recipes[grade],
          [field]: storeValue
        }
      }
    }));
  };

  const handleToleranceChange = (field: string, value: string) => {
    setDataState(prev => ({
      ...prev,
      tolerances: {
        ...prev.tolerances,
        [field]: value === '' ? 0 : Number(value)
      }
    }));
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade.trim()) return;
    const grade = newGrade.trim().toUpperCase();
    if (!grades.includes(grade)) {
      const newObj: any = { grade };
      MATERIALS.forEach(m => newObj[m.id] = 0);

      // Optimistic update
      setDataState(prev => ({
        ...prev,
        grades: [...prev.grades, grade],
        recipes: { ...prev.recipes, [grade]: newObj }
      }));
      
      try {
        await fetch('/api/recipes', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(newObj),
        });
        
        if (typeof localStorage !== 'undefined') {
            const cachedRecipes = JSON.parse(localStorage.getItem('recipes_cache') || '{}');
            cachedRecipes[grade] = newObj;
            localStorage.setItem('recipes_cache', JSON.stringify(cachedRecipes));
            
            const cachedGrades = JSON.parse(localStorage.getItem('grades_cache') || '[]');
            if (!cachedGrades.includes(grade)) {
                cachedGrades.push(grade);
                localStorage.setItem('grades_cache', JSON.stringify(cachedGrades));
            }
        }
        window.dispatchEvent(new Event('bemsDataUpdated'));
      } catch (err) {
        console.error('Failed to save new grade immediately', err);
      }
    }
    setNewGrade('');
  };

  const handleReset = () => {
    const emptyObj: Record<string, any> = {};
    grades.forEach(g => {
      emptyObj[g] = { grade: g };
      MATERIALS.forEach(m => emptyObj[g][m.id] = 0);
    });
    const zeroTolerances: Record<string, number> = {};
    MATERIALS.forEach(m => zeroTolerances[m.id] = 0);
    setDataState(prev => ({
      ...prev,
      recipes: emptyObj,
      tolerances: zeroTolerances
    }));
  };

  const handleDeleteGrade = async (gradeToDelete: string) => {
    setSaving(true);
    try {
      await fetch(`/api/recipes?grade=${encodeURIComponent(gradeToDelete)}`, { method: 'DELETE' });
      
      const newGrades = grades.filter(g => g !== gradeToDelete);
      const newRecipes = { ...recipes };
      delete newRecipes[gradeToDelete];

      setDataState(prev => ({
        ...prev,
        grades: newGrades,
        recipes: newRecipes
      }));
      
      if (typeof localStorage !== 'undefined') {
          localStorage.setItem('recipes_cache', JSON.stringify(newRecipes));
          localStorage.setItem('grades_cache', JSON.stringify(newGrades));
      }
      window.dispatchEvent(new Event('bemsDataUpdated'));
    } catch (e) {
      console.error('Failed to delete grade.', e);
    }
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sanitize: convert any remaining strings (like '' or '0.') to proper numbers
      const cleanedRecipes = Object.values(recipes).map((r: any) => {
        const cleaned = { ...r };
        MATERIALS.forEach(m => {
          const v = cleaned[m.id];
          cleaned[m.id] = (v === '' || v === undefined || v === null) ? 0 : Number(v) || 0;
        });
        return cleaned;
      });

      // Save all recipes
      await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedRecipes),
      });

      // Save global tolerances
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'materialTolerances', value: tolerances }),
      });

      window.dispatchEvent(new Event('bemsDataUpdated'));
      alert('All recipes and tolerances saved successfully!');
    } catch (e) {
      alert('Failed to save data');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bulk Recipe Editor</h2>
          <p className="text-sm text-gray-500 mt-1">Configure mix designs and tolerances for all concrete grades.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleReset}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Clear Boxes
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-sm shadow-md disabled:bg-blue-400"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="px-4 py-3 text-left font-bold border-r border-slate-800 w-24">GRADE</th>
                {MATERIALS.map(m => (
                  <th key={m.id} className="px-2 py-3 text-center font-bold text-[11px] uppercase tracking-wider min-w-[80px]">
                    {m.label}
                  </th>
                ))}
                <th className="px-2 py-3 text-center font-bold text-[11px] uppercase tracking-wider w-12 text-slate-400">
                  <Trash2 className="w-4 h-4 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#fcfbf9]">
              {grades.length === 0 && !loading && (
                <tr>
                  <td colSpan={MATERIALS.length + 2} className="py-8 text-center text-slate-500">
                    <p className="text-sm">No grades found. You can add them manually.</p>
                  </td>
                </tr>
              )}
              {grades.map((g) => (
                <tr key={g} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800 border-r border-slate-100">{g}</td>
                  {MATERIALS.map(m => (
                    <td key={m.id} className="p-2">
                      <input
                        type="number"
                        step="any"
                        value={recipes[g]?.[m.id] === undefined ? '' : recipes[g][m.id]}
                        onChange={(e) => handleInputChange(g, m.id, e.target.value)}
                        onBlur={(e) => { if (e.target.value === '') handleInputChange(g, m.id, ''); }}
                        placeholder="0"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-sm transition-all"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-3 text-center align-middle">
                    <button 
                      onClick={() => handleDeleteGrade(g)}
                      title={`Delete ${g}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#fff9ed]">
                <td className="px-4 py-4 font-black text-slate-900 border-r border-[#ffe0b2] whitespace-nowrap">
                  DIFF (±)
                </td>
                {MATERIALS.map(m => (
                  <td key={m.id} className="p-2">
                    <input
                      type="number"
                      step="any"
                      value={tolerances[m.id] === undefined ? '' : tolerances[m.id]}
                      onChange={(e) => handleToleranceChange(m.id, e.target.value)}
                      className="w-full px-2 py-2 bg-white border-2 border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-center text-sm font-bold transition-all shadow-sm"
                    />
                  </td>
                ))}
                <td className="px-2 py-3 bg-[#fff9ed]"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500 italic">Need to add a custom grade not listed above?</span>
            <form onSubmit={handleAddGrade} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="e.g. M7.5 or CUSTOM" 
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-blue-500 w-48"
                />
                <button type="submit" disabled={!newGrade.trim()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 disabled:opacity-50">
                    <Plus className="w-4 h-4" /> Add Grade
                </button>
            </form>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Save className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Bulk Saving Mode</h4>
          <p className="text-xs text-blue-700">Enter values for all concrete grades in one go. Click &quot;Save All Changes&quot; to update your fleet records and tolerances.</p>
        </div>
      </div>
    </div>
  );
}
