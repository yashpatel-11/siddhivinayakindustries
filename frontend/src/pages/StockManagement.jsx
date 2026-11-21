// frontend/src/pages/StockManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Users, 
  Layers, 
  History, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Printer, 
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import { exportPartyWiseToExcel, exportFullInventoryExcel } from '../utils/excelExport';

export default function StockManagement({ onNavigateWithData, currentWorkshop = 'siddhivinayak' }) {
  const [subTab, setSubTab] = useState('part_wise'); // 'part_wise' | 'party_wise' | 'matrix' | 'ledger'
  const [partWiseData, setPartWiseData] = useState([]);
  const [partyWiseData, setPartyWiseData] = useState([]);
  const [matrixData, setMatrixData] = useState([]);
  const [ledgerData, setLedgerData] = useState({ current_balance: 0, data: [] });
  const [loading, setLoading] = useState(true);

  // Expanded lots in Party-wise view
  const [expandedPartLots, setExpandedPartLots] = useState({});
  const [loadingLots, setLoadingLots] = useState({});

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partiesList, setPartiesList] = useState([]);
  const [partsList, setPartsList] = useState([]);

  useEffect(() => {
    loadMasters();
  }, [currentWorkshop]);

  useEffect(() => {
    loadStockData();
  }, [subTab, selectedPartyId, selectedPartId, currentWorkshop]);

  const loadMasters = async () => {
    const [pRes, partsRes] = await Promise.all([
      api.getParties(currentWorkshop),
      api.getParts(currentWorkshop)
    ]);
    setPartiesList(pRes.data || []);
    setPartsList(partsRes.data || []);
  };

  const loadStockData = async () => {
    setLoading(true);
    try {
      if (subTab === 'part_wise') {
        const res = await api.getStock('part_wise', { workshop: currentWorkshop });
        setPartWiseData(res.data || []);
      } else if (subTab === 'party_wise') {
        const res = await api.getStock('party_wise', { workshop: currentWorkshop });
        setPartyWiseData(res.data || []);
      } else if (subTab === 'matrix') {
        const res = await api.getStock('matrix', {
          party_id: selectedPartyId,
          part_id: selectedPartId,
          workshop: currentWorkshop
        });
        setMatrixData(res.data || []);
      } else if (subTab === 'ledger') {
        const res = await api.getStock('ledger', {
          party_id: selectedPartyId,
          part_id: selectedPartId,
          workshop: currentWorkshop
        });
        setLedgerData(res || { current_balance: 0, data: [] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered views
  const filteredPartWise = partWiseData.filter(p => 
    p.part_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.grade && p.grade.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPartyWise = partyWiseData.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.gstin && p.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExportPartyWiseExcel = async (specificPartNo = null) => {
    let pWise = partyWiseData;
    if (!pWise || pWise.length === 0) {
      try {
        const res = await api.getStock('party_wise', { workshop: currentWorkshop });
        pWise = res.data || [];
        setPartyWiseData(pWise);
      } catch (err) {
        console.error("Failed to load party-wise data for export:", err);
      }
    }
    exportPartyWiseToExcel(pWise, matrixData, specificPartNo);
  };

  const handleExportCSV = () => {
    let rows = [];
    let headers = [];

    if (subTab === 'part_wise') {
      headers = ['Part No', 'Description', 'Grade', 'HSN Code', 'Inward Qty', 'Outward Qty', 'Machine Rej', 'Forging Rej', 'Current Stock', 'Unit'];
      rows = filteredPartWise.map(p => [
        `"${p.part_no}"`, `"${p.description}"`, `"${p.grade || ''}"`, `"${p.hsn_code || ''}"`,
        p.total_inward, p.total_outward, p.total_machine_rejection || 0, p.total_forging_rejection || 0, p.current_stock, `"${p.unit || 'NOS'}"`
      ]);
    } else if (subTab === 'party_wise') {
      headers = ['Party Name', 'Part No', 'Description', 'Inward Qty', 'Outward Qty', 'Machine Rej', 'Forging Rej', 'Current Stock'];
      filteredPartyWise.forEach(party => {
        party.parts?.forEach(pt => {
          rows.push([
            `"${party.name}"`, `"${pt.part_no}"`, `"${pt.description}"`,
            pt.inward_qty, pt.outward_qty, pt.machine_rej_qty || 0, pt.forging_rej_qty || 0, pt.current_stock
          ]);
        });
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_report_${currentWorkshop}_${subTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const togglePartLots = async (partyId, partId) => {
    const key = `${partyId}_${partId}`;
    if (expandedPartLots[key]) {
      setExpandedPartLots(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      return;
    }

    setLoadingLots(prev => ({ ...prev, [key]: true }));
    try {
      const res = await api.getInwardLots(partyId, partId, null, currentWorkshop);
      setExpandedPartLots(prev => ({
        ...prev,
        [key]: res.data || []
      }));
    } catch (e) {
      console.error("Failed to load part lots:", e);
    } finally {
      setLoadingLots(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tabs Navigation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'}
              </span>
              <span className="text-xs text-slate-500">Live Inventory • CNC Material Balance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Stock Management
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Maintain inventory part-wise, party-wise, and audit complete inward/outward movement history for {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleExportPartyWiseExcel()}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition"
              title="Download stock report party-wise in Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Party-wise Excel</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-medium transition no-print"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex overflow-x-auto gap-2 pt-4">
          <button
            onClick={() => setSubTab('part_wise')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              subTab === 'part_wise'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Part-wise Stock</span>
          </button>

          <button
            onClick={() => setSubTab('party_wise')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              subTab === 'party_wise'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Party-wise Stock</span>
          </button>

          <button
            onClick={() => setSubTab('matrix')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              subTab === 'matrix'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Cross Matrix</span>
          </button>

          <button
            onClick={() => setSubTab('ledger')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              subTab === 'ledger'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transaction Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              subTab === 'part_wise' ? "Search by part no, description, grade..." :
              subTab === 'party_wise' ? "Search by customer name, GSTIN..." :
              "Search stock..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {(subTab === 'matrix' || subTab === 'ledger') && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="">All Parties</option>
              {partiesList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sky-500 text-slate-700 bg-white"
            >
              <option value="">All Parts</option>
              {partsList.map(p => (
                <option key={p.id} value={p.id}>{p.part_no} - {p.description}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ==================== VIEW 1: PART-WISE STOCK ==================== */}
      {subTab === 'part_wise' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <span className="font-semibold text-slate-900 text-sm">
                  Part-wise Inventory Summary ({filteredPartWise.length} Components)
                </span>
                <div className="text-xs text-slate-500">
                  Formula: Current Stock = Total Inward - (Total Dispatched + Scrap)
                </div>
              </div>

              <button
                onClick={() => handleExportPartyWiseExcel()}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition"
                title="Download complete stock breakdown by party/customer as Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Party-wise Excel</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Part Number & Details</th>
                    <th className="py-3 px-4 text-center">Grade</th>
                    <th className="py-3 px-4 text-center">HSN Code</th>
                    <th className="py-3 px-4 text-right">Inward Qty</th>
                    <th className="py-3 px-4 text-right">Dispatched Qty</th>
                    <th className="py-3 px-4 text-right">Machine Rej</th>
                    <th className="py-3 px-4 text-right">Forging Rej</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Current Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPartWise.length > 0 ? (
                    filteredPartWise.map((part) => {
                      const stock = Number(part.current_stock || 0);
                      const inQty = Number(part.total_inward || 0);
                      const outQty = Number(part.total_outward || 0);
                      const mRej = Number(part.total_machine_rejection || 0);
                      const fRej = Number(part.total_forging_rejection || 0);
                      const isPositive = stock > 0;

                      return (
                        <tr key={part.part_id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 font-mono text-sm">{part.part_no}</div>
                            <div className="text-xs text-slate-500">{part.description}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                              {part.grade || '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">
                            {part.hsn_code || '73261910'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-medium tabular-nums">
                            +{inQty.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">{part.unit || 'NOS'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-indigo-700 font-medium tabular-nums">
                            -{outQty.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">{part.unit || 'NOS'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-amber-700 tabular-nums">
                            {mRej > 0 ? `-${mRej.toLocaleString()}` : '0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-rose-700 tabular-nums">
                            {fRej > 0 ? `-${fRej.toLocaleString()}` : '0'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                            <span className={isPositive ? 'text-slate-900' : 'text-slate-400'}>
                              {stock.toLocaleString()}
                            </span>
                            <span className="text-xs font-sans text-slate-500 font-normal ml-1">{part.unit || 'NOS'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isPositive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                In Stock ({part.parties_count || 1} Party)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                Balanced / Nil
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleExportPartyWiseExcel(part.part_no)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition"
                                title={`Download party-wise breakdown Excel for ${part.part_no}`}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Party Excel</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPartId(part.part_id);
                                  setSubTab('ledger');
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg transition"
                              >
                                <span>Ledger</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="py-8 text-center text-slate-400 text-sm">
                        No parts matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW 2: PARTY-WISE STOCK ==================== */}
      {subTab === 'party_wise' && (
        <div className="space-y-6">
          {filteredPartyWise.length > 0 ? (
            filteredPartyWise.map((party) => {
              const parts = party.parts || [];
              const totalStock = Number(party.total_stock_qty || 0);

              return (
                <div key={party.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  
                  {/* Party Banner */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded border border-sky-800">
                          Jobwork Client
                        </span>
                        {party.gstin && (
                          <span className="text-xs font-mono text-slate-300">GSTIN: {party.gstin}</span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-white mt-1">{party.name}</h2>
                      <p className="text-xs text-slate-400 truncate max-w-xl">{party.address}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                          Total Floor Stock
                        </div>
                        <div className="text-2xl font-bold font-mono tabular-nums text-sky-300">
                          {totalStock.toLocaleString()}
                          <span className="text-xs font-sans font-normal text-slate-300 ml-1">NOS</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigateWithData('outward', {
                          openCreate: true,
                          party_id: party.id
                        })}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition shadow-sm inline-flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Create Outward Dispatch</span>
                      </button>
                    </div>
                  </div>

                  {/* Components List for this party */}
                  <div className="p-4 overflow-x-auto">
                    {parts.length > 0 ? (
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase bg-slate-50/50">
                            <th className="py-2.5 px-3">Part Number</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-center">Grade</th>
                            <th className="py-2.5 px-3 text-right">Inward Material</th>
                            <th className="py-2.5 px-3 text-right">Dispatched</th>
                            <th className="py-2.5 px-3 text-right">Machine Rej</th>
                            <th className="py-2.5 px-3 text-right">Forging Rej</th>
                            <th className="py-2.5 px-3 text-right font-semibold">Stock Balance</th>
                            <th className="py-2.5 px-3 text-center">Quick Dispatch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {parts.map((pt, idx) => {
                            const cur = Number(pt.current_stock || 0);
                            const lotKey = `${party.id}_${pt.part_id}`;
                            const isExpanded = !!expandedPartLots[lotKey];
                            const lots = expandedPartLots[lotKey] || [];
                            const isLoading = !!loadingLots[lotKey];

                            return (
                              <React.Fragment key={idx}>
                                <tr className="hover:bg-slate-50 transition">
                                  <td className="py-3 px-3 font-semibold font-mono text-slate-900">{pt.part_no}</td>
                                  <td className="py-3 px-3 text-slate-600 text-xs">{pt.description}</td>
                                  <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">{pt.grade || '-'}</td>
                                  <td className="py-3 px-3 text-right font-mono text-emerald-700 tabular-nums">+{Number(pt.inward_qty).toLocaleString()}</td>
                                  <td className="py-3 px-3 text-right font-mono text-indigo-700 tabular-nums">-{Number(pt.outward_qty).toLocaleString()}</td>
                                  <td className="py-3 px-3 text-right font-mono text-amber-700 tabular-nums">{Number(pt.machine_rej_qty || 0) > 0 ? `-${Number(pt.machine_rej_qty).toLocaleString()}` : '0'}</td>
                                  <td className="py-3 px-3 text-right font-mono text-rose-700 tabular-nums">{Number(pt.forging_rej_qty || 0) > 0 ? `-${Number(pt.forging_rej_qty).toLocaleString()}` : '0'}</td>
                                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                                    {cur.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">{pt.unit || 'NOS'}</span>
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center justify-center space-x-1.5">
                                      <button
                                        onClick={() => togglePartLots(party.id, pt.part_id)}
                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                                        title="View Inward Challan lots for this component"
                                      >
                                        <span>Challans</span>
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                      {cur > 0 ? (
                                        <button
                                          onClick={() => onNavigateWithData('outward', {
                                            openCreate: true,
                                            party_id: party.id,
                                            part_id: pt.part_id,
                                            quantity: cur
                                          })}
                                          className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-2.5 py-1 rounded-lg transition"
                                        >
                                          Dispatch
                                        </button>
                                      ) : (
                                        <span className="text-xs text-slate-400">Balanced</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Inward Challans Sub-table */}
                                {isExpanded && (
                                  <tr className="bg-slate-50/75 border-b border-indigo-100">
                                    <td colSpan="9" className="p-3 pl-6">
                                      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2">
                                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                          <span>Inward Challan Lots for {pt.part_no}:</span>
                                          <span className="text-slate-400 font-normal">Select a challan to dispatch outward</span>
                                        </div>
                                        {isLoading ? (
                                          <div className="py-2 text-xs text-slate-400">Loading challans...</div>
                                        ) : lots.length === 0 ? (
                                          <div className="py-2 text-xs text-slate-400">No inward challans found for this part.</div>
                                        ) : (
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs border-collapse">
                                              <thead>
                                                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                                  <th className="py-2 px-2.5">Inward Challan #</th>
                                                  <th className="py-2 px-2.5">Dated</th>
                                                  <th className="py-2 px-2.5">Heat No</th>
                                                  <th className="py-2 px-2.5 text-right">Inward Qty</th>
                                                  <th className="py-2 px-2.5 text-right">Dispatched</th>
                                                  <th className="py-2 px-2.5 text-right">Machine Rej</th>
                                                  <th className="py-2 px-2.5 text-right">Forging Rej</th>
                                                  <th className="py-2 px-2.5 text-right font-semibold text-emerald-800">Available Qty</th>
                                                  <th className="py-2 px-2.5 text-center">Action</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                {lots.map((lot, lIdx) => (
                                                  <tr key={lIdx} className="hover:bg-slate-50">
                                                    <td className="py-2 px-2.5 font-mono font-semibold text-slate-800">
                                                      #{lot.inward_challan_no}
                                                    </td>
                                                    <td className="py-2 px-2.5 text-slate-500">{lot.challan_date}</td>
                                                    <td className="py-2 px-2.5 font-mono text-slate-600">{lot.heat_no || '-'}</td>
                                                    <td className="py-2 px-2.5 text-right font-mono text-slate-700 tabular-nums">{Number(lot.original_quantity).toLocaleString()}</td>
                                                    <td className="py-2 px-2.5 text-right font-mono text-slate-500 tabular-nums">{Number(lot.dispatched_quantity).toLocaleString()}</td>
                                                    <td className="py-2 px-2.5 text-right font-mono text-amber-700 tabular-nums">
                                                      {Number(lot.machine_rejection || 0) > 0 ? `-${Number(lot.machine_rejection).toLocaleString()}` : '0'}
                                                    </td>
                                                    <td className="py-2 px-2.5 text-right font-mono text-rose-700 tabular-nums">
                                                      {Number(lot.forging_rejection || 0) > 0 ? `-${Number(lot.forging_rejection).toLocaleString()}` : '0'}
                                                    </td>
                                                    <td className="py-2 px-2.5 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                                                      {Number(lot.available_stock).toLocaleString()} <span className="text-[10px] font-sans text-slate-400 font-normal">{lot.unit || 'NOS'}</span>
                                                    </td>
                                                    <td className="py-2 px-2.5 text-center">
                                                      {Number(lot.available_stock) > 0 ? (
                                                        <button
                                                          onClick={() => onNavigateWithData('outward', {
                                                            openCreate: true,
                                                            party_id: party.id,
                                                            part_id: pt.part_id,
                                                            inward_item_id: lot.inward_item_id,
                                                            inward_challan_no: lot.inward_challan_no,
                                                            quantity: lot.available_stock
                                                          })}
                                                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-xs transition"
                                                        >
                                                          Dispatch Challan
                                                        </button>
                                                      ) : (
                                                        <span className="text-[10px] text-slate-400">Complete</span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No active stock for this party. Receive material using "Create Inward Challan".
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 text-sm border border-slate-200">
              No parties found.
            </div>
          )}
        </div>
      )}

      {/* ==================== VIEW 3: CROSS MATRIX ==================== */}
      {subTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="font-semibold text-slate-800 text-sm">
              Party × Part Cross Stock Matrix ({matrixData.length} records)
            </span>
            <span className="text-xs text-slate-500">
              Use party or part dropdown above to filter specific relationships
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Party / Customer Name</th>
                  <th className="py-3 px-4">Part No & Description</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-right">Inward Qty</th>
                  <th className="py-3 px-4 text-right">Dispatched Qty</th>
                  <th className="py-3 px-4 text-right">Machine Rej</th>
                  <th className="py-3 px-4 text-right">Forging Rej</th>
                  <th className="py-3 px-4 text-right font-bold text-slate-900">Current Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.length > 0 ? (
                  matrixData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">{row.party_name}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900">{row.part_no}</div>
                        <div className="text-xs text-slate-500">{row.part_description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600">{row.grade || '-'}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 tabular-nums">+{Number(row.total_inward).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-indigo-700 tabular-nums">-{Number(row.total_outward).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-700 tabular-nums">{Number(row.total_machine_rejection || 0) > 0 ? `-${Number(row.total_machine_rejection).toLocaleString()}` : '0'}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-rose-700 tabular-nums">{Number(row.total_forging_rejection || 0) > 0 ? `-${Number(row.total_forging_rejection).toLocaleString()}` : '0'}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {Number(row.current_stock).toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">{row.unit || 'NOS'}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 text-sm">
                      No stock records match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== VIEW 4: TRANSACTION LEDGER ==================== */}
      {subTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="font-semibold text-slate-800 text-sm">
                  Chronological Transaction Ledger
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  (Inwards +, Outwards -, with Running Floor Balance)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Net Balance:</span>
                <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                  {Number(ledgerData.current_balance || 0).toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">NOS</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Challan No</th>
                    <th className="py-3 px-4">Party</th>
                    <th className="py-3 px-4">Part No</th>
                    <th className="py-3 px-4">Process / Vehicle</th>
                    <th className="py-3 px-4 text-right">Inward (+)</th>
                    <th className="py-3 px-4 text-right">Outward (-)</th>
                    <th className="py-3 px-4 text-right">Machine Rej</th>
                    <th className="py-3 px-4 text-right">Forging Rej</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerData.data && ledgerData.data.length > 0 ? (
                    ledgerData.data.map((tx, idx) => {
                      const isIn = tx.doc_type === 'INWARD';
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 font-mono text-xs">
                          <td className="py-3 px-4 text-slate-700">{tx.challan_date}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              isIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {isIn ? '+ INWARD' : '- OUTWARD'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">#{tx.challan_no}</td>
                          <td className="py-3 px-4 font-sans font-medium text-slate-800">{tx.party_name}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{tx.part_no}</td>
                          <td className="py-3 px-4 font-sans text-slate-500">
                            <div>{tx.process_name || 'Jobwork'}</div>
                            {tx.vehicle_no && <div className="text-[10px] text-slate-400">Veh: {tx.vehicle_no}</div>}
                          </td>
                          <td className="py-3 px-4 text-right text-emerald-700 font-semibold tabular-nums">
                            {tx.qty_in > 0 ? `+${Number(tx.qty_in).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-indigo-700 font-semibold tabular-nums">
                            {tx.qty_out > 0 ? `-${Number(tx.qty_out).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-amber-700 tabular-nums">
                            {Number(tx.qty_machine_rej || 0) > 0 ? `-${Number(tx.qty_machine_rej).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right text-rose-700 tabular-nums">
                            {Number(tx.qty_forging_rej || 0) > 0 ? `-${Number(tx.qty_forging_rej).toLocaleString()}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm tabular-nums">
                            {Number(tx.running_balance).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" className="py-8 text-center text-slate-400 text-sm">
                        No transactions found for the selected party or part.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

