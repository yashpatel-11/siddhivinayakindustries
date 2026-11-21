// frontend/src/pages/InwardChallans.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Printer, 
  Pencil,
  X, 
  Calendar, 
  Truck, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function InwardChallans({ 
  onViewChallan, 
  initialOpenCreate = false, 
  onActionComplete,
  currentWorkshop = 'siddhivinayak'
}) {
  const [challans, setChallans] = useState([]);
  const [parties, setParties] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(initialOpenCreate);
  const [editingId, setEditingId] = useState(null);

  // New Challan Form State
  const [formData, setFormData] = useState({
    challan_no: '',
    challan_date: new Date().toISOString().slice(0, 10),
    party_id: '',
    vehicle_no: '',
    eway_bill_no: '',
    process_required: 'CNC TURNING',
    remarks: '',
    items: [
      { part_id: '', grade: '', heat_no: '', quantity: '', rate: '', amount: 0 }
    ]
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentWorkshop]);

  useEffect(() => {
    if (initialOpenCreate) {
      setShowCreateModal(true);
    }
  }, [initialOpenCreate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [chRes, pRes, ptRes] = await Promise.all([
        api.getInwards(currentWorkshop),
        api.getParties(currentWorkshop),
        api.getParts(currentWorkshop)
      ]);
      setChallans(chRes.data || []);
      setParties(pRes.data || []);
      setParts(ptRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { part_id: '', grade: '', heat_no: '', quantity: '', rate: '', amount: 0 }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;

    if (field === 'part_id') {
      const selectedPart = parts.find(p => Number(p.id || p.part_id) === Number(value));
      if (selectedPart) {
        updated[index].grade = selectedPart.grade || '';
        updated[index].rate = selectedPart.default_rate || '';
      }
    }

    const qty = parseFloat(updated[index].quantity) || 0;
    const rate = parseFloat(updated[index].rate) || 0;
    updated[index].amount = (qty * rate).toFixed(2);

    setFormData(prev => ({ ...prev, items: updated }));
  };

  const handleOpenEdit = async (ch) => {
    try {
      const full = await api.getInward(ch.id);
      const data = full.data || ch;
      setEditingId(ch.id);
      setFormData({
        challan_no: data.challan_no || '',
        challan_date: data.challan_date || '',
        party_id: String(data.party_id || ''),
        vehicle_no: data.vehicle_no || '',
        eway_bill_no: data.eway_bill_no || '',
        process_required: data.process_required || 'CNC TURNING',
        remarks: data.remarks || '',
        items: (data.items && data.items.length > 0)
          ? data.items.map(it => ({
              id: it.id,
              part_id: String(it.part_id),
              grade: it.grade || '',
              heat_no: it.heat_no || '',
              quantity: String(it.quantity || ''),
              rate: String(it.rate || ''),
              amount: Number(it.amount || 0).toFixed(2)
            }))
          : [{ part_id: '', grade: '', heat_no: '', quantity: '', rate: '', amount: 0 }]
      });
      setFormError('');
      setShowCreateModal(true);
    } catch (err) {
      alert("Failed to load challan for editing: " + err.message);
    }
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

    const validItems = formData.items.filter(it => it.part_id && parseFloat(it.quantity) > 0);
    if (validItems.length === 0) {
      setFormError('Please enter at least one valid item with positive quantity');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateInward({
          ...formData,
          id: editingId,
          workshop: currentWorkshop,
          items: validItems
        });
      } else {
        await api.createInward({
          ...formData,
          workshop: currentWorkshop,
          items: validItems
        });
      }
      setShowCreateModal(false);
      resetForm();
      await loadData();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setFormError(err.message || 'Failed to save inward challan');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      challan_no: '',
      challan_date: new Date().toISOString().slice(0, 10),
      party_id: '',
      vehicle_no: '',
      eway_bill_no: '',
      process_required: 'CNC TURNING',
      remarks: '',
      items: [
        { part_id: '', grade: '', heat_no: '', quantity: '', rate: '', amount: 0 }
      ]
    });
    setFormError('');
  };

  const handleDelete = async (id, challanNo) => {
    if (!window.confirm(`Are you sure you want to delete Inward Challan #${challanNo}? This will also reverse stock.`)) {
      return;
    }
    try {
      await api.deleteInward(id);
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

  const calculateFormTotalAmount = () => {
    return formData.items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'}
            </span>
            <span className="text-xs text-slate-500">Material Receipt • CGST Rule 55 Format</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Inward Delivery Challans
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Log incoming jobwork materials from clients for machining and increase floor stock for {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'}.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Inward Challan</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Challan No, Party Name, Vehicle No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Total Challans: <span className="font-bold text-slate-800">{filteredChallans.length}</span>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Challan No & Date</th>
                <th className="py-3 px-4">Party / Material Supplier</th>
                <th className="py-3 px-4">Vehicle & E-Way Bill</th>
                <th className="py-3 px-4">Process Required</th>
                <th className="py-3 px-4 text-right">Total Quantity</th>
                <th className="py-3 px-4 text-right">Value (₹)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredChallans.length > 0 ? (
                filteredChallans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/80 transition">
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

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 uppercase">
                      {ch.process_required === 'BROACHING / CNC TURNING' ? 'CNC TURNING' : (ch.process_required || 'CNC TURNING')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">
                        {Number(ch.total_quantity || 0).toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">NOS</span>
                      </div>
                      <div className="text-xs text-slate-400 font-sans">
                        {ch.total_items || ch.items?.length || 1} Item(s)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-semibold tabular-nums">
                      ₹{Number(ch.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={async () => {
                            const full = await api.getInward(ch.id);
                            onViewChallan(full.data || ch, 'INWARD');
                          }}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                          title="View / Print Official CGST Challan"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ch)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Challan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ch.id, ch.challan_no)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Challan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 text-sm">
                    No inward challans found. Click "Create Inward Challan" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== CREATE MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">
                    {editingId ? 'Edit Inward Delivery Challan' : 'Create Inward Delivery Challan'}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingId ? 'Modify inward material receipt details and line items' : 'Receive Jobwork material into workshop inventory'}
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
                  <span>{formError}</span>
                </div>
              )}

              {/* Document Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Challan / Document No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. J/4518 or IN-2026-01"
                    value={formData.challan_no}
                    onChange={(e) => setFormData({ ...formData, challan_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Challan Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.challan_date}
                    onChange={(e) => setFormData({ ...formData, challan_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Material Supplier / Party *
                  </label>
                  <select
                    required
                    value={formData.party_id}
                    onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Select Party --</option>
                    {parties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.gstin || 'No GST'})</option>
                    ))}
                  </select>
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">E-Way Bill No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 652216743923"
                    value={formData.eway_bill_no}
                    onChange={(e) => setFormData({ ...formData, eway_bill_no: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Nature of Processing Required</label>
                  <input
                    type="text"
                    placeholder="e.g. CNC TURNING"
                    value={formData.process_required}
                    onChange={(e) => setFormData({ ...formData, process_required: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Material / Goods Received Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="p-3 space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Part / Component *</label>
                        <select
                          required
                          value={item.part_id}
                          onChange={(e) => handleItemChange(idx, 'part_id', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">-- Select Part --</option>
                          {parts.map(p => (
                            <option key={p.id || p.part_id} value={p.id || p.part_id}>
                              {p.part_no} - {p.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Grade</label>
                        <input
                          type="text"
                          placeholder="e.g. 20MNCR5"
                          value={item.grade}
                          onChange={(e) => handleItemChange(idx, 'grade', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Heat No.</label>
                        <input
                          type="text"
                          placeholder="e.g. J853550"
                          value={item.heat_no}
                          onChange={(e) => handleItemChange(idx, 'heat_no', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Quantity (NOS) *</label>
                        <input
                          type="number"
                          step="0.001"
                          required
                          placeholder="1000"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="82.00"
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono tabular-nums"
                        />
                      </div>

                      <div className="sm:col-span-1 flex items-center justify-between sm:justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={formData.items.length === 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1.5 rounded transition"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

                {/* Subtotals Footer */}
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-t border-slate-200 text-xs">
                  <div className="text-slate-600">
                    Total Items: <span className="font-semibold text-slate-900 font-mono">{formData.items.length}</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-slate-600">
                      Total Qty: <span className="font-semibold text-emerald-800 font-mono tabular-nums text-sm">{calculateFormTotalQty().toLocaleString()} NOS</span>
                    </div>
                    <div className="text-slate-600">
                      Total Value: <span className="font-semibold text-slate-900 font-mono tabular-nums text-sm">₹{calculateFormTotalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Remarks / Internal Note</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Urgent batch for broaching, heat code to be verified..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Inward Challan')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

