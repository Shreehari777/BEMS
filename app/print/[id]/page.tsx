'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, Save, Edit2, X } from 'lucide-react';

const Invoice = ({ report, rate, setRate, onSave, editing, setEditing, saving }: any) => {
  if (!report) return null;
  const quantity = Number(report.quantity || 0);
  const amount = quantity * rate;
  const sgst = amount * 0.09;
  const cgst = amount * 0.09;
  const grandTotal = amount + sgst + cgst;

  return (
    <div className="w-full bg-white p-12 print:p-0 print:shadow-none print:border-none print:w-full" style={{ minHeight: '297mm', fontFamily: '"Times New Roman", Times, serif' }}>
      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-[#990000] flex items-center justify-center bg-white shadow-sm overflow-hidden">
            <span className="text-[#990000] font-bold text-4xl" style={{ transform: 'scaleX(1.2)' }}>M</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#990000] tracking-tight uppercase leading-none">MATRIX INFRA RMC</h1>
            <p className="text-sm font-bold text-[#990000] mt-1 italic">Suppliers : All Types of Ready Mix Concrete</p>
            <div className="text-[11px] text-gray-500 mt-2 max-w-xs leading-relaxed">
               Office : A/p, Kharpudi (B), Khed City Road, Mandawala, Tal. Khed, Dist. Pune - 410505.<br/>
               Mob.: 9325714072 | 9405818311
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-extrabold text-gray-200 uppercase tracking-widest -mt-2">INVOICE</h2>
          <div className="mt-4 space-y-1">
            <div className="text-sm"><span className="font-bold text-gray-500">Invoice No:</span> <span className="font-mono text-gray-900">BR-{report.docketNumber}</span></div>
            <div className="text-sm"><span className="font-bold text-gray-500">Date:</span> <span className="text-gray-900">{format(new Date(report.date), 'dd/MM/yyyy')}</span></div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Bill To</h3>
          <p className="text-xl font-bold text-gray-900">{report.customerName}</p>
          <p className="text-gray-600 mt-1">{report.site}</p>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Project Details</h3>
          <p className="text-gray-900 font-bold"><span className="text-gray-500 font-medium">Grade & Mix:</span> {report.grade}</p>
          <p className="text-gray-600"><span className="text-gray-500 font-medium">Docket:</span> #{report.docketNumber}</p>
          <p className="text-gray-600"><span className="text-gray-500 font-medium">Vehicle:</span> {report.vehicleNumber}</p>
        </div>
      </div>

      {/* Table */}
      <div className="mb-10">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-4 py-3 text-left border-b-2 border-gray-200">Description</th>
              <th className="px-4 py-3 text-right border-b-2 border-gray-200">Qty (m³)</th>
              <th className="px-4 py-3 text-right border-b-2 border-gray-200">Rate (₹)</th>
              <th className="px-4 py-3 text-right border-b-2 border-gray-200">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-6 text-gray-800">
                <p className="font-bold text-lg leading-tight">Ready Mix Concrete - {report.grade}</p>
                <p className="text-sm text-gray-500 mt-1">Ref: {report.docketNumber}</p>
              </td>
              <td className="px-4 py-6 text-right text-gray-900 font-medium text-lg">
                {quantity.toFixed(2)}
              </td>
              <td className="px-4 py-6 text-right">
                <div className="flex items-center justify-end gap-2 group">
                  {editing ? (
                    <div className="flex items-center gap-1 no-print">
                      <input 
                        type="number" 
                        autoFocus
                        value={rate}
                        onChange={(e) => setRate(Number(e.target.value))}
                        className="w-24 text-right px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg font-medium"
                      />
                      <button onClick={onSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditing(false)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                         <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-900 font-medium text-lg">₹{Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <button 
                         onClick={() => setEditing(true)}
                         className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-all no-print"
                      >
                         <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {/* Keep static rate for printing when editing */}
                  {editing && <span className="hidden print:inline text-gray-900 font-medium text-lg">₹{Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>}
                </div>
              </td>
              <td className="px-4 py-6 text-right text-gray-900 font-bold text-lg">
                ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end pt-6 border-t-2 border-gray-100 mb-20">
        <div className="w-full max-w-xs space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-sm">
            <span>SGST (9%)</span>
            <span>₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-sm border-b border-gray-100 pb-3">
            <span>CGST (9%)</span>
            <span>₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-[#990000] pt-2">
            <span>Total</span>
            <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-gray-100 pt-8 flex justify-between items-end">
        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
           Generated by BEMS v3.0
        </div>
        <div className="text-right">
          <div className="mb-12 text-sm font-bold text-gray-400 uppercase tracking-widest">Authorized Signature</div>
          <div className="pt-2 border-t border-gray-200">
            <p className="font-bold text-gray-800">For MATRIX INFRA RMC</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryChallan = ({ report, copyType }: { report: any, copyType: string }) => {
  if (!report) return null;
  return (
    <div className="w-full flex-1 flex flex-col relative bg-white px-8 py-4 print:pb-8" style={{ height: '135mm', maxHeight: '135mm', boxSizing: 'border-box', overflow: 'hidden', fontFamily: '"Times New Roman", Times, serif' }}>
      <div className="absolute top-2 right-8 text-xs font-bold text-[#990000] border border-[#990000] px-2 py-0.5 rounded-sm bg-white">
        {copyType}
      </div>
      
      <div className="flex w-full items-start mb-1 relative">
        <div className="w-24">
          <div className="w-16 h-16 rounded-full border-[3px] border-[#990000] flex items-center justify-center relative bg-white shadow-sm overflow-hidden">
             <div className="w-8 h-8 rounded-full flex items-center justify-center">
                 <span className="text-[#990000] font-bold text-3xl z-10" style={{fontFamily: '"Times New Roman", Times, serif', transform: 'scaleX(1.2)'}}>M</span>
             </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-[#990000] font-[900] text-[34px] tracking-wide m-0 leading-[1.1] uppercase drop-shadow-sm" style={{textShadow: "1px 0px 0px #990000, 0px 1px 0px #990000", fontFamily: '"Times New Roman", Times, serif'}}>
             MATRIX INFRA RMC
          </h1>
          <div className="text-[#990000] text-[13px] font-bold mt-0.5 mb-1 tracking-tight">Suppliers : All Types of Ready Mix Concrete,iers</div>
          <div className="text-[#990000] text-[10px] font-semibold text-center mt-0.5 max-w-[85%] leading-tight">
             Office : A/p, Kharpudi (B), Khed City Road, Mandawala, Tal. Khed, Dist. Pune - 410505.
          </div>
        </div>
        
        <div className="w-28 flex flex-col items-end pt-8">
          <div className="text-[#990000] text-[11px] font-bold whitespace-nowrap">Mob.: 9325714072</div>
          <div className="text-[#990000] text-[11px] font-bold whitespace-nowrap pr-1">9405818311</div>
        </div>
      </div>
      
      <div className="flex justify-center mb-1 relative z-10 -mt-1">
         <div className="bg-[#990000] text-white font-bold text-xs px-6 py-0.5 tracking-wider uppercase border border-[#990000]">
            DELIVERY CHALLAN
         </div>
      </div>
      
      <div className="border border-[#990000] flex flex-col flex-1 p-3 gap-1 text-[#990000] font-semibold text-[13px] bg-white">
         <div className="flex justify-between w-full">
            <div className="flex w-[40%] items-end">
               <span className="w-16 pb-0.5">DC No.</span>
               <div className="flex-1 border-[#990000] text-center font-bold text-black pb-0 leading-[1.1]">
                  <span className="px-4 py-0.5 border-b border-[#990000]">{report.docketNumber || '-'}</span>
               </div>
            </div>
            <div className="flex w-[35%] items-end">
               <span className="w-12 pb-0.5 text-right pr-2">Date :</span>
               <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1]">
                  {report.date ? format(new Date(report.date), 'dd-MMM-yyyy') : ''}
               </div>
            </div>
         </div>
         
         <div className="flex w-full items-end mt-1">
            <span className="w-12 pb-0.5">M/s.</span>
            <div className="flex-1 border-b border-[#990000] text-black pb-0 leading-[1.1] pl-2">{report.customerName}</div>
         </div>
         
         <div className="flex w-full items-end mt-1">
            <span className="w-12 pb-0.5">Site :</span>
            <div className="flex-1 border-b border-[#990000] text-black pb-0 leading-[1.1] pl-2">{report.site}</div>
         </div>
         
         <div className="flex justify-between w-full mt-1">
            <div className="flex flex-1 items-end pr-4">
               <span className="w-40 pb-0.5">Grade of Concrete :</span>
               <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1]">{report.grade}</div>
            </div>
            <div className="flex w-[40%] items-end">
               <span className="w-24 pb-0.5">Driver Name :</span>
               <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1]">{report.driverName}</div>
            </div>
         </div>

         <div className="flex justify-between w-full mt-1">
            <div className="flex flex-1 items-end pr-4">
               <span className="w-20 pb-0.5">Quantity :</span>
               <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1]">{Number(report.quantity || 0).toFixed(2)} M³</div>
            </div>
            <div className="flex w-[40%] items-end">
               <span className="w-24 pb-0.5">TM No. :</span>
               <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1]">{report.vehicleNumber}</div>
            </div>
         </div>
         
         <div className="flex w-full items-end pr-4 mt-1">
               <span className="w-44 whitespace-nowrap pb-0.5">Cumulative Quantity :</span>
               <div className="w-24 border-b border-[#990000] text-center text-black pb-0 leading-[1.1]"></div>
               <span className="px-2">:</span>
         </div>

         <div className="flex justify-between w-full mt-3 flex-1 relative">
             <div className="flex flex-col gap-3 font-normal mt-1 w-[40%] text-[12px]">
                 <div className="flex items-center gap-2">
                     <div className="w-[14px] h-[14px] border border-[#990000]"></div>
                     <span>Pump</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-[14px] h-[14px] border border-[#990000]"></div>
                     <span>Manual</span>
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="w-[14px] h-[14px] border border-[#990000]"></div>
                     <span className="whitespace-nowrap">Batch Sheet No.</span>
                 </div>
             </div>
             
             <div className="flex flex-col gap-2 w-[55%] items-end">
                 <div className="flex w-full items-end">
                     <span className="w-52 whitespace-nowrap text-right pr-2">Dispatch Time From Plant :</span>
                     <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1] max-w-24">{report.startTime}</div>
                 </div>
                 <div className="flex w-full items-end">
                     <span className="w-52 whitespace-nowrap text-right pr-2">Arrival Time of TM at Site :</span>
                     <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1] max-w-24"></div>
                 </div>
                 <div className="flex w-full items-end">
                     <span className="w-52 whitespace-nowrap text-right pr-2">Depart Time of TM From Site :</span>
                     <div className="flex-1 border-b border-[#990000] text-center text-black pb-0 leading-[1.1] max-w-24"></div>
                 </div>
             </div>
         </div>
         
         <div className="flex justify-between w-full mt-auto pt-8 pb-1">
            <div className="text-[12px] font-medium tracking-tight">Custome Sign with Seal</div>
            <div className="text-[12px] font-bold tracking-tight pr-4">For MATRIX INFRA RMC</div>
         </div>
      </div>
    </div>
  );
};

export default function PrintReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(0);
  const [editingRate, setEditingRate] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch('/api/reports');
        const data = await response.json();
        const foundReport = data.find((r: any) => (r._id === id || r.id === id));
        if (foundReport) {
          setReport(foundReport);
          setRate(foundReport.rate || 0);
        }
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchReport();
    }
  }, [id]);

  useEffect(() => {
    if (report && !loading && !editingRate) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
            // window.print(); // Commented out so user can edit rate first if they want
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [report, loading, editingRate]);

  const handleSaveRate = async () => {
    setSavingRate(true);
    try {
      const res = await fetch(`/api/reports/${id}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate }),
      });
      if (res.ok) {
        setReport({ ...report, rate });
        setEditingRate(false);
      }
    } catch (err) {
      console.error(err);
    }
    setSavingRate(false);
  };


  if (loading) return <div className="p-8 text-center">Loading Report...</div>;
  if (!report) return <div className="p-8 text-center text-red-500 font-bold">Report not found</div>;

  const batches = report.batches || [];
  const targets = report.targets || {};

  // Raw sum of all batch rows (used as fallback for old reports without adjustedActuals)
  const calculateTotal = (key: string) => {
    return batches.reduce((sum: number, batch: any) => sum + (Number(batch[key]) || 0), 0);
  };

  const rawTotals: any = {
    stone10mm: calculateTotal('stone10mm'),
    sand: calculateTotal('sand'),
    sand1: calculateTotal('sand1'),
    stone20mm: calculateTotal('stone20mm'),
    cem1: calculateTotal('cem1'),
    cem2: calculateTotal('cem2'),
    ggbs: calculateTotal('ggbs'),
    flyAsh: calculateTotal('flyAsh'),
    water: calculateTotal('water'),
    watIce: calculateTotal('watIce'),
    silica: calculateTotal('silica'),
    adm1: calculateTotal('adm1'),
    adm2: calculateTotal('adm2'),
  };

  const pt = (val: any) => val !== undefined ? Math.round(Number(val)) : 0;
  
  // "Total Set Weight in Kgs." = target × numBatches (from setWeights in DB)
  // Falls back to target × batches.length for old reports
  const sw = report.setWeights || {};
  const totalTargets = Object.keys(targets).reduce((acc: any, key) => {
    acc[key] = sw[key] !== undefined ? Number(sw[key]) : (Number(targets[key]) || 0) * batches.length;
    return acc;
  }, {});

  // "Total Actual in Kgs." = real sum + DIFF offset (from adjustedActuals in DB)
  // Falls back to raw batch sum for old reports
  const aa = report.adjustedActuals || {};
  const totals: any = Object.keys(rawTotals).reduce((acc: any, key) => {
    acc[key] = aa[key] !== undefined ? Number(aa[key]) : rawTotals[key];
    return acc;
  }, {});

  return (
    <div className="print-wrapper min-h-screen bg-white flex flex-col items-center pb-20 relative">
      <button 
        onClick={() => router.back()} 
        className="no-print fixed top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 font-sans"
      >
        &larr; Back
      </button>
      <style dangerouslySetInnerHTML={{ __html: `
        /* --- ADJUST SPACING HERE --- */
        :root {
            --table-cell-padding: 1px;      /* Space inside each cell (1px as requested) */
            --table-margin-top: 0px;        /* Space above the main table */
            --line-height-tight: 1;         /* Space between lines of text */
            --vertical-align: bottom;       /* Align text to bottom/top of cell */
            --info-margin-bottom: 0px;      /* Space below headers */
        }

        .print-page-body {
            font-family: "Times New Roman", Times, serif;
            font-size: 14px;
            color: #333; /* Reduced black color */
            margin: 0;
            padding: 20px;
            line-height: 1.2;
            background: #f3f4f6;
        }

        .report-container {
            width: 850px;
            margin: 10px auto;
            border: 1px solid #ccc;
            padding: 20px 40px;
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .report-header {
            text-align: center;
            margin-bottom: 10px;
        }

        .report-header h1 {
            font-size: 18px;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
        }

        .sub-header {
            display: flex;
            align-items: center;
            margin-top: 15px;
            margin-bottom: 20px;
        }

        .logo-box {
            width: 40px;
            height: 40px;
            background: #666;
            margin-right: 15px;
            clip-path: polygon(0 0, 100% 0, 70% 100%, 0% 100%);
        }

        .system-info {
            font-weight: bold;
            font-size: 16px;
        }

        .doc-title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            text-decoration: none;
        }

        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: var(--info-margin-bottom);
            font-size: 13.3px;
        }

        /* Table Styling */
        .batch-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: var(--table-margin-top);
            font-size: 13.3px;
            line-height: var(--line-height-tight);
        }

        .batch-table th {
            font-weight: normal;
            padding: var(--table-cell-padding);
            padding-right: 22px;
            text-align: right;
            vertical-align: var(--vertical-align);
        }

        .batch-table th.section-head {
            text-align: center !important;
            padding-right: 0 !important;
            padding-bottom: 13px !important;
            font-size: 14.5px;
            font-weight: 900 !important;
            vertical-align: var(--vertical-align);
            border-bottom: none;
        }

        .batch-table td {
            padding: var(--table-cell-padding);
            padding-right: 22px;
            text-align: right;
            vertical-align: var(--vertical-align);
        }

        .border-top {
            border-top: 1px solid #333;
        }

        .border-bottom {
            border-bottom: 1px solid #333;
        }

        .footer-row {
            font-weight: normal;
        }

        .delivery-challan-container {
            width: 850px;
            margin: 20px auto;
            background: #fff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 277mm;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            box-sizing: border-box;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .invoice-container {
            width: 850px;
            margin: 20px auto;
            background: #fff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body { 
                background: #fff !important;
            }
            .print-wrapper {
                background: #fff !important;
                display: block !important;
                padding: 0 !important;
            }
            .print-page-body {
                background: #fff !important;
                padding: 0 !important;
            }
            .report-container { 
                border: none !important; 
                width: 100% !important; 
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-after: always;
                break-after: page;
            }
            .delivery-challan-container {
                border: none !important; 
                width: 100% !important; 
                height: 277mm !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-after: always;
                break-after: page;
            }
            .invoice-container {
                border: none !important; 
                width: 100% !important; 
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                page-break-before: always;
                break-before: page;
            }
            @page {
                size: A4 portrait;
                margin: 10mm;
            }
        }
      `}} />

      <div className="print-page-body w-full flex flex-col items-center">
        <div className="report-container">
            <div className="report-header" style={{ marginBottom: '5px' }}>
                <h1 style={{ fontSize: '20px' }}>MATRIX INFRA</h1>
            </div>

            <div className="sub-header" style={{ marginBottom: '5px', marginTop: '0', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg viewBox="0 0 100 100" style={{ width: '45px', height: '45px', marginRight: '15px', marginTop: '4px', overflow: 'hidden' }}>
                        <rect x="0" y="0" width="100" height="100" fill="white" />
                        <polygon points="5,100 35,100 65,0 35,0" fill="#8dc63f" />
                        <polygon points="35,100 65,100 95,0 65,0" fill="#007236" />
                        <rect x="0" y="0" width="100" height="100" fill="none" stroke="black" strokeWidth="4" />
                    </svg>
                    <div className="system-info" style={{ fontSize: '18px', fontWeight: 'bold' }}>MCI 70 N Control System Ver 3.0</div>
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px', textAlign: 'left', lineHeight: '1.2' }}>SCHWING<br/>Stetter</div>
            </div>

            <div className="doc-title" style={{ margin: '20px 0' }}>Docket / Batch Report / Autographic Record</div>

            <div className="info-section" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '13px' }}>
                <div style={{ width: '55%' }}>
                    <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
                        <tbody>
                            <tr><td style={{fontWeight: 'bold', width: '110px', paddingBottom: '2px', paddingLeft: '3px'}}>Batch Date</td><td style={{width: '15px', paddingBottom: '2px', textAlign: 'center', fontWeight: 'bold'}}>:</td><td style={{paddingBottom: '2px'}}>&nbsp; {report.date ? format(new Date(report.date), 'dd-MMM-yyyy') : ''}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '2px', paddingLeft: '0px'}}>Batch Start Time</td><td style={{paddingBottom: '2px', textAlign: 'center', fontWeight: 'bold'}}>:</td><td style={{paddingBottom: '2px'}}>&nbsp; {report.startTime || ''}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '2px', paddingLeft: '0px'}}>Batch End Time</td><td style={{paddingBottom: '2px', textAlign: 'center', fontWeight: 'bold'}}>:</td><td style={{paddingBottom: '2px'}}>&nbsp; {report.stopTime || ''}</td></tr>
                        </tbody>
                    </table>
                    
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <tbody>
                            <tr><td style={{fontWeight: 'bold', width: '180px', paddingBottom: '3px', verticalAlign: 'middle', whiteSpace: 'nowrap', paddingLeft: '3px'}}>Batch Number / Docket Number</td><td style={{width: '20px', paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.docketNumber}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Customer</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.customerName}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Site</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.site}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Recipe Code</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.grade}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Recipe Name</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.grade}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Truck Number</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.vehicleNumber}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Truck Driver</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.driverName}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Order Number</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.orderNumber || '-'}</td></tr>
                            <tr><td style={{fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px'}}>Batcher Name</td><td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle'}}>:</td><td style={{paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px'}}>{report.batcherName || 'Stetter'}</td></tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ width: '40%', paddingLeft: '60px' }}>
                    <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '10px'}}>
                        <tbody>
                            <tr>
                                <td style={{fontWeight: 'bold', paddingBottom: '2px', paddingLeft: '2px', width: '155px'}}>Plant Serial Number:</td>
                                <td style={{paddingBottom: '2px', textAlign: 'left', paddingLeft: '8px'}}>CP30</td>
                            </tr>
                            <tr><td colSpan={4} style={{paddingBottom: '2px'}}>&nbsp;</td></tr>
                            <tr><td colSpan={4} style={{paddingBottom: '2px'}}>&nbsp;</td></tr>
                        </tbody>
                    </table>
                    
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                        <tbody>
                            <tr>
                                <td style={{fontWeight: 'bold', width: '135px', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap'}}>Ordered Quantity</td>
                                <td style={{width: '20px', paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center'}}>:</td>
                                <td style={{paddingBottom: '3px', textAlign: 'left', width: '50px', paddingLeft: '8.9px'}}>{Number(report.orderedQuantity || 0).toFixed(2)}</td>
                                <td style={{paddingBottom: '3px', paddingLeft: '10px'}}>M&sup3;</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap'}}>Production Quantity</td>
                                <td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center'}}>:</td>
                                <td style={{paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px'}}>{Number(report.quantity || 0).toFixed(2)}</td>
                                <td style={{paddingBottom: '3px', paddingLeft: '10px'}}>M&sup3;</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap'}}>Adj/Manual Quantity</td>
                                <td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center'}}>:</td>
                                <td style={{paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px'}}>{Number(report.adjManualQuantity || 0).toFixed(2)}</td>
                                <td style={{paddingBottom: '3px', paddingLeft: '10px'}}>M&sup3;</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap'}}>With This Load</td>
                                <td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center'}}>:</td>
                                <td style={{paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px'}}>{Number(report.withThisLoad || report.quantity || 0).toFixed(2)}</td>
                                <td style={{paddingBottom: '3px', paddingLeft: '10px'}}>M&sup3;</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap'}}>Mixer Capacity</td>
                                <td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center'}}>:</td>
                                <td style={{paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px'}}>{Number(report.mixerCapacity || 0.5).toFixed(2)}</td>
                                <td style={{paddingBottom: '3px', paddingLeft: '10px'}}>M&sup3;</td>
                            </tr>
                            <tr>
                                <td style={{fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap'}}>Batch Size</td>
                                <td style={{paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center'}}>:</td>
                                <td style={{paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px'}}>{Number(report.batchSize || report.mixerCapacity || 0.5).toFixed(2)}</td>
                                <td style={{paddingBottom: '3px', paddingLeft: '10px'}}>M&sup3;</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <table className="batch-table">
                <thead>
                    <tr>
                        <th colSpan={5} className="section-head"><b>Aggregate</b></th>
                        <th colSpan={3} className="section-head"><b>Cement</b></th>
                        <th colSpan={2} className="section-head"><b>Water</b></th>
                        <th className="section-head"><b>Silica</b></th>
                        <th colSpan={2} className="section-head"><b>Admixture</b></th>
                    </tr>
                    <tr>
                        <th>20MM</th><th>SAND</th><th>Moi</th><th>SAND1</th><th>10MM</th>
                        <th>CEM1</th><th>FILL</th>
                        <th>WATER</th><th>WAT/I</th>
                        <th>Silica</th><th>ADM1</th><th>ADM2</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colSpan={13} style={{textAlign: 'left', padding: '1px 5px'}}>Targets based on batchsize in Kg</td>
                    </tr>
                    <tr>
                        <td>{pt(targets.stone20mm)}</td>
                        <td>{pt(targets.sand)}</td>
                        <td style={{whiteSpace: 'nowrap'}}><span style={{fontSize: '11px', marginRight: '4px', lineHeight: '1'}}>in %</span>{pt(targets.moisture) !== 0 ? pt(targets.moisture) : ''}</td>
                        <td>{pt(targets.sand1)}</td>
                        <td>{pt(targets.stone10mm)}</td>
                        <td>{pt(targets.cem1 || 0) + pt(targets.cem2 || 0)}</td>
                        <td>{pt(targets.flyAsh || 0) + pt(targets.ggbs || 0)}</td>
                        <td style={{whiteSpace: 'nowrap'}}>{pt(targets.water)} <span style={{marginLeft: '8px'}}>+/-</span></td>
                        <td>{pt(targets.watIce) !== 0 ? pt(targets.watIce) : '0'}</td>
                        <td>{pt(targets.silica)}</td>
                        <td>{targets.adm1 !== undefined ? Number(targets.adm1).toFixed(2) : "0.00"}</td>
                        <td>{targets.adm2 !== undefined ? Number(targets.adm2).toFixed(2) : "0.00"}</td>
                    </tr>
                    <tr className="border-top">
                        <td colSpan={13} style={{textAlign: 'left', padding: '5px 5px 1px 5px'}}>Actual in Kgs.</td>
                    </tr>
                    {batches.map((batch: any, i: number) => (
                        <tr key={i}>
                            <td>{batch.stone20mm || 0}</td>
                            <td>{batch.sand || 0}</td>
                            <td>{(batch.moisture || 0).toFixed(1)}</td>
                            <td>{batch.sand1 || 0}</td>
                            <td>{batch.stone10mm || 0}</td>
                            <td>{(batch.cem1 || 0) + (batch.cem2 || 0)}</td>
                            <td>{(batch.flyAsh || 0) + (batch.ggbs || 0)}</td>
                            <td>{batch.water || 0} <span style={{marginLeft: '12px'}}>0</span></td>
                            <td>{batch.watIce || 0}</td>
                            <td>{batch.silica || 0}</td>
                            <td>{batch.adm1 !== undefined ? Number(batch.adm1).toFixed(2) : "0.00"}</td>
                            <td>{batch.adm2 !== undefined ? Number(batch.adm2).toFixed(2) : "0.00"}</td>
                        </tr>
                    ))}
                    <tr className="footer-row border-top">
                        <td colSpan={13} style={{textAlign: 'left', padding: '5px 5px 5px 5px'}}>Total Set Weight in Kgs.</td>
                    </tr>
                    <tr>
                        <td>{totalTargets.stone20mm || 0}</td>
                        <td>{totalTargets.sand || 0}</td>
                        <td>0</td>
                        <td>{totalTargets.sand1 || 0}</td>
                        <td>{totalTargets.stone10mm || 0}</td>
                        <td>{(totalTargets.cem1 || 0) + (totalTargets.cem2 || 0)}</td>
                        <td>{(totalTargets.flyAsh || 0) + (totalTargets.ggbs || 0)}</td>
                        <td style={{whiteSpace: 'nowrap'}}>{totalTargets.water || 0} <span style={{visibility: 'hidden', marginLeft: '8px'}}>+/-</span></td>
                        <td>{totalTargets.watIce || 0}</td>
                        <td>{totalTargets.silica || 0}</td>
                        <td>{totalTargets.adm1 !== undefined ? Number(totalTargets.adm1).toFixed(2) : "0.00"}</td>
                        <td>{totalTargets.adm2 !== undefined ? Number(totalTargets.adm2).toFixed(2) : "0.00"}</td>
                    </tr>
                    <tr className="footer-row">
                        <td colSpan={13} style={{textAlign: 'left', padding: '10px 5px 1px 5px'}}>Total Actual in Kgs.</td>
                    </tr>
                    <tr className="border-bottom">
                        <td style={{paddingBottom: '5px'}}>{totals.stone20mm}</td>
                        <td style={{paddingBottom: '5px'}}>{totals.sand}</td>
                        <td style={{paddingBottom: '5px'}}>0</td>
                        <td style={{paddingBottom: '5px'}}>{totals.sand1}</td>
                        <td style={{paddingBottom: '5px'}}>{totals.stone10mm}</td>
                        <td style={{paddingBottom: '5px'}}>{(totals.cem1 || 0) + (totals.cem2 || 0)}</td>
                        <td style={{paddingBottom: '5px'}}>{(totals.flyAsh || 0) + (totals.ggbs || 0)}</td>
                        <td style={{paddingBottom: '5px', whiteSpace: 'nowrap'}}>{totals.water} <span style={{visibility: 'hidden', marginLeft: '8px'}}>+/-</span></td>
                        <td style={{paddingBottom: '5px'}}>{totals.watIce}</td>
                        <td style={{paddingBottom: '5px'}}>{totals.silica}</td>
                        <td style={{paddingBottom: '5px'}}>{Number(totals.adm1).toFixed(2)}</td>
                        <td style={{paddingBottom: '5px'}}>{Number(totals.adm2).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div className="delivery-challan-container">
            <DeliveryChallan report={report} copyType="Original Copy" />
            
            <div className="flex items-center justify-center w-full px-4 mb-2 opacity-50 relative">
                <div className="border-t border-dashed border-gray-500 w-full"></div>
                <div className="absolute text-gray-500 text-[10px] bg-white px-2 font-mono" style={{top: '-8px'}}>✄ CUT HERE</div>
            </div>
            
            <DeliveryChallan report={report} copyType="Customer Copy" />
        </div>

        <div className="invoice-container">
            <Invoice 
              report={report} 
              rate={rate} 
              setRate={setRate} 
              onSave={handleSaveRate} 
              editing={editingRate} 
              setEditing={setEditingRate} 
              saving={savingRate} 
            />
        </div>
      </div>
    </div>
  );
}
