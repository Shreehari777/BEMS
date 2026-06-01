'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, isValid } from 'date-fns';
import { Loader2, Save, Edit2, X } from 'lucide-react';

function safeFormatDate(dateVal: any, formatStr: string): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isValid(d)) {
      return format(d, formatStr);
    }
  } catch (e) {
    // ignore
  }
  return String(dateVal);
}

// ── Number to words helper ──
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  result += ' Only';
  return result;
}

const Invoice = ({ report, onChange }: { report: any, onChange: (field: string, value: any) => void }) => {
  if (!report) return null;
  const quantity = Number(report.quantity || 0);
  const rate = Number(report.rate || 0);
  const amount = quantity * rate;
  const cgstRate = Number(report.cgstRate ?? 9);
  const sgstRate = Number(report.sgstRate ?? 9);
  const igstRate = Number(report.igstRate ?? 0);
  const cgstAmt = amount * (cgstRate / 100);
  const sgstAmt = amount * (sgstRate / 100);
  const igstAmt = amount * (igstRate / 100);
  const totalGst = cgstAmt + sgstAmt + igstAmt;
  const grandTotal = amount + totalGst;

  const cellStyle = "border border-gray-400 px-2 py-1 text-[11px]";
  const inputStyle = "w-full bg-transparent border-none outline-none text-[11px] font-medium";
  const labelStyle = "font-bold text-[11px] bg-gray-100";

  return (
    <div className="w-full bg-white p-6 print:p-4 print:shadow-none print:border-none print:w-full" style={{ fontFamily: '"Times New Roman", Times, serif', maxWidth: '210mm' }}>

      {/* Company Header */}
      <table className="w-full border-collapse mb-0">
        <tbody>
          <tr>
            <td className="text-center pb-1" style={{ width: '100%' }}>
              <input
                type="text"
                value={report.companyName || ''}
                onChange={(e) => onChange('companyName', e.target.value)}
                className="w-full text-center text-3xl font-black tracking-tight uppercase bg-transparent border-none outline-none"
                placeholder="COMPANY NAME"
              />
              <input
                type="text"
                value={report.companyCertification || ''}
                onChange={(e) => onChange('companyCertification', e.target.value)}
                className="w-full text-center text-[11px] font-bold text-blue-700 underline bg-transparent border-none outline-none cursor-text"
                placeholder="AN:- ISO 9001:2008 & OHSA 18001:2007  CERTIFY COMPANY"
                style={{ minHeight: '18px' }}
              />
              <input
                type="text"
                value={report.companyTagline || ''}
                onChange={(e) => onChange('companyTagline', e.target.value)}
                className="w-full text-center text-[10px] font-bold uppercase bg-transparent border-none outline-none"
                placeholder="Company Description / Tagline"
              />
              <input
                type="text"
                value={report.companyAddress || ''}
                onChange={(e) => onChange('companyAddress', e.target.value)}
                className="w-full text-center text-[10px] font-bold bg-transparent border-none outline-none"
                placeholder="Company Address"
              />
              <div className="flex justify-center gap-12 mt-1">
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="underline font-medium">E-mail:</span>
                  <input
                    type="text"
                    value={report.companyEmail || ''}
                    onChange={(e) => onChange('companyEmail', e.target.value)}
                    className="bg-transparent border-none outline-none text-[10px] underline text-blue-700 w-48"
                    placeholder="email@example.com"
                  />
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="font-medium">Tel:</span>
                  <input
                    type="text"
                    value={report.companyMobile || ''}
                    onChange={(e) => onChange('companyMobile', e.target.value)}
                    className="bg-transparent border-none outline-none text-[10px] w-32"
                    placeholder="Phone Number"
                  />
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* GST Invoice Title & Info */}
      <table className="w-full border-collapse border border-gray-400 mt-1">
        <tbody>
          <tr className="bg-gray-100">
            <td colSpan={2} className={`${cellStyle} font-bold text-center`}>GST INVOICE</td>
            <td colSpan={2} className={`${cellStyle} font-bold text-center`}>ORIGINAL FOR BUYER</td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle} w-24`}>STATE :</td>
            <td className={cellStyle}>
              <input type="text" value={report.companyState || ''} onChange={(e) => onChange('companyState', e.target.value)} className={inputStyle} placeholder="Maharashtra" />
            </td>
            <td className={`${cellStyle} ${labelStyle} w-28`}>INVOICE NO.</td>
            <td className={cellStyle}>
              <span className={`${inputStyle} font-bold inline-block`}>{report.invoiceNumber || ''}</span>
            </td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>GSTIN :</td>
            <td className={cellStyle}>
              <input type="text" value={report.companyGstin || ''} onChange={(e) => onChange('companyGstin', e.target.value)} className={inputStyle} placeholder="Enter Company GSTIN" />
            </td>
            <td className={`${cellStyle} ${labelStyle}`}>DATE :</td>
            <td className={cellStyle}>
              <input type="text" value={report.date ? safeFormatDate(report.date, 'dd-MM-yyyy') : ''} onChange={(e) => onChange('date', e.target.value)} className={`${inputStyle} font-bold`} />
            </td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>STATE CODE :</td>
            <td className={cellStyle}>
              <input type="text" value={report.companyStateCode || ''} onChange={(e) => onChange('companyStateCode', e.target.value)} className={inputStyle} placeholder="27" />
            </td>
            <td className={`${cellStyle} ${labelStyle}`}>VENDORE NO.</td>
            <td className={cellStyle}>
              <input type="text" value={report.vendorNo || ''} onChange={(e) => onChange('vendorNo', e.target.value)} className={inputStyle} />
            </td>
          </tr>
          <tr>
            <td className={cellStyle}></td>
            <td className={cellStyle}></td>
            <td className={`${cellStyle} ${labelStyle}`}>PO.NO :</td>
            <td className={cellStyle}>
              <input type="text" value={report.poNo || ''} onChange={(e) => onChange('poNo', e.target.value)} className={inputStyle} />
            </td>
          </tr>
          <tr>
            <td className={cellStyle}></td>
            <td className={cellStyle}></td>
            <td className={`${cellStyle} ${labelStyle}`}>SITE :</td>
            <td className={cellStyle}>
              <input type="text" value={report.site || ''} onChange={(e) => onChange('site', e.target.value)} className={inputStyle} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Details Of Receiver / Billed To */}
      <table className="w-full border-collapse border border-gray-400 mt-2">
        <tbody>
          <tr className="bg-gray-100">
            <td colSpan={2} className={`${cellStyle} font-bold`}>Details Of Receiver/ Billes to :</td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle} w-36`}>Name</td>
            <td className={cellStyle}>
              <input type="text" value={report.customerName || ''} onChange={(e) => onChange('customerName', e.target.value)} className={`${inputStyle} font-bold`} placeholder="Customer Name" />
            </td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>Address</td>
            <td className={cellStyle}>
              <textarea
                value={report.customerAddress || ''}
                onChange={(e) => onChange('customerAddress', e.target.value)}
                className={`${inputStyle} resize-none`}
                rows={2}
                placeholder="Enter customer address"
              />
            </td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>Name Of State</td>
            <td className={cellStyle}>
              <input type="text" value={report.customerState || ''} onChange={(e) => onChange('customerState', e.target.value)} className={inputStyle} placeholder="MAHARASHTRA" />
            </td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>STATE CODE</td>
            <td className={cellStyle}>
              <input type="text" value={report.customerStateCode || ''} onChange={(e) => onChange('customerStateCode', e.target.value)} className={inputStyle} placeholder="27" />
            </td>
          </tr>
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>GSTIN /Unique ID</td>
            <td className={cellStyle}>
              <input type="text" value={report.gstNumber || ''} onChange={(e) => onChange('gstNumber', e.target.value)} className={inputStyle} placeholder="Enter GST Number" />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table className="w-full border-collapse border border-gray-400 mt-2">
        <thead>
          <tr className="bg-gray-200">
            <th className={`${cellStyle} font-bold text-center w-12`}>SR.NO</th>
            <th className={`${cellStyle} font-bold text-center`}>Description Of Goods</th>
            <th className={`${cellStyle} font-bold text-center w-20`}>HSN /SAC CODE</th>
            <th className={`${cellStyle} font-bold text-center w-14`}>QTY</th>
            <th className={`${cellStyle} font-bold text-center w-16`}>RATE</th>
            <th className={`${cellStyle} font-bold text-center w-24`}>TOTAL VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={`${cellStyle} text-center`}>1]</td>
            <td className={cellStyle}>
              <input type="text" value={report.itemDescription || `Ready Mix Concrete - ${report.grade}`} onChange={(e) => onChange('itemDescription', e.target.value)} className={inputStyle} />
            </td>
            <td className={`${cellStyle} text-center`}>
              <input type="text" value={report.hsnCode || ''} onChange={(e) => onChange('hsnCode', e.target.value)} className={`${inputStyle} text-center`} placeholder="HSN Code" />
            </td>
            <td className={`${cellStyle} text-center`}>
              <input type="number" step="0.01" value={report.quantity || ''} onChange={(e) => onChange('quantity', Number(e.target.value))} className={`${inputStyle} text-center`} />
            </td>
            <td className={`${cellStyle} text-center`}>
              <input type="number" step="0.01" value={report.rate || ''} onChange={(e) => onChange('rate', Number(e.target.value))} className={`${inputStyle} text-center`} />
            </td>
            <td className={`${cellStyle} text-right font-bold`}>
              {amount > 0 ? amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
            </td>
          </tr>
          {[2, 3, 4, 5, 6, 7, 8].map(i => (
            <tr key={i} style={{ height: '20px' }}>
              <td className={cellStyle}></td>
              <td className={cellStyle}></td>
              <td className={cellStyle}></td>
              <td className={cellStyle}></td>
              <td className={cellStyle}></td>
              <td className={cellStyle}></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom Section: Bank Details + Tax Calculations */}
      <table className="w-full border-collapse border border-gray-400 mt-0">
        <tbody>
          {/* Amount Before Tax in Words */}
          <tr>
            <td colSpan={3} className={`${cellStyle} text-[10px]`}>
              <span className="font-bold">Rupees : </span>
              {amount > 0 ? numberToWords(amount) : ''}
            </td>
            <td className={`${cellStyle} ${labelStyle} text-center text-[10px]`}>TotalAmt.Bef<br />ore tax</td>
            <td className={`${cellStyle} font-bold text-right text-[12px]`}>
              {amount > 0 ? amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
            </td>
          </tr>

          {/* Bank Details Header */}
          <tr>
            <td colSpan={2} className={`${cellStyle} ${labelStyle}`}>Bank Details</td>
            <td className={`${cellStyle} ${labelStyle} text-center text-[10px]`}>Type of tax</td>
            <td className={`${cellStyle} ${labelStyle} text-center text-[10px]`}>Rate</td>
            <td className={`${cellStyle} ${labelStyle} text-center text-[10px]`}>Amt.</td>
          </tr>

          {/* Bank Name + CGST */}
          <tr>
            <td className={`${cellStyle} ${labelStyle} w-36`}>Bank Name :</td>
            <td className={cellStyle}>
              <input type="text" value={report.bankName || ''} onChange={(e) => onChange('bankName', e.target.value)} className={inputStyle} placeholder="Bank Name" />
            </td>
            <td className={`${cellStyle} text-center text-[10px]`}>Add :CGST</td>
            <td className={`${cellStyle} text-center`}>
              <input type="number" step="0.01" value={cgstRate} onChange={(e) => onChange('cgstRate', Number(e.target.value))} className={`${inputStyle} text-center`} style={{ width: '30px', display: 'inline' }} /><span>%</span>
            </td>
            <td className={`${cellStyle} text-right font-bold`}>
              {cgstAmt > 0 ? cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '-'}
            </td>
          </tr>

          {/* Bank Account + SGST */}
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>Bank Account Number :</td>
            <td className={cellStyle}>
              <input type="text" value={report.bankAccountNumber || ''} onChange={(e) => onChange('bankAccountNumber', e.target.value)} className={inputStyle} placeholder="Account Number" />
            </td>
            <td className={`${cellStyle} text-center text-[10px]`}>ADD : SGST</td>
            <td className={`${cellStyle} text-center`}>
              <input type="number" step="0.01" value={sgstRate} onChange={(e) => onChange('sgstRate', Number(e.target.value))} className={`${inputStyle} text-center`} style={{ width: '30px', display: 'inline' }} /><span>%</span>
            </td>
            <td className={`${cellStyle} text-right font-bold`}>
              {sgstAmt > 0 ? sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '-'}
            </td>
          </tr>

          {/* IGST */}
          <tr>
            <td className={cellStyle}></td>
            <td className={cellStyle}></td>
            <td className={`${cellStyle} text-center text-[10px]`}>ADD :IGST</td>
            <td className={`${cellStyle} text-center`}>{igstRate > 0 ? `${igstRate}%` : '-'}</td>
            <td className={`${cellStyle} text-right font-bold`}>
              {igstAmt > 0 ? igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '-'}
            </td>
          </tr>

          {/* IFSC Code + Total GST */}
          <tr>
            <td className={`${cellStyle} ${labelStyle}`}>IFSC Code</td>
            <td className={cellStyle}>
              <span className="px-4">:</span>
              <input type="text" value={report.bankIfscCode || ''} onChange={(e) => onChange('bankIfscCode', e.target.value)} className="bg-transparent border-none outline-none text-[11px] font-medium" style={{ width: '70%' }} placeholder="IFSC Code" />
            </td>
            <td className={`${cellStyle} ${labelStyle} text-center text-[10px]`}>Total IGST<br />PAYABLE</td>
            <td className={cellStyle}></td>
            <td className={`${cellStyle} text-right font-bold text-[12px]`}>
              {totalGst > 0 ? totalGst.toLocaleString('en-IN', { minimumFractionDigits: 1 }) : '-'}
            </td>
          </tr>

          {/* Grand Total in Words + Grand Total */}
          <tr>
            <td colSpan={3} className={`${cellStyle} text-[10px]`}>
              <span className="font-bold">Rupees : </span>
              {grandTotal > 0 ? numberToWords(grandTotal) : ''}
            </td>
            <td className={`${cellStyle} ${labelStyle} text-center text-[10px]`}>Total<br />Amt.After<br />Tax</td>
            <td className={`${cellStyle} text-right font-black text-[14px]`}>
              {grandTotal > 0 ? grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 }) : ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signature Section */}
      <div className="border border-gray-400 border-t-0 p-4 min-h-[80px] flex flex-col justify-end items-end">
        <p className="text-[11px] font-bold text-right">For {report.companyName || 'Company Name'}</p>
        <div className="mt-10"></div>
        <p className="text-[11px] font-bold text-right border-t border-gray-400 pt-1 px-4">Authorised Signatory</p>
      </div>
    </div>
  );
};

const DeliveryChallan = ({ report, copyType, onChange }: { report: any, copyType: string, onChange: (field: string, value: any) => void }) => {
  if (!report) return null;

  return (
    <div className="w-full flex-1 flex flex-col bg-white p-3.5 print:pb-4" style={{ height: '135mm', maxHeight: '135mm', boxSizing: 'border-box', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="border-[2px] border-[#990000] flex-1 flex flex-col p-3 bg-white relative">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b border-[#990000] pb-2 mb-2">
          <div className="flex-1 pr-6">
            <input
              type="text"
              value={report.companyName || 'MATRIX INFRA RMC'}
              onChange={(e) => onChange('companyName', e.target.value)}
              className="dc-input text-left text-[#990000] font-[950] text-2xl tracking-wide uppercase outline-none mb-0.5 bg-transparent border-none w-full"
              style={{ textShadow: "0.5px 0px 0px #990000" }}
              placeholder="COMPANY NAME"
            />
            <input
              type="text"
              value={report.companyTagline || 'Suppliers : All Types of Ready Mix Concrete'}
              onChange={(e) => onChange('companyTagline', e.target.value)}
              className="dc-input text-left text-[#990000] text-[10px] font-bold tracking-tight outline-none block mb-0.5 bg-transparent border-none w-full"
              placeholder="Company Tagline"
            />
            <input
              type="text"
              value={report.companyAddress || 'Office : A/p, Kharpudi (B), Khed City Road, Mandawala, Tal. Khed, Dist. Pune - 410505.'}
              onChange={(e) => onChange('companyAddress', e.target.value)}
              className="dc-input text-left text-[#990000] text-[8.5px] font-semibold font-sans outline-none block bg-transparent border-none w-full"
              placeholder="Company Address"
            />
          </div>

          {/* Right Column: Copy Badge + Mobile Details (Stacked to Prevent Overlaps) */}
          <div className="text-right w-44 flex flex-col items-end gap-1.5 select-none">
            {/* Copy Type Tag */}
            <div className="text-[8.5px] font-extrabold text-[#990000] border border-[#990000] px-2 py-0.5 bg-white uppercase tracking-wider rounded-sm">
              {copyType}
            </div>

            {/* Mobile Numbers */}
            <textarea
              value={report.companyMobile || 'Mob.: 9325714072\n9405818311'}
              onChange={(e) => onChange('companyMobile', e.target.value)}
              className="dc-input text-right text-[#990000] text-[9.5px] font-bold w-full border-none outline-none resize-none bg-transparent font-sans"
              rows={2}
              placeholder="Mobile Number"
            />
          </div>
        </div>

        {/* Title */}
        <div className="flex justify-center mb-2">
          <span className="bg-[#990000] text-white font-black text-[10.5px] px-6 py-0.5 tracking-widest uppercase border border-[#990000]">
            DELIVERY CHALLAN
          </span>
        </div>

        {/* Customer & Challan Metadata Block */}
        <table className="w-full border-collapse border border-[#990000] text-[#990000] text-xs mb-2">
          <tbody>
            <tr>
              <td className="border border-[#990000] p-2 w-[60%] align-top">
                <div className="flex items-center mb-1.5">
                  <span className="text-[9px] uppercase font-extrabold w-12 text-[#990000]">M/s:</span>
                  <input
                    type="text"
                    value={report.customerName || ''}
                    onChange={(e) => onChange('customerName', e.target.value)}
                    className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs flex-1"
                    placeholder="Customer Name"
                  />
                </div>
                <div className="flex items-start">
                  <span className="text-[9px] uppercase font-extrabold w-12 text-[#990000] pt-0.5">Site:</span>
                  <textarea
                    value={report.site || ''}
                    onChange={(e) => onChange('site', e.target.value)}
                    className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs flex-1 resize-none h-[28px] leading-tight"
                    placeholder="Delivery Site Address"
                    rows={2}
                  />
                </div>
              </td>
              <td className="border border-[#990000] p-2 w-[40%] align-top">
                <div className="flex items-center mb-1.5">
                  <span className="text-[9px] uppercase font-extrabold w-20 text-[#990000]">Challan No:</span>
                  <input
                    type="number"
                    value={report.docketNumber || ''}
                    onChange={(e) => onChange('docketNumber', Number(e.target.value))}
                    className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs flex-1"
                    placeholder="Docket No."
                  />
                </div>
                <div className="flex items-center">
                  <span className="text-[9px] uppercase font-extrabold w-20 text-[#990000]">Date:</span>
                  <input
                    type="text"
                    value={report.date ? safeFormatDate(report.date, 'dd-MMM-yyyy') : ''}
                    onChange={(e) => onChange('date', e.target.value)}
                    className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs flex-1"
                    placeholder="Date"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Main Dispatch Grid Table */}
        <table className="w-full border-collapse border border-[#990000] text-[#990000] text-xs mb-2">
          <thead>
            <tr className="bg-[#990000]/5 uppercase tracking-wider font-extrabold text-[9px]">
              <th className="border border-[#990000] px-2 py-1 text-center w-[8%]">Sr. No.</th>
              <th className="border border-[#990000] px-3 py-1 text-left w-[52%]">Description of Material & Grade</th>
              <th className="border border-[#990000] px-3 py-1 text-center w-[20%]">TM Vehicle No.</th>
              <th className="border border-[#990000] px-3 py-1 text-center w-[20%]">Quantity (M³)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-black font-semibold">
              <td className="border border-[#990000] px-2 py-1.5 text-center text-gray-500">1</td>
              <td className="border border-[#990000] px-3 py-1.5 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-[10px] font-normal">Ready Mix Concrete - </span>
                  <input
                    type="text"
                    value={report.grade || ''}
                    onChange={(e) => onChange('grade', e.target.value)}
                    className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs w-28"
                    placeholder="Grade"
                  />
                </div>
              </td>
              <td className="border border-[#990000] px-3 py-1.5 text-center">
                <input
                  type="text"
                  value={report.vehicleNumber || ''}
                  onChange={(e) => onChange('vehicleNumber', e.target.value)}
                  className="dc-input bg-transparent border-none outline-none text-black font-bold text-center text-xs w-full"
                  placeholder="TM No."
                />
              </td>
              <td className="border border-[#990000] px-3 py-1.5 text-center">
                <input
                  type="number"
                  step="0.01"
                  value={report.quantity || ''}
                  onChange={(e) => onChange('quantity', Number(e.target.value))}
                  className="dc-input bg-transparent border-none outline-none text-black font-bold text-center text-xs w-full"
                  placeholder="Qty"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Logistics, Pouring Method & Time Log */}
        <table className="w-full border-collapse border border-[#990000] text-[#990000] text-xs mb-2">
          <tbody>
            <tr>
              {/* Placement / Pouring Method Checkboxes */}
              <td className="border border-[#990000] p-2 w-[40%] align-top">
                <span className="text-[8px] uppercase font-extrabold text-[#990000] block mb-1 tracking-wider">Placement Method</span>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer no-print-checkbox-container text-[#990000] font-bold text-[10px]">
                      <input
                        type="checkbox"
                        checked={report.dcPump || false}
                        onChange={(e) => onChange('dcPump', e.target.checked)}
                        className="w-3 h-3 accent-[#990000] cursor-pointer"
                      />
                      <span className="uppercase tracking-wider">Pump Pouring</span>
                    </label>
                    <div className="hidden print:flex items-center gap-1.5 text-[#990000] font-bold text-[10px]">
                      <div className="w-3 h-3 border border-[#990000] flex items-center justify-center font-sans text-[8px] font-black">
                        {report.dcPump ? '✓' : ''}
                      </div>
                      <span className="uppercase tracking-wider">Pump Pouring</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer no-print-checkbox-container text-[#990000] font-bold text-[10px]">
                      <input
                        type="checkbox"
                        checked={report.dcManual || false}
                        onChange={(e) => onChange('dcManual', e.target.checked)}
                        className="w-3 h-3 accent-[#990000] cursor-pointer"
                      />
                      <span className="uppercase tracking-wider">Manual Pouring</span>
                    </label>
                    <div className="hidden print:flex items-center gap-1.5 text-[#990000] font-bold text-[10px]">
                      <div className="w-3 h-3 border border-[#990000] flex items-center justify-center font-sans text-[8px] font-black">
                        {report.dcManual ? '✓' : ''}
                      </div>
                      <span className="uppercase tracking-wider">Manual Pouring</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-1.5 cursor-pointer no-print-checkbox-container text-[#990000] font-bold text-[10px]">
                      <input
                        type="checkbox"
                        checked={report.dcBatchSheet || false}
                        onChange={(e) => onChange('dcBatchSheet', e.target.checked)}
                        className="w-3 h-3 accent-[#990000] cursor-pointer"
                      />
                      <span className="uppercase tracking-wider whitespace-nowrap">Batch Sheet Attached</span>
                    </label>
                    <div className="hidden print:flex items-center gap-1.5 text-[#990000] font-bold text-[10px]">
                      <div className="w-3 h-3 border border-[#990000] flex items-center justify-center font-sans text-[8px] font-black">
                        {report.dcBatchSheet ? '✓' : ''}
                      </div>
                      <span className="uppercase tracking-wider whitespace-nowrap">Batch Sheet Attached</span>
                    </div>
                  </div>
                </div>
              </td>

              {/* Batching times */}
              <td className="border border-[#990000] p-2 w-[35%] align-top">
                <span className="text-[8px] uppercase font-extrabold text-[#990000] block mb-1.5 tracking-wider">Time Log</span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center">
                    <span className="text-[9px] uppercase font-bold w-16 text-[#990000]">Start Time:</span>
                    <input
                      type="text"
                      value={report.startTime || ''}
                      onChange={(e) => onChange('startTime', e.target.value)}
                      className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs flex-1"
                      placeholder="--:--"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-[9px] uppercase font-bold w-16 text-[#990000]">End Time:</span>
                    <input
                      type="text"
                      value={report.stopTime || ''}
                      onChange={(e) => onChange('stopTime', e.target.value)}
                      className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs flex-1"
                      placeholder="--:--"
                    />
                  </div>
                </div>
              </td>

              {/* Driver Details */}
              <td className="border border-[#990000] p-2 w-[25%] align-top">
                <span className="text-[8px] uppercase font-extrabold text-[#990000] block mb-1 tracking-wider">Logistics</span>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-[9px] uppercase font-bold text-[#990000]">Driver Name:</span>
                  <input
                    type="text"
                    value={report.driverName || ''}
                    onChange={(e) => onChange('driverName', e.target.value)}
                    className="dc-input bg-transparent border-none outline-none text-black font-bold text-xs w-full mt-0.5"
                    placeholder="Driver Name"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signatures */}
        <div className="flex justify-between w-full mt-auto pt-2 pb-0.5 px-1">
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#990000] flex flex-col items-center justify-end h-12 w-40 text-center">
            <div className="border-b border-dashed border-[#990000] w-full mb-1"></div>
            <span>Receiver's Sign & Seal</span>
          </div>

          <div className="text-[9px] font-bold uppercase tracking-wider text-[#990000] flex flex-col items-center justify-end h-12 w-32 text-center">
            <div className="border-b border-dashed border-[#990000] w-full mb-1"></div>
            <span>Driver's Signature</span>
          </div>

          <div className="text-[9px] font-bold uppercase tracking-wider text-[#990000] text-center flex flex-col items-center justify-end h-12 w-48">
            <span className="mb-6 font-extrabold text-[8px] tracking-tight">For {report.companyName || 'MATRIX INFRA RMC'}</span>
            <div className="border-b border-dashed border-[#990000] w-full mb-1"></div>
            <span>Authorised Signatory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PrintReportPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const reportRef = useRef<any>(null);
  const headingSaveTimer = useRef<any>(null);
  const autoSaveTimer = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState(0);

  // Keep ref in sync so async callbacks always read latest state
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  // Auto-save heading to settings (debounced)
  const saveHeadingToSettings = (headingValue: string) => {
    if (headingSaveTimer.current) clearTimeout(headingSaveTimer.current);
    headingSaveTimer.current = setTimeout(async () => {
      try {
        // Fetch current settings first to preserve other fields
        const res = await fetch('/api/settings');
        const settings = await res.json();
        const existing = settings.challanInvoiceTemplate || {};
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'challanInvoiceTemplate',
            value: { ...existing, reportHeading: headingValue },
          }),
        });
      } catch (err) {
        console.error('Failed to save heading:', err);
      }
    }, 500);
  };

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const [reportRes, settingsRes] = await Promise.all([
          fetch(`/api/reports/${id}`),
          fetch('/api/settings'),
        ]);

        if (!reportRes.ok) {
          console.error('Report not found');
          setLoading(false);
          return;
        }

        const foundReport = await reportRes.json();
        const settings = await settingsRes.json();
        const template = settings.challanInvoiceTemplate || {};

        // Apply saved template defaults for template fields that still have the hardcoded default or are empty
        const TEMPLATE_FIELDS = [
          'companyName', 'companyTagline', 'companyAddress', 'companyMobile',
          'companyEmail', 'companyGstin', 'companyState', 'companyStateCode', 'companyCertification',
          'bankName', 'bankAccountNumber', 'bankIfscCode',
          'cgstRate', 'sgstRate', 'hsnCode', 'reportHeading',
        ];
        const SCHEMA_DEFAULTS: Record<string, any> = {
          companyName: 'MATRIX INFRA RMC',
          companyTagline: 'Suppliers : All Types of Ready Mix Concrete',
          companyAddress: 'Office : A/p, Kharpudi (B), Khed City Road, Mandawala, Tal. Khed, Dist. Pune - 410505.',
          companyMobile: 'Mob.: 9325714072 | 9405818311',
          companyState: 'Maharashtra',
          companyStateCode: '27',
          reportHeading: 'MATRIX INFRA',
        };
        TEMPLATE_FIELDS.forEach(field => {
          if (template[field] !== undefined && template[field] !== '' && (!foundReport[field] || foundReport[field] === SCHEMA_DEFAULTS[field] || foundReport[field] === '')) {
            foundReport[field] = template[field];
          }
        });
        setReport(foundReport);
        setRate(foundReport.rate || 0);
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

  // Save template fields to Settings (global defaults for all future reports)
  const saveTemplateToSettings = async () => {
    const current = reportRef.current;
    if (!current) return;
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'challanInvoiceTemplate',
          value: {
            companyName: current.companyName,
            companyTagline: current.companyTagline,
            companyAddress: current.companyAddress,
            companyMobile: current.companyMobile,
            companyEmail: current.companyEmail,
            companyGstin: current.companyGstin,
            companyState: current.companyState,
            companyStateCode: current.companyStateCode,
            companyCertification: current.companyCertification,
            bankName: current.bankName,
            bankAccountNumber: current.bankAccountNumber,
            bankIfscCode: current.bankIfscCode,
            cgstRate: current.cgstRate,
            sgstRate: current.sgstRate,
            hsnCode: current.hsnCode,
            reportHeading: current.reportHeading,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to save template defaults:', err);
    }
  };

  // Debounced auto-save report + template
  const debouncedAutoSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');
    autoSaveTimer.current = setTimeout(async () => {
      const latest = reportRef.current;
      if (!latest) return;
      try {
        const res = await fetch(`/api/reports/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(latest),
        });
        if (res.ok) {
          // Also save template defaults
          const settingsRes = await fetch('/api/settings');
          const settings = await settingsRes.json();
          const existing = settings.challanInvoiceTemplate || {};
          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: 'challanInvoiceTemplate',
              value: {
                ...existing,
                companyName: latest.companyName,
                companyTagline: latest.companyTagline,
                companyAddress: latest.companyAddress,
                companyMobile: latest.companyMobile,
                companyEmail: latest.companyEmail,
                companyGstin: latest.companyGstin,
                companyState: latest.companyState,
                companyStateCode: latest.companyStateCode,
                companyCertification: latest.companyCertification,
                bankName: latest.bankName,
                bankAccountNumber: latest.bankAccountNumber,
                bankIfscCode: latest.bankIfscCode,
                cgstRate: latest.cgstRate,
                sgstRate: latest.sgstRate,
                hsnCode: latest.hsnCode,
                reportHeading: latest.reportHeading,
              },
            }),
          });
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
          window.dispatchEvent(new Event('bemsDataUpdated'));
        } else {
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus('idle'), 3000);
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    }, 1000);
  };

  const handleFieldChange = (field: string, value: any) => {
    setReport((prev: any) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (field === 'rate') {
        setRate(Number(value) || 0);
      }
      reportRef.current = updated;
      return updated;
    });
    // Trigger debounced auto-save (reads latest from ref)
    debouncedAutoSave();
    // Also save heading to settings immediately (faster debounce)
    if (field === 'reportHeading') {
      saveHeadingToSettings(value);
    }
  };

  // Generate Invoice — fetch next number, save immediately
  const handleGenerateInvoice = async () => {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    const current = reportRef.current || report;
    if (!current) return;

    let nextNum = 1;
    try {
      const res = await fetch(
        `/api/next-invoice?customerName=${encodeURIComponent(current.customerName)}&createdBy=${encodeURIComponent(current.createdBy || '')}`
      );
      const data = await res.json();
      nextNum = data.nextInvoiceNumber || 1;
    } catch (err) {
      console.error('Failed to fetch next invoice number:', err);
    }

    const updated = { ...current, invoiceEnabled: true, invoiceNumber: nextNum };
    setReport(updated);
    reportRef.current = updated;

    try {
      await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      window.dispatchEvent(new Event('bemsDataUpdated'));
    } catch (err) {
      console.error('Failed to save invoice:', err);
    }
  };

  // Remove Invoice
  const handleRemoveInvoice = async () => {
    if (autoSaveTimer.current) { clearTimeout(autoSaveTimer.current); autoSaveTimer.current = null; }
    const current = reportRef.current || report;
    if (!current) return;

    const updated = { ...current, invoiceEnabled: false, invoiceNumber: 0 };
    setReport(updated);
    reportRef.current = updated;

    try {
      await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      window.dispatchEvent(new Event('bemsDataUpdated'));
    } catch (err) {
      console.error('Failed to remove invoice:', err);
    }
  };

  const handlePrintReport = () => {
    document.body.classList.add('print-report');
    window.print();
    document.body.classList.remove('print-report');
  };

  const handlePrintDC = () => {
    document.body.classList.add('print-dc');
    window.print();
    document.body.classList.remove('print-dc');
  };

  const handlePrintInvoice = () => {
    document.body.classList.add('print-invoice');
    window.print();
    document.body.classList.remove('print-invoice');
  };

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    // Print Report first
    document.body.classList.add('print-report');
    window.print();
    document.body.classList.remove('print-report');

    // Print Challan after a short delay
    setTimeout(() => {
      document.body.classList.add('print-dc');
      window.print();
      document.body.classList.remove('print-dc');
      setIsPrintingAll(false);
    }, 500);
  };

  if (loading) return <div className="p-8 text-center font-sans">Loading Report...</div>;
  if (!report) return <div className="p-8 text-center text-red-500 font-bold font-sans">Report not found</div>;

  const batches = report.batches || [];
  const targets = report.targets || {};

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

  const sw = report.setWeights || {};
  const totalTargets = Object.keys(targets).reduce((acc: any, key) => {
    acc[key] = sw[key] !== undefined ? Number(sw[key]) : (Number(targets[key]) || 0) * batches.length;
    return acc;
  }, {});

  const aa = report.adjustedActuals || {};
  const totals: any = Object.keys(rawTotals).reduce((acc: any, key) => {
    acc[key] = aa[key] !== undefined ? Number(aa[key]) : rawTotals[key];
    return acc;
  }, {});

  return (
    <div className="print-wrapper min-h-screen bg-slate-100 flex flex-col items-center pb-20 relative">
      <button
        onClick={() => router.back()}
        className="no-print fixed top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-700 font-sans cursor-pointer transition-colors"
      >
        &larr; Back
      </button>
      <button
        onClick={handlePrintAll}
        disabled={isPrintingAll}
        className="no-print fixed top-4 left-28 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-sans cursor-pointer transition-colors font-semibold text-sm disabled:opacity-50"
      >
        {isPrintingAll ? 'Printing...' : 'Print All'}
      </button>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
            --table-cell-padding: 1px;
            --table-margin-top: 0px;
            --line-height-tight: 1;
            --vertical-align: bottom;
            --info-margin-bottom: 0px;
        }

        .print-page-body {
            font-family: "Times New Roman", Times, serif;
            font-size: 14px;
            color: #333;
            margin: 0;
            padding: 20px;
            line-height: 1.2;
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

        .system-info {
            font-weight: bold;
            font-size: 16px;
        }

        .doc-title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
        }

        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: var(--info-margin-bottom);
            font-size: 13.3px;
        }

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

        /* Input styling */
        .invoice-input {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px dashed rgba(0, 0, 0, 0.15) !important;
            color: black !important;
            font-family: inherit !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        .invoice-input:hover, .invoice-input:focus {
            border-bottom-color: #990000 !important;
            background: rgba(153, 0, 0, 0.05) !important;
            outline: none !important;
        }
        .dc-input {
            background: transparent !important;
            border: none !important;
            border-bottom: 1px dashed rgba(153, 0, 0, 0.2) !important;
            font-family: inherit !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
        }
        .dc-input:hover, .dc-input:focus {
            border-bottom-color: #990000 !important;
            background: rgba(153, 0, 0, 0.05) !important;
            outline: none !important;
        }

        /* Suppress scrollbars globally on inputs and textareas */
        input::-webkit-scrollbar, textarea::-webkit-scrollbar {
            display: none !important;
        }
        input, textarea {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            overflow: hidden !important;
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
            
            /* Selective body class prints */
            body.print-report .delivery-challan-container,
            body.print-report .invoice-container {
                display: none !important;
            }
            body.print-dc .report-container,
            body.print-dc .invoice-container {
                display: none !important;
            }
            body.print-invoice .report-container,
            body.print-invoice .delivery-challan-container {
                display: none !important;
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
            
            .invoice-input, .dc-input {
                border-bottom: none !important;
                background: transparent !important;
                outline: none !important;
                padding: 0 !important;
            }
            .no-print-checkbox-container {
                display: none !important;
            }
        }
      `}} />

      <div className="print-page-body w-full flex flex-col items-center">
        {/* ── Section: Batch Report ── */}
        <div className="w-[850px] flex justify-between items-center mt-6 mb-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg no-print font-sans">
          <span className="text-sm font-bold text-slate-700">Batch Report (Read-only)</span>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Print Report
          </button>
        </div>

        <div className="report-container">
          <div className="report-header" style={{ marginBottom: '5px' }}>
            <h1 style={{ fontSize: '20px', margin: 0 }}>
              <input
                type="text"
                value={report.reportHeading ?? 'MATRIX INFRA'}
                onChange={(e) => handleFieldChange('reportHeading', e.target.value)}

                className="w-full text-center bg-transparent border-none outline-none uppercase font-bold tracking-[1px]"
                style={{ fontSize: '20px', fontFamily: '"Times New Roman", Times, serif' }}
                placeholder="MATRIX INFRA"
              />
            </h1>
          </div>

          <div className="sub-header" style={{ marginBottom: '5px', marginTop: '0', flexDirection: 'column', alignItems: 'flex-start', paddingLeft: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 100 100" style={{ width: '45px', height: '45px', marginRight: '15px', marginTop: '4px', overflow: 'hidden' }}>
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <polygon points="5,100 35,100 65,0 35,0" fill="#8dc63f" />
                <polygon points="35,100 65,100 95,0 65,0" fill="#007236" />
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="black" strokeWidth="4" />
              </svg>
              <div className="system-info" style={{ fontSize: '18px', fontWeight: 'bold' }}>MCI 70 N Control System Ver 3.1</div>
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px', textAlign: 'left', lineHeight: '1.2' }}>SCHWING<br />Stetter</div>
          </div>

          <div className="doc-title" style={{ margin: '20px 0' }}>Docket / Batch Report / Autographic Record</div>

          <div className="info-section" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '13px' }}>
            <div style={{ width: '55%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', width: '110px', paddingBottom: '2px', paddingLeft: '3px' }}>Batch Date</td><td style={{ width: '15px', paddingBottom: '2px', textAlign: 'center', fontWeight: 'bold' }}>:</td><td style={{ paddingBottom: '2px' }}>&nbsp; {report.date ? safeFormatDate(report.date, 'dd-MMM-yyyy') : ''}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '2px', paddingLeft: '0px' }}>Batch Start Time</td><td style={{ paddingBottom: '2px', textAlign: 'center', fontWeight: 'bold' }}>:</td><td style={{ paddingBottom: '2px' }}>&nbsp; {report.startTime || ''}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '2px', paddingLeft: '0px' }}>Batch End Time</td><td style={{ paddingBottom: '2px', textAlign: 'center', fontWeight: 'bold' }}>:</td><td style={{ paddingBottom: '2px' }}>&nbsp; {report.stopTime || ''}</td></tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 'bold', width: '180px', paddingBottom: '3px', verticalAlign: 'middle', whiteSpace: 'nowrap', paddingLeft: '3px' }}>Batch Number / Docket Number</td><td style={{ width: '20px', paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.docketNumber}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Customer</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.customerName}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Site</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.site}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Recipe Code</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.grade}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Recipe Name</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.grade}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Truck Number</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.vehicleNumber}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Truck Driver</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.driverName}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Order Number</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.orderNumber || '-'}</td></tr>
                  <tr><td style={{ fontWeight: 'bold', paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '3px' }}>Batcher Name</td><td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>:</td><td style={{ paddingBottom: '3px', verticalAlign: 'middle', paddingLeft: '10px' }}>{report.batcherName || 'Stetter'}</td></tr>
                </tbody>
              </table>
            </div>

            <div style={{ width: '40%', paddingLeft: '60px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '2px', paddingLeft: '2px', width: '155px' }}>Plant Serial Number:</td>
                    <td style={{ paddingBottom: '2px', textAlign: 'left', paddingLeft: '8px' }}>CP30</td>
                  </tr>
                  <tr><td colSpan={4} style={{ paddingBottom: '2px' }}>&nbsp;</td></tr>
                  <tr><td colSpan={4} style={{ paddingBottom: '2px' }}>&nbsp;</td></tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 'bold', width: '135px', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>Ordered Quantity</td>
                    <td style={{ width: '20px', paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center' }}>:</td>
                    <td style={{ paddingBottom: '3px', textAlign: 'left', width: '50px', paddingLeft: '8.9px' }}>{Number(report.orderedQuantity || 0).toFixed(2)}</td>
                    <td style={{ paddingBottom: '3px', paddingLeft: '10px' }}>M&sup3;</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>Production Quantity</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center' }}>:</td>
                    <td style={{ paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px' }}>{Number(report.quantity || 0).toFixed(2)}</td>
                    <td style={{ paddingBottom: '3px', paddingLeft: '10px' }}>M&sup3;</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>Adj/Manual Quantity</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center' }}>:</td>
                    <td style={{ paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px' }}>{Number(report.adjManualQuantity || 0).toFixed(2)}</td>
                    <td style={{ paddingBottom: '3px', paddingLeft: '10px' }}>M&sup3;</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>With This Load</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center' }}>:</td>
                    <td style={{ paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px' }}>{Number(report.withThisLoad || report.quantity || 0).toFixed(2)}</td>
                    <td style={{ paddingBottom: '3px', paddingLeft: '10px' }}>M&sup3;</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>Mixer Capacity</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center' }}>:</td>
                    <td style={{ paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px' }}>{Number(report.mixerCapacity || 0.5).toFixed(2)}</td>
                    <td style={{ paddingBottom: '3px', paddingLeft: '10px' }}>M&sup3;</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 'bold', paddingBottom: '3px', paddingLeft: '2px', whiteSpace: 'nowrap' }}>Batch Size</td>
                    <td style={{ paddingBottom: '3px', fontWeight: 'bold', textAlign: 'center' }}>:</td>
                    <td style={{ paddingBottom: '3px', textAlign: 'left', paddingLeft: '8.9px' }}>{Number(report.batchSize || report.mixerCapacity || 0.5).toFixed(2)}</td>
                    <td style={{ paddingBottom: '3px', paddingLeft: '10px' }}>M&sup3;</td>
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
                <th>CEM1</th><th>FLASH</th>
                <th>WATER</th><th>WAT/I</th>
                <th>Silica</th><th>ADM1</th><th>ADM2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={13} style={{ textAlign: 'left', padding: '1px 5px' }}>Targets based on batchsize in Kg</td>
              </tr>
              <tr>
                <td>{pt(targets.stone20mm)}</td>
                <td>{pt(targets.sand)}</td>
                <td style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', marginRight: '4px', lineHeight: '1' }}>in %</span>{pt(targets.moisture) !== 0 ? pt(targets.moisture) : ''}</td>
                <td>{pt(targets.sand1)}</td>
                <td>{pt(targets.stone10mm)}</td>
                <td>{pt(targets.cem1 || 0) + pt(targets.cem2 || 0)}</td>
                <td>{pt(targets.flyAsh || 0) + pt(targets.ggbs || 0)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{pt(targets.water)} <span style={{ marginLeft: '8px' }}>+/-</span></td>
                <td>{pt(targets.watIce) !== 0 ? pt(targets.watIce) : '0'}</td>
                <td>{pt(targets.silica)}</td>
                <td>{targets.adm1 !== undefined ? Number(targets.adm1).toFixed(2) : "0.00"}</td>
                <td>{targets.adm2 !== undefined ? Number(targets.adm2).toFixed(2) : "0.00"}</td>
              </tr>
              <tr className="border-top">
                <td colSpan={13} style={{ textAlign: 'left', padding: '5px 5px 1px 5px' }}>Actual in Kgs.</td>
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
                  <td>{batch.water || 0} <span style={{ marginLeft: '12px' }}>0</span></td>
                  <td>{batch.watIce || 0}</td>
                  <td>{batch.silica || 0}</td>
                  <td>{batch.adm1 !== undefined ? Number(batch.adm1).toFixed(2) : "0.00"}</td>
                  <td>{batch.adm2 !== undefined ? Number(batch.adm2).toFixed(2) : "0.00"}</td>
                </tr>
              ))}
              <tr className="footer-row border-top">
                <td colSpan={13} style={{ textAlign: 'left', padding: '5px 5px 5px 5px' }}>Total Set Weight in Kgs.</td>
              </tr>
              <tr>
                <td>{totalTargets.stone20mm || 0}</td>
                <td>{totalTargets.sand || 0}</td>
                <td>0</td>
                <td>{totalTargets.sand1 || 0}</td>
                <td>{totalTargets.stone10mm || 0}</td>
                <td>{(totalTargets.cem1 || 0) + (totalTargets.cem2 || 0)}</td>
                <td>{(totalTargets.flyAsh || 0) + (totalTargets.ggbs || 0)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{totalTargets.water || 0} <span style={{ visibility: 'hidden', marginLeft: '8px' }}>+/-</span></td>
                <td>{totalTargets.watIce || 0}</td>
                <td>{totalTargets.silica || 0}</td>
                <td>{totalTargets.adm1 !== undefined ? Number(totalTargets.adm1).toFixed(2) : "0.00"}</td>
                <td>{totalTargets.adm2 !== undefined ? Number(totalTargets.adm2).toFixed(2) : "0.00"}</td>
              </tr>
              <tr className="footer-row">
                <td colSpan={13} style={{ textAlign: 'left', padding: '10px 5px 1px 5px' }}>Total Actual in Kgs.</td>
              </tr>
              <tr className="border-bottom">
                <td style={{ paddingBottom: '5px' }}>{totals.stone20mm}</td>
                <td style={{ paddingBottom: '5px' }}>{totals.sand}</td>
                <td style={{ paddingBottom: '5px' }}>0</td>
                <td style={{ paddingBottom: '5px' }}>{totals.sand1}</td>
                <td style={{ paddingBottom: '5px' }}>{totals.stone10mm}</td>
                <td style={{ paddingBottom: '5px' }}>{(totals.cem1 || 0) + (totals.cem2 || 0)}</td>
                <td style={{ paddingBottom: '5px' }}>{(totals.flyAsh || 0) + (totals.ggbs || 0)}</td>
                <td style={{ paddingBottom: '5px', whiteSpace: 'nowrap' }}>{totals.water} <span style={{ visibility: 'hidden', marginLeft: '8px' }}>+/-</span></td>
                <td style={{ paddingBottom: '5px' }}>{totals.watIce}</td>
                <td style={{ paddingBottom: '5px' }}>{totals.silica}</td>
                <td style={{ paddingBottom: '5px' }}>{Number(totals.adm1).toFixed(2)}</td>
                <td style={{ paddingBottom: '5px' }}>{Number(totals.adm2).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Section: Delivery Challan ── */}
        <div className="w-[850px] flex justify-between items-center mt-10 mb-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg no-print font-sans">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700">Delivery Challan</span>
            <span className={`text-xs font-medium transition-opacity ${
              autoSaveStatus === 'idle' ? 'opacity-0' :
              autoSaveStatus === 'saving' ? 'text-amber-600 opacity-100' :
              autoSaveStatus === 'saved' ? 'text-green-600 opacity-100' :
              'text-red-500 opacity-100'
            }`}>
              {autoSaveStatus === 'saving' ? '● Saving...' : autoSaveStatus === 'saved' ? '✓ Saved' : autoSaveStatus === 'error' ? '✗ Error' : ''}
            </span>
          </div>
          <button
            onClick={handlePrintDC}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Print Challan
          </button>
        </div>

        <div className="delivery-challan-container">
          <DeliveryChallan report={report} copyType="Original Copy" onChange={handleFieldChange} />

          <div className="flex items-center justify-center w-full px-4 mb-2 opacity-50 relative no-print">
            <div className="border-t border-dashed border-gray-500 w-full"></div>
            <div className="absolute text-gray-500 text-[10px] bg-white px-2 font-mono" style={{ top: '-8px' }}>✄ CUT HERE</div>
          </div>

          <DeliveryChallan report={report} copyType="Customer Copy" onChange={handleFieldChange} />
        </div>

        {/* ── Section: Invoice ── */}
        <div className="w-[850px] flex justify-between items-center mt-10 mb-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg no-print font-sans">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-700">Tax Invoice</span>
            {report.invoiceEnabled && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                Invoice #{report.invoiceNumber}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!report.invoiceEnabled ? (
              <button
                onClick={handleGenerateInvoice}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Generate Invoice
              </button>
            ) : (
              <>
                <button
                  onClick={handleRemoveInvoice}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Remove Invoice
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Print Invoice
                </button>
              </>
            )}
          </div>
        </div>

        {report.invoiceEnabled && (
          <div className="invoice-container">
            <Invoice
              report={report}
              onChange={handleFieldChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
