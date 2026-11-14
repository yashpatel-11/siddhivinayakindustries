// frontend/src/pages/OutwardChallans.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Calendar, 
  Truck, 
  AlertCircle,
  X,
  Info,
  CheckCircle2,
  Layers,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';

export default function OutwardChallans({ 
  onViewChallan, 
  initialOpenCreate = false, 
  prefillData = null,
  onActionComplete 
}) {
  const [challans, setChallans] = useState([]);
  const [parties, setParties] = useState([]);
  const [partyParts, setPartyParts] = useState([]); // Parts inwarded by the selected party
  const [inwardLotsByRow, setInwardLotsByRow] = useState({}); // { [rowIndex]: lots[] }
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(initialOpenCreate);

  // New Outward Form State
  const [formData, setFormData] = useState({
    challan_no: `SV/DC-${String(Math.floor(Math.random() * 900) + 100)}`,
    challan_date: new Date().toISOString().slice(0, 10),
    party_id: prefillData?.party_id ? String(prefillData.party_id) : '',
    vehicle_no: '',
    eway_bill_no: '',
    process_carried_out: 'BROACHING / CNC TURNING COMPLETED',
    remarks: '',
    items: [
      { 
        part_id: prefillData?.part_id ? String(prefillData.part_id) : '', 
        inward_item_id: prefillData?.inward_item_id ? String(prefillData.inward_item_id) : '',
        inward_challan_no: prefillData?.inward_challan_no || '',
        challan_date: '',
        heat_no: '', 
        available_challan_stock: null,
        quantity: prefillData?.quantity || '', 
        machine_rejection: '0',
        forging_rejection: '0',
        waste_quantity: '0', 
        rate: '', 
        amount: 0,
        unit: 'NOS'
      }
    ]
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialOpenCreate) {
      setShowCreateModal(true);
    }
  }, [initialOpenCreate]);

  // Handle incoming prefillData (e.g. dispatched from Party-wise stock management)
  useEffect(() => {
    if (prefillData && Object.keys(prefillData).length > 0) {
      if (prefillData.openCreate) {
        setShowCreateModal(true);
      }
      if (prefillData.party_id) {
        const partyIdStr = String(prefillData.party_id);
        const partIdStr = prefillData.part_id ? String(prefillData.part_id) : '';
        const targetInwardItemId = prefillData.inward_item_id ? String(prefillData.inward_item_id) : '';

        setFormData(prev => ({
          ...prev,
          party_id: partyIdStr,
          items: [
            { 
              part_id: partIdStr, 
              inward_item_id: targetInwardItemId,
              inward_challan_no: prefillData.inward_challan_no || '',
              challan_date: '',
              heat_no: '', 
              available_challan_stock: null,
              quantity: prefillData?.quantity ? String(prefillData.quantity) : '', 
              machine_rejection: '0',
              forging_rejection: '0',
              waste_quantity: '0', 
              rate: '', 
              amount: 0,
              unit: 'NOS'
            }
          ]
        }));
        loadPartyPartsAndInitialize(partyIdStr, partIdStr, targetInwardItemId);
      }
    }
  }, [prefillData]);

  // When party_id changes manually, load parts inwarded by this specific party
  useEffect(() => {
    if (formData.party_id) {
      loadPartyPartsAndInitialize(formData.party_id);
    } else {
      setPartyParts([]);
      setInwardLotsByRow({});
    }
  }, [formData.party_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chRes, pRes] = await Promise.all([
        api.getOutwards(),
        api.getParties()
      ]);
      setChallans(chRes.data || []);
      setParties(pRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPartyPartsAndInitialize = async (partyId, targetPartId = null, targetInwardItemId = null) => {
    try {
      const res = await api.getPartyParts(partyId);
      const parts = res.data || [];
      setPartyParts(parts);

      const partToLoad = targetPartId || prefillData?.part_id;
      if (partToLoad) {
        await loadLotsForRow(0, partyId, partToLoad, targetInwardItemId || prefillData?.inward_item_id);
      }
    } catch (e) {
      console.error("Failed to load party parts:", e);
    }
  };

  const loadLotsForRow = async (rowIndex, partyId, partId, targetInwardItemId = null) => {
    if (!partyId || !partId) return;
    try {
      const res = await api.getInwardLots(partyId, partId);
      const lots = res.data || [];
      setInwardLotsByRow(prev => ({
        ...prev,
        [rowIndex]: lots
      }));

      // Auto-select lot if specified or available
      if (lots.length > 0) {
        let lotToSelect = null;
        if (targetInwardItemId) {
          lotToSelect = lots.find(l => String(l.inward_item_id) === String(targetInwardItemId));
        }
        if (!lotToSelect) {
          // Default to the first lot that has available stock, or the first lot
          lotToSelect = lots.length === 1 ? lots[0] : (lots.find(l => Number(l.available_stock) > 0) || lots[0]);
        }
        if (lotToSelect) {
          selectLotForItem(rowIndex, lotToSelect);
        }
      }
    } catch (e) {
      console.error("Failed to load inward lots:", e);
    }
  };

  const handlePartyChange = async (partyId) => {
    setFormData(prev => ({
      ...prev,
      party_id: partyId,
      items: [
        { 
          part_id: '', 
          inward_item_id: '',
          inward_challan_no: '',
          challan_date: '',
          heat_no: '', 
          available_challan_stock: null,
          quantity: '', 
          machine_rejection: '0',
          forging_rejection: '0',
          waste_quantity: '0', 
          rate: '', 
          amount: 0,
          unit: 'NOS'
        }
      ]
    }));
    setInwardLotsByRow({});
    setFormError('');
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          part_id: '', 
          inward_item_id: '',
          inward_challan_no: '',
          challan_date: '',
          heat_no: '', 
          available_challan_stock: null,
          quantity: '', 
          machine_rejection: '0',
          forging_rejection: '0',
          waste_quantity: '0', 
          rate: '', 
          amount: 0,
          unit: 'NOS'
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));

    // Clean up lots state
    setInwardLotsByRow(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  const handlePartChange = async (index, partId) => {
    const updated = [...formData.items];
    updated[index].part_id = partId;
    updated[index].inward_item_id = '';
    updated[index].inward_challan_no = '';
    updated[index].heat_no = '';
    updated[index].available_challan_stock = null;
    updated[index].rate = '';
    updated[index].quantity = '';
    updated[index].amount = 0;

    const partObj = partyParts.find(p => Number(p.part_id) === Number(partId));
    if (partObj) {
      updated[index].unit = partObj.unit || 'NOS';
      updated[index].rate = partObj.default_rate || '';
    }

    setFormData(prev => ({ ...prev, items: updated }));

    // Fetch all inward challans for this party and part
    if (partId && formData.party_id) {
      await loadLotsForRow(index, formData.party_id, partId);
    }
  };

  const handleInwardLotChange = (index, inwardItemId) => {
    const lots = inwardLotsByRow[index] || [];
    const selectedLot = lots.find(l => Number(l.inward_item_id) === Number(inwardItemId));

    if (selectedLot) {
      selectLotForItem(index, selectedLot);
    } else {
      const updated = [...formData.items];
      updated[index].inward_item_id = '';
      updated[index].inward_challan_no = '';
      updated[index].heat_no = '';
      updated[index].available_challan_stock = null;
      setFormData(prev => ({ ...prev, items: updated }));
    }
  };

  const selectLotForItem = (index, lot) => {
    const updated = [...formData.items];
    const availStock = Number(lot.available_stock || 0);

    updated[index].inward_item_id = lot.inward_item_id;
    updated[index].inward_challan_no = lot.inward_challan_no;
    updated[index].challan_date = lot.challan_date;
    updated[index].heat_no = lot.heat_no || '';
    updated[index].rate = lot.rate || 0;
    updated[index].available_challan_stock = availStock;
    updated[index].unit = lot.unit || 'NOS';
    
    // Automatically show the available quantity from the selected challan
    updated[index].quantity = availStock > 0 ? String(availStock) : '0';
    if (!updated[index].machine_rejection) updated[index].machine_rejection = '0';
    if (!updated[index].forging_rejection) updated[index].forging_rejection = '0';
    updated[index].waste_quantity = '0';

    // Auto calculate amount with qty
    const qty = parseFloat(updated[index].quantity) || 0;
    updated[index].amount = (qty * Number(lot.rate || 0)).toFixed(2);

    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleQtyChange = (index, field, value) => {
    const updated = [...formData.items];
    const it = updated[index];
    const maxStock = it.available_challan_stock !== null && it.available_challan_stock !== undefined
      ? Number(it.available_challan_stock)
      : null;

    // Enforce: Value entered should not cross the available quantity
    if (maxStock !== null && value !== '') {
      const numVal = parseFloat(value);
      if (!isNaN(numVal)) {
        if (field === 'quantity') {
          const mRej = parseFloat(it.machine_rejection) || 0;
          const fRej = parseFloat(it.forging_rejection) || 0;
          const maxAllowed = Math.max(0, maxStock - (mRej + fRej));
          if (numVal > maxAllowed) {
            value = String(maxAllowed);
          } else if (numVal < 0) {
            value = '0';
          }
        } else if (field === 'machine_rejection') {
          const qty = parseFloat(it.quantity) || 0;
          const fRej = parseFloat(it.forging_rejection) || 0;
          const maxAllowed = Math.max(0, maxStock - (qty + fRej));
          if (numVal > maxAllowed) {
            value = String(maxAllowed);
          } else if (numVal < 0) {
            value = '0';
          }
        } else if (field === 'forging_rejection') {
          const qty = parseFloat(it.quantity) || 0;
          const mRej = parseFloat(it.machine_rejection) || 0;
          const maxAllowed = Math.max(0, maxStock - (qty + mRej));
          if (numVal > maxAllowed) {
            value = String(maxAllowed);
          } else if (numVal < 0) {
            value = '0';
          }
        }
      }
    }

    updated[index][field] = value;

    // Synchronize total rejection / waste: machine_rejection + forging_rejection
    const mRej = parseFloat(updated[index].machine_rejection) || 0;
    const fRej = parseFloat(updated[index].forging_rejection) || 0;
    updated[index].waste_quantity = (mRej + fRej).toFixed(3).replace(/\.?0+$/, '') || '0';

    const qty = parseFloat(updated[index].quantity) || 0;
    const rate = parseFloat(updated[index].rate) || 0;
    updated[index].amount = (qty * rate).toFixed(2);

    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.challan_no.trim()) {
      setFormError('Please enter Challan Number');
      return;
    }
    if (!formData.party_id) {
      setFormError('Please select a Party / Customer');
      return;
    }

    const validItems = formData.items.filter(it => it.part_id && (parseFloat(it.quantity) > 0 || parseFloat(it.machine_rejection) > 0 || parseFloat(it.forging_rejection) > 0));
    if (validItems.length === 0) {
      setFormError('Please select a part, inward challan, and enter quantity');
      return;
    }

    // Strict validation against selected Inward Challan remaining stock
    for (const it of validItems) {
      const q = parseFloat(it.quantity) || 0;
      const m = parseFloat(it.machine_rejection) || 0;
      const f = parseFloat(it.forging_rejection) || 0;
      const req = q + m + f;
      if (it.available_challan_stock !== null && it.available_challan_stock !== undefined) {
        if (req > it.available_challan_stock) {
          const partObj = partyParts.find(p => Number(p.part_id) === Number(it.part_id));
          setFormError(
            `Requested total qty (${req} = ${q} dispatch + ${m} m/c rej + ${f} forging rej) exceeds remaining balance (${it.available_challan_stock}) on Inward Challan #${it.inward_challan_no || 'Selected'} for ${partObj?.part_no || 'Part'}.`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await api.createOutward({
        ...formData,
        items: validItems
      });
      setShowCreateModal(false);
      resetForm();
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setFormError(err.message || 'Failed to save outward challan');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      challan_no: `SV/DC-${String(Math.floor(Math.random() * 900) + 100)}`,
      challan_date: new Date().toISOString().slice(0, 10),
      party_id: '',
      vehicle_no: '',
      eway_bill_no: '',
      process_carried_out: 'BROACHING / CNC TURNING COMPLETED',
      remarks: '',
      items: [
        { 
          part_id: '', 
          inward_item_id: '',
          inward_challan_no: '',
          challan_date: '',
          heat_no: '', 
          available_challan_stock: null,
          quantity: '', 
          machine_rejection: '0',
          forging_rejection: '0',
          waste_quantity: '0', 
          rate: '', 
          amount: 0,
          unit: 'NOS'
        }
      ]
    });
    setPartyParts([]);
    setInwardLotsByRow({});
    setFormError('');
  };

  const handleDelete = async (id, challanNo) => {
    if (!window.confirm(`Are you sure you want to delete Outward Challan #${challanNo}? Stock will be restored to inward challans.`)) {
      return;
    }
    try {
      await api.deleteOutward(id);
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (e) {
      alert("Error deleting challan: " + e.message);
    }
  };

  const filteredChallans = challans.filter(ch =>
    ch.challan_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ch.party_name && ch.party_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (ch.vehicle_no && ch.vehicle_no.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const calculateFormTotalQty = () => {
    return formData.items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
  };

  const calculateFormTotalMachineRej = () => {
    return formData.items.reduce((sum, it) => sum + (parseFloat(it.machine_rejection) || 0), 0);
  };

  const calculateFormTotalForgingRej = () => {
    return formData.items.reduce((sum, it) => sum + (parseFloat(it.forging_rejection) || 0), 0);
  };

  const calculateFormTotalWaste = () => {
    return formData.items.reduce((sum, it) => sum + (parseFloat(it.waste_quantity) || 0), 0);
  };

  const calculateFormTotalAmount = () => {
    return formData.items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Finished Goods Dispatch
            </span>
            <span className="text-xs text-slate-400">Rule 55 Delivery Challan</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Outward Delivery Challans
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Select Customer → Choose Inwarded Part → Select Inward Challan lot with live balance → Dispatch.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Outward Challan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Challan No, Consignee Name, Vehicle No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Total Dispatches: <span className="font-semibold text-slate-800 tabular-nums">{filteredChallans.length}</span>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 text-xs uppercase font-semibold tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Challan No & Date</th>
                <th className="py-3 px-4">Consignee / Customer</th>
                <th className="py-3 px-4">Vehicle & E-Way Bill</th>
                <th className="py-3 px-4">Process Carried Out</th>
                <th className="py-3 px-4 text-right">Dispatched Qty</th>
                <th className="py-3 px-4 text-right">M/C Rej</th>
                <th className="py-3 px-4 text-right">Forging Rej</th>
                <th className="py-3 px-4 text-right">Total Scrap</th>
                <th className="py-3 px-4 text-right">Value (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChallans.length > 0 ? (
                filteredChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold font-mono text-slate-900 text-sm">#{ch.challan_no}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{ch.challan_date}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{ch.party_name}</div>
                      {ch.party_gstin && (
                        <div className="text-xs font-mono text-slate-500">{ch.party_gstin}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      <div>Veh: {ch.vehicle_no || 'N/A'}</div>
                      <div>EWB: {ch.eway_bill_no || 'N/A'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-indigo-700 uppercase">
                      {ch.process_carried_out || 'Completed'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {Number(ch.total_quantity || 0).toLocaleString()}
                      <span className="text-xs text-slate-400 font-sans font-normal ml-1">NOS</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-rose-700">
                      {Number(ch.total_machine_rejection || 0) > 0 ? `${Number(ch.total_machine_rejection).toLocaleString()} NOS` : '0'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-amber-700">
                      {Number(ch.total_forging_rejection || 0) > 0 ? `${Number(ch.total_forging_rejection).toLocaleString()} NOS` : '0'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                      {Number(ch.total_waste || 0) > 0 ? `${Number(ch.total_waste).toLocaleString()} NOS` : '0'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 font-medium">
                      ₹ {Number(ch.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={async () => {
                            const full = await api.getOutward(ch.id);
                            onViewChallan(full.data || ch, 'OUTWARD');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition"
                          title="View / Print Official CGST Challan"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => handleDelete(ch.id, ch.challan_no)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Challan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-slate-400 text-sm">
                    No outward challans found. Click "Create Outward Challan" to dispatch goods.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE OUTWARD MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">Create Outward Delivery Challan</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dispatch against specific Inward Challan lots with dynamic Heat Number & Rate
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              {/* Step 1: Select Party */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                  1. Customer & Transport Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Party / Customer <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.party_id}
                      onChange={(e) => handlePartyChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                    >
                      <option value="">-- Choose Party --</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Outward Challan No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SV/DC-002"
                      value={formData.challan_no}
                      onChange={(e) => setFormData({ ...formData, challan_no: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Challan Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.challan_date}
                      onChange={(e) => setFormData({ ...formData, challan_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Transport & Process Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Vehicle No.</label>
                  <input
                    type="text"
                    placeholder="e.g. GJ03AV0349"
                    value={formData.vehicle_no}
                    onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">E-Way Bill No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 690123849102"
                    value={formData.eway_bill_no}
                    onChange={(e) => setFormData({ ...formData, eway_bill_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Process Carried Out</label>
                  <input
                    type="text"
                    placeholder="e.g. BROACHING COMPLETED"
                    value={formData.process_carried_out}
                    onChange={(e) => setFormData({ ...formData, process_carried_out: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>

              {/* Step 2: Line items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    2. Dispatched Components & Rejection Tracking
                  </div>
                  <button
                    type="button"
                    disabled={!formData.party_id}
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {!formData.party_id ? (
                  <div className="p-8 text-center text-slate-400 text-sm bg-slate-50">
                    Please select a Customer above to view inward parts and available challan lots.
                  </div>
                ) : partyParts.length === 0 ? (
                  <div className="p-8 text-center text-amber-700 text-sm bg-amber-50 border border-amber-200 m-3 rounded-xl">
                    No inward stock found for this customer. Please record an Inward Delivery Challan first.
                  </div>
                ) : (
                  <div className="p-4 space-y-4 bg-slate-50/50">
                    {formData.items.map((item, idx) => {
                      const lots = inwardLotsByRow[idx] || [];
                      const isStockExceeded = item.available_challan_stock !== null && 
                        (parseFloat(item.quantity || 0) + parseFloat(item.waste_quantity || 0)) > item.available_challan_stock;

                      return (
                        <div 
                          key={idx} 
                          className={`p-4 bg-white border rounded-xl shadow-xs space-y-3 transition ${
                            isStockExceeded ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
                          }`}
                        >
                          {/* Row Top Bar */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                            <span className="font-semibold text-slate-700">Item #{idx + 1}</span>
                            
                            {/* Available Stock on this selected Inward Challan */}
                            {item.available_challan_stock !== null && (
                              <div className="flex items-center space-x-2">
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full tabular-nums ${
                                  isStockExceeded 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-mono' 
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono'
                                }`}>
                                  Available on Inward Ch. #{item.inward_challan_no}: {item.available_challan_stock} {item.unit || 'NOS'}
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={formData.items.length === 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1 rounded transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Grid 1: Part & Inward Challan Dropdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            
                            {/* Part Dropdown */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Customer Component / Part <span className="text-rose-500">*</span>
                              </label>
                              <select
                                required
                                value={item.part_id}
                                onChange={(e) => handlePartChange(idx, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
                              >
                                <option value="">-- Select Component --</option>
                                {partyParts.map(p => (
                                  <option key={p.part_id} value={p.part_id}>
                                    {p.part_no} - {p.description} (Floor Stock: {p.available_stock} {p.unit || 'NOS'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Inward Challan Lot Dropdown */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Select Inward Challan Lot <span className="text-rose-500">*</span>
                              </label>
                              <select
                                required
                                disabled={!item.part_id}
                                value={item.inward_item_id}
                                onChange={(e) => handleInwardLotChange(idx, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-400"
                              >
                                <option value="">
                                  {item.part_id ? "-- Choose Inward Challan --" : "Select part first"}
                                </option>
                                {lots.map(lot => (
                                  <option key={lot.inward_item_id} value={lot.inward_item_id}>
                                    Challan #{lot.inward_challan_no} (Dated: {lot.challan_date} | Heat: {lot.heat_no} | Inward: {lot.original_quantity} | Avail: {lot.available_stock} {lot.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                          </div>

                          {/* Grid 2: Line items inputs */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 pt-1">
                            
                            {/* Heat Number */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">Heat Number</label>
                              <input
                                type="text"
                                placeholder="Auto-filled"
                                value={item.heat_no}
                                onChange={(e) => {
                                  const upd = [...formData.items];
                                  upd[idx].heat_no = e.target.value;
                                  setFormData({ ...formData, items: upd });
                                }}
                                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-medium bg-slate-50"
                              />
                            </div>

                            {/* Rate */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">Rate (₹)</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.rate}
                                onChange={(e) => handleQtyChange(idx, 'rate', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono tabular-nums font-medium bg-slate-50"
                              />
                            </div>

                            {/* Available Quantity */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">Available Stock</label>
                              <div className="px-2.5 py-1.5 text-sm bg-emerald-50 text-emerald-800 rounded-lg font-mono tabular-nums font-semibold border border-emerald-200 text-center truncate">
                                {item.available_challan_stock !== null ? `${item.available_challan_stock} ${item.unit || 'NOS'}` : 'Select Lot'}
                              </div>
                            </div>

                            {/* Dispatch Quantity */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Dispatch Qty (OK) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max={item.available_challan_stock !== null ? Math.max(0, item.available_challan_stock - ((parseFloat(item.machine_rejection) || 0) + (parseFloat(item.forging_rejection) || 0))) : undefined}
                                required
                                placeholder="0"
                                value={item.quantity}
                                onChange={(e) => handleQtyChange(idx, 'quantity', e.target.value)}
                                className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 font-mono tabular-nums font-semibold ${
                                  isStockExceeded 
                                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500/20' 
                                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                                }`}
                              />
                            </div>

                            {/* Machine Rejection */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">Machine Rej</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max={item.available_challan_stock !== null ? Math.max(0, item.available_challan_stock - ((parseFloat(item.quantity) || 0) + (parseFloat(item.forging_rejection) || 0))) : undefined}
                                placeholder="0"
                                value={item.machine_rejection}
                                onChange={(e) => handleQtyChange(idx, 'machine_rejection', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono tabular-nums font-medium text-rose-700"
                              />
                            </div>

                            {/* Forging Rejection */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">Forging Rej</label>
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                max={item.available_challan_stock !== null ? Math.max(0, item.available_challan_stock - ((parseFloat(item.quantity) || 0) + (parseFloat(item.machine_rejection) || 0))) : undefined}
                                placeholder="0"
                                value={item.forging_rejection}
                                onChange={(e) => handleQtyChange(idx, 'forging_rejection', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono tabular-nums font-medium text-amber-700"
                              />
                            </div>

                            {/* Dynamic Line Amount */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount (₹)</label>
                              <div className="px-2.5 py-1.5 text-sm bg-slate-100 rounded-lg font-mono tabular-nums font-semibold text-slate-900 text-right border border-slate-200">
                                ₹ {Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </div>
                            </div>

                          </div>

                          {/* Warning banner if stock exceeded */}
                          {isStockExceeded && (
                            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg font-medium flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>
                                Warning: Entered total ({Number(item.quantity || 0) + Number(item.machine_rejection || 0) + Number(item.forging_rejection || 0)}) exceeds available balance of {item.available_challan_stock} on Inward Challan #{item.inward_challan_no}!
                              </span>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Subtotals Footer */}
                <div className="bg-slate-100 px-4 py-3 flex flex-wrap items-center justify-between border-t border-slate-200 text-xs gap-3">
                  <div className="font-medium text-slate-600">
                    Total Items: <span className="font-bold text-slate-800">{formData.items.length}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-slate-500">Dispatch Qty:</span> <span className="font-bold font-mono tabular-nums text-indigo-700 ml-1">{calculateFormTotalQty().toLocaleString()} NOS</span>
                    </div>
                    <div>
                      <span className="text-slate-500">M/C Rej:</span> <span className="font-bold font-mono tabular-nums text-rose-600 ml-1">{calculateFormTotalMachineRej().toLocaleString()} NOS</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Forging Rej:</span> <span className="font-bold font-mono tabular-nums text-amber-600 ml-1">{calculateFormTotalForgingRej().toLocaleString()} NOS</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Scrap:</span> <span className="font-bold font-mono tabular-nums text-slate-700 ml-1">{calculateFormTotalWaste().toLocaleString()} NOS</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Value:</span> <span className="font-bold font-mono tabular-nums text-slate-900 ml-1">₹ {calculateFormTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Remarks / Dispatch Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Broaching completed against customer jobwork order..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.party_id || partyParts.length === 0}
                  className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg shadow-xs transition"
                >
                  {submitting ? 'Saving Challan...' : 'Create Outward Challan'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
