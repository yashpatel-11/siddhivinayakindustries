// frontend/src/pages/Parts.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Cog, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function Parts({ onActionComplete, currentWorkshop = 'siddhivinayak' }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);

  const [formData, setFormData] = useState({
    part_no: '',
    description: '',
    grade: '',
    hsn_code: '73261910',
    default_rate: '',
    unit: 'NOS'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadParts();
  }, [currentWorkshop]);

  const loadParts = async () => {
    setLoading(true);
    try {
      const res = await api.getParts(currentWorkshop);
      setParts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPart(null);
    setFormData({
      part_no: '',
      description: '',
      grade: '',
      hsn_code: '73261910',
      default_rate: '',
      unit: 'NOS'
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPart(p);
    setFormData({
      part_no: p.part_no,
      description: p.description,
      grade: p.grade || '',
      hsn_code: p.hsn_code || '73261910',
      default_rate: p.default_rate || '',
      unit: p.unit || 'NOS'
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.part_no.trim() || !formData.description.trim()) {
      setError('Part number and description are required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingPart) {
        await api.updatePart({ ...formData, id: editingPart.id || editingPart.part_id, workshop: editingPart.workshop || currentWorkshop });
      } else {
        await api.createPart({ ...formData, workshop: currentWorkshop });
      }
      setShowModal(false);
      await loadParts();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(err.message || 'Failed to save part');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, partNo) => {
    if (!window.confirm(`Delete part "${partNo}"?`)) return;
    try {
      await api.deletePart(id);
      await loadParts();
      if (onActionComplete) onActionComplete();
    } catch (e) {
      alert("Error deleting part: " + e.message);
    }
  };

  const filteredParts = parts.filter(p =>
    p.part_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.grade && p.grade.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              Material Components Master
            </span>
            <span className="text-xs text-slate-500">CNC Machined Parts & Grades</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Parts & Components Masters
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Configure drawing part numbers, raw material grades (20MNCR5, EN8, EN19), and HSN tax codes.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Component</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by part number, drawing description, grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Total Parts: <span className="font-bold text-slate-800">{filteredParts.length}</span>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Part Number & Drawing</th>
                <th className="py-3 px-4">Material Grade</th>
                <th className="py-3 px-4">HSN Code</th>
                <th className="py-3 px-4 text-right">Default Rate (₹)</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right font-semibold">Live Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length > 0 ? (
                filteredParts.map((part) => {
                  const partId = part.id || part.part_id;
                  const curStock = Number(part.current_stock || 0);

                  return (
                    <tr key={partId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold font-mono text-slate-900 text-sm">{part.part_no}</div>
                        <div className="text-xs text-slate-500">{part.description}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                          {part.grade || '-'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {part.hsn_code || '73261910'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-semibold tabular-nums">
                        {part.default_rate ? `₹${Number(part.default_rate).toFixed(2)}` : '₹0.00'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-xs font-medium text-slate-600">
                        {part.unit || 'NOS'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {curStock.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">{part.unit || 'NOS'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(part)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Component"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(partId, part.part_no)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 text-sm">
                    No components found. Click "Add Component" to add to catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingPart ? 'Edit Component' : 'Add Component Master'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Part / Drawing Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SG2639BRMC or FL-4401-PIN"
                  value={formData.part_no}
                  onChange={(e) => setFormData({ ...formData, part_no: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 font-mono uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Part Description / Component Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gear Shaft Machined Component"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Material Grade</label>
                  <input
                    type="text"
                    placeholder="e.g. 20MNCR5 / EN8"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">HSN Code</label>
                  <input
                    type="text"
                    placeholder="73261910"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Default Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="82.00"
                    value={formData.default_rate}
                    onChange={(e) => setFormData({ ...formData, default_rate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white"
                  >
                    <option value="NOS">NOS (Pieces)</option>
                    <option value="PCS">PCS</option>
                    <option value="KG">KG (Kilograms)</option>
                    <option value="SET">SET</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingPart ? 'Update Component' : 'Create Component')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

