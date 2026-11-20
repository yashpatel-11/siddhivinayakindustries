// frontend/src/components/ChallanPrintModal.jsx
import React, { useState } from 'react';
import { Printer, X, Download, Copy, Layers } from 'lucide-react';

export default function ChallanPrintModal({ challan, type = 'INWARD', workshop = 'siddhivinayak', onClose }) {
  if (!challan) return null;

  const [selectedCopy, setSelectedCopy] = useState('Original For Consignee'); // or 'Duplicate for Transporter' or 'Triplicate for Consignor' or 'All'

  const ws = challan.workshop || workshop || 'siddhivinayak';
  const isGayatri = ws === 'gayatri';
  const workshopSupplierName = isGayatri ? "GAYATRI INDUSTRIES" : "SIDDHIVINAYAK CNC JOBWORK";
  const workshopReceiverName = isGayatri ? "GAYATRI INDUSTRIES" : "SIDDHIVINAYAK CNC WORKSHOP";
  const signatoryLabel = isGayatri ? "(Gayatri Industries)" : "(Siddhivinayak CNC Workshop)";

  const isOutward = type === 'OUTWARD';
  const supplierName = isOutward ? workshopSupplierName : (challan.party_name || "AJK FORGE PRIVATE LIMITED");
  const supplierAddress = isOutward 
    ? "PLOT NO. 10, MAHADEV INDUSTRIES-1, SURVEY NO. 335, 336, AT-PADAVLA, VERAVAL (SHAPAR), RAJKOT - 360024"
    : (challan.party_address || "VERAVAL (SHAPAR), RAJKOT");
  const supplierGSTIN = isOutward ? "24AATFN2990F1ZX" : (challan.party_gstin || "24AAGCA0436P1ZN");
  const supplierContact = isOutward ? "9825000000 / 9979000000" : (challan.party_phone || "9427867368 / 9313546921");

  const receiverName = isOutward ? (challan.party_name || "CUSTOMER") : workshopReceiverName;
  const receiverAddress = isOutward 
    ? (challan.party_address || "GIDC AREA, RAJKOT")
    : "MAHADEV INDUSTRIES-1, SURVEY NO. 335, 336, PLOT NO. 10, AT - PADAVLA, VERAVAL (SHAPAR), RAJKOT - 360024";
  const receiverGSTIN = isOutward ? (challan.party_gstin || "24AAGCA0436P1ZN") : "24AATFN2990F1ZX";
  const stateCode = challan.party_state_code || "24-Gujarat";

  const items = challan.items || [];
  const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
  const totalMachineRej = items.reduce((sum, it) => sum + Number(it.machine_rejection || 0), 0);
  const totalForgingRej = items.reduce((sum, it) => sum + Number(it.forging_rejection || 0), 0);
  const totalWaste = items.reduce((sum, it) => sum + Number(it.waste_quantity || (Number(it.machine_rejection || 0) + Number(it.forging_rejection || 0))), 0);
  const totalAmt = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);

  const copies = [
    'Original For Consignee',
    'Duplicate For Transporter',
    'Triplicate For Consignor'
  ];

  const handlePrint = () => {
    window.print();
  };

  const renderChallanDocument = (copyLabel, index) => (
    <div key={index} className={`border border-black mb-8 ${index > 0 ? 'page-break-before' : ''}`}>
      
      {/* Header */}
      <div className="text-center py-2 border-b border-black bg-slate-50">
        <h1 className="text-xl font-bold tracking-wide uppercase">DELIVERY CHALLAN (JOBWORK)</h1>
        <p className="text-xs text-slate-700 font-serif">
          ( See Rule 55 under Tax invoice, Credit and Debit Note Rules of CGST Rules, 2017 )
        </p>
      </div>

      {/* Material Supplier Header */}
      <div className="p-3 border-b border-black text-center bg-white">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Details of Material Supplier</div>
        <h2 className="text-lg font-extrabold uppercase tracking-wide mt-0.5 text-black">{supplierName}</h2>
        <p className="text-xs mt-0.5 text-slate-800">{supplierAddress}</p>
        <p className="text-xs mt-0.5 font-medium">(Contact No: {supplierContact})</p>
        <p className="text-xs font-bold mt-1">GST No.: {supplierGSTIN}</p>
      </div>

      {/* Sub-header banner with copy type */}
      <div className="border-b border-black px-3 py-1 flex justify-between items-center text-xs font-bold bg-slate-100">
        <span className="uppercase">{isOutward ? "Jobwork Dispatch Issue" : "Jobwork Inward Issue"}</span>
        <span className="uppercase bg-white px-2 py-0.5 border border-black rounded text-[11px]">
          {copyLabel}
        </span>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-2 divide-x divide-black border-b border-black text-xs">
        
        {/* Left Column: Jobwork Service Provider */}
        <div className="p-2.5 space-y-1">
          <div className="font-bold underline uppercase mb-1">
            {isOutward ? "Details of Consignee / Manufacturer" : "Details of Jobwork Service Provider"}
          </div>
          <div><span className="font-semibold">Name :</span> {receiverName}</div>
          <div className="text-[11px] leading-tight text-slate-800">{receiverAddress}</div>
          <div className="pt-1"><span className="font-semibold">State & Code:</span> {stateCode}</div>
          <div><span className="font-semibold">GSTIN :</span> {receiverGSTIN}</div>
        </div>

        {/* Right Column: Challan Details */}
        <div className="p-2.5 divide-y divide-black/30">
          <div className="grid grid-cols-2 pb-1">
            <div><span className="font-semibold">Challan No.:</span> {challan.challan_no}</div>
            <div><span className="font-semibold">Dated:</span> {challan.challan_date}</div>
          </div>
          <div className="grid grid-cols-2 py-1">
            <div><span className="font-semibold">Eway Bill No.:</span> {challan.eway_bill_no || 'N/A'}</div>
            <div><span className="font-semibold">Vehicle No.:</span> {challan.vehicle_no || 'N/A'}</div>
          </div>
          <div className="pt-1">
            <span className="font-semibold">Nature of Processing:</span>{' '}
            <span className="font-bold uppercase">
              {(challan.process_required === 'BROACHING / CNC TURNING' || challan.process_carried_out === 'BROACHING / CNC TURNING COMPLETED' || challan.process_carried_out === 'BROACHING / CNC TURNING')
                ? 'CNC TURNING'
                : (challan.process_carried_out || challan.process_required || 'CNC TURNING')}
            </span>
          </div>
          {challan.remarks && (
            <div className="pt-1 text-[11px] text-slate-700 italic">
              <span className="font-semibold not-italic">Remarks:</span> {challan.remarks}
            </div>
          )}
        </div>

      </div>

      {/* Goods Table */}
      <div className="border-b border-black">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-black bg-slate-100 font-bold divide-x divide-black text-center">
              <th className="p-1.5 w-10">Sr.</th>
              <th className="p-1.5 text-left">Description of Goods</th>
              <th className="p-1.5 w-24">Grade</th>
              <th className="p-1.5 w-24">HSN Code</th>
              <th className="p-1.5 w-24 text-right">Quantity</th>
              <th className="p-1.5 w-20 text-right">Rate (₹)</th>
              <th className="p-1.5 w-28 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {items.map((it, idx) => (
              <tr key={idx} className="divide-x divide-black align-top">
                <td className="p-2 text-center">{idx + 1}</td>
                <td className="p-2">
                  <div className="font-bold text-sm">{it.part_no}</div>
                  <div className="text-slate-700">{it.part_description}</div>
                  {it.inward_challan_no && (
                    <div className="text-[11px] text-indigo-900 font-semibold font-mono mt-0.5">
                      Against Inward Ch. #{it.inward_challan_no}
                    </div>
                  )}
                  {it.heat_no && (
                    <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                      Heat No.: {it.heat_no}
                    </div>
                  )}
                  {Number(it.machine_rejection || 0) > 0 && (
                    <div className="text-[11px] text-rose-700 font-semibold mt-0.5">
                      Machine Rejection: {Number(it.machine_rejection).toFixed(3)} {it.unit || 'NOS'}
                    </div>
                  )}
                  {Number(it.forging_rejection || 0) > 0 && (
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      Forging Rejection: {Number(it.forging_rejection).toFixed(3)} {it.unit || 'NOS'}
                    </div>
                  )}
                  {Number(it.waste_quantity || 0) > 0 && !(Number(it.machine_rejection || 0) > 0 || Number(it.forging_rejection || 0) > 0) && (
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      Waste / Scrap Qty: {Number(it.waste_quantity).toFixed(3)} {it.unit || 'NOS'}
                    </div>
                  )}
                </td>
                <td className="p-2 text-center font-mono">{it.grade || it.default_grade || '-'}</td>
                <td className="p-2 text-center font-mono">{it.hsn_code || it.default_hsn || '73261910'}</td>
                <td className="p-2 text-right font-mono font-semibold">
                  {Number(it.quantity).toFixed(3)}
                  <span className="text-[10px] text-slate-600 ml-1">{it.unit || 'NOS'}</span>
                </td>
                <td className="p-2 text-right font-mono">{Number(it.rate || 0).toFixed(2)}</td>
                <td className="p-2 text-right font-mono font-semibold">{Number(it.amount || 0).toFixed(2)}</td>
              </tr>
            ))}

            {items.length === 1 && (
              <tr className="divide-x divide-black h-12">
                <td className="p-2 text-center"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
              </tr>
            )}

            {/* Totals Row */}
            <tr className="border-t-2 border-black font-bold divide-x divide-black bg-slate-50">
              <td colSpan="4" className="p-2 text-right uppercase">Total:</td>
              <td className="p-2 text-right font-mono text-sm">{totalQty.toFixed(3)}</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-sm">₹ {totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures & Place */}
      <div className="p-3 grid grid-cols-2 border-b border-black text-xs">
        <div>
          <p><span className="font-semibold">Place :</span> Rajkot</p>
          <p className="mt-1"><span className="font-semibold">Date :</span> {challan.challan_date}</p>
          <p className="mt-2 text-[11px] text-slate-600">Note: Jobwork material to be returned after machining.</p>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-20">
          <div className="font-semibold">For, {supplierName}</div>
          <div className="border-t border-dotted border-black pt-1 w-48 text-center text-[11px] font-semibold">
            Authorised Signatory
          </div>
        </div>
      </div>

      {/* PART - II: Job Worker Section */}
      <div className="bg-slate-50 p-3 text-xs">
        <div className="text-center font-bold uppercase underline mb-1">
          PART - II
        </div>
        <p className="text-[10px] text-center text-slate-600 mb-2">
          (To be completed by processor / job worker at the time of dispatches, back to the manufacturer, original copy to be retained by job worker, Duplicate copy to Dispatched along with goods)
        </p>

        <div className="border border-black text-[11px] divide-y divide-black">
          <div className="p-1.5 grid grid-cols-3">
            <div className="col-span-2">
              1. Date & Time of Despatch of Finished Goods to Parent Factory / Another Manufacturer and Entry No. and Date of receipt in the Account in Processing Factory
            </div>
            <div className="pl-2 font-mono">{isOutward ? challan.challan_date : '_________________________'}</div>
          </div>
          <div className="p-1.5 grid grid-cols-3">
            <div className="col-span-2">
              2. Quantity Despatched as Entered in Account (Nos/Weight/Litre/Meter) after Processing / Job Working
            </div>
            <div className="pl-2 font-mono font-bold">{isOutward ? `${totalQty.toFixed(3)} NOS` : '_________________________'}</div>
          </div>
          <div className="p-1.5 grid grid-cols-3">
            <div className="col-span-2">
              3. Nature of Processing / Manufacturing Carried out
            </div>
            <div className="pl-2 uppercase font-medium">
              {(challan.process_carried_out === 'BROACHING / CNC TURNING COMPLETED' || challan.process_carried_out === 'BROACHING / CNC TURNING' || challan.process_required === 'BROACHING / CNC TURNING')
                ? 'CNC TURNING'
                : (challan.process_carried_out || challan.process_required || 'CNC TURNING')}
            </div>
          </div>
          <div className="p-1.5 grid grid-cols-3">
            <div className="col-span-2">
              4. Quantity of Waste / Rejection, if any generated and particulars of it's disposal
            </div>
            <div className="pl-2 font-mono">
              {totalWaste > 0 ? (
                <div>
                  <span>{totalWaste.toFixed(3)} NOS Total Scrap</span>
                  {(totalMachineRej > 0 || totalForgingRej > 0) && (
                    <span className="text-[10px] text-slate-600 block">
                      (M/C Rej: {totalMachineRej.toFixed(3)} | Forging Rej: {totalForgingRej.toFixed(3)})
                    </span>
                  )}
                </div>
              ) : (challan.total_waste ? `${Number(challan.total_waste).toFixed(3)} NOS (Scrap Return)` : 'NIL / As per norm')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 mt-3 pt-2 text-[11px]">
          <div>
            <p>Place: Rajkot</p>
            <p>Date: {challan.challan_date}</p>
          </div>
          <div className="text-right">
            <div className="h-8"></div>
            <div className="border-t border-dotted border-black inline-block pt-1 text-center font-semibold">
              Signature of Job Worker / Processor / Authorised Signatory<br />
              <span className="text-[10px] text-slate-600">{signatoryLabel}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Top Control Bar */}
        <div className="no-print bg-slate-800 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-lg">
              {isOutward ? "Outward Delivery Challan" : "Inward Delivery Challan"}
            </span>
            <span className="bg-sky-500/20 text-sky-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-sky-400/30">
              #{challan.challan_no}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-700 text-sky-300 border border-slate-600">
              {isGayatri ? "Gayatri Industries" : "Siddhivinayak Industries"}
            </span>
          </div>

          {/* Copy Selector & Print Actions */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedCopy}
              onChange={(e) => setSelectedCopy(e.target.value)}
              className="bg-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-600 focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="Original For Consignee">Original (For Consignee)</option>
              <option value="Duplicate For Transporter">Duplicate (For Transporter)</option>
              <option value="Triplicate For Consignor">Triplicate (For Consignor)</option>
              <option value="ALL">Print All 3 Copies (Triplicate Set)</option>
            </select>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto print-page font-sans text-black bg-white leading-tight">
          {selectedCopy === 'ALL' ? (
            copies.map((label, idx) => renderChallanDocument(label, idx))
          ) : (
            renderChallanDocument(selectedCopy, 0)
          )}
        </div>

      </div>
    </div>
  );
}
