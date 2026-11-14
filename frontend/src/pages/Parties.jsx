// frontend/src/pages/Parties.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Phone, MapPin, X, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Parties({ onActionComplete }) {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingParty, setEditingParty] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    gstin: '',
    address: '',
    phone: '',
    state_code: '24-Gujarat'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    setLoading(true);
    try {
      const res = await api.getParties();
      setParties(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingParty(null);
    setFormData({
      name: '',
      gstin: '',
      address: '',
      phone: '',
      state_code: '24-Gujarat'
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingParty(p);
    setFormData({
      name: p.name,
      gstin: p.gstin || '',
      address: p.address || '',
      phone: p.phone || '',
      state_code: p.state_code || '24-Gujarat'
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim()) {
      setError('Party name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingParty) {
        await api.updateParty({ ...formData, id: editingParty.id });
      } else {
        await api.createParty(formData);
      }
      setShowModal(false);
      await loadParties();
      if (onActionComplete) onActionComplete();
    } catch (err) {
      setError(err.message || 'Failed to save party');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete party "${name}"?`)) return;
    try {
      await api.deleteParty(id);
      await loadParties();
      if (onActionComplete) onActionComplete();
    } catch (e) {
      alert("Error deleting party: " + e.message);
    }
  };

  const filteredParties = parties.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.gstin && p.gstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.phone && p.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              Parties Directory
            </span>
            <span className="text-xs text-slate-500">Customers & Jobwork Suppliers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Parties & Customer Masters
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage material suppliers, manufacturers, contact numbers, addresses, and GSTINs.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Party</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by party name, GSTIN, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="text-xs text-slate-500 hidden sm:block">
          Total: <span className="font-bold text-slate-800">{filteredParties.length}</span>
        </div>
      </div>

      {/* Parties Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParties.length > 0 ? (
          filteredParties.map((party) => (
            <div key={party.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">{party.name}</h3>
                      <span className="text-[11px] font-mono font-medium text-slate-500">
                        {party.gstin || 'NO GST NUMBER'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(party)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Party"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(party.id, party.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Party"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                  {party.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{party.address}</span>
                    </div>
                  )}
                  {party.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{party.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>State: {party.state_code || '24-Gujarat'}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-sans font-medium text-xs">
                  {party.total_inwards || 0} Inwards / {party.total_outwards || 0} Outwards
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-10 text-center text-slate-400 text-sm">
            No parties found. Click "Add Party" to create one.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingParty ? 'Edit Party' : 'Add Party / Customer'}
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
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Party / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AJK FORGE PRIVATE LIMITED"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 24AAGCA0436P1ZN"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">State & Code</label>
                  <input
                    type="text"
                    placeholder="24-Gujarat"
                    value={formData.state_code}
                    onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Contact Phone Numbers</label>
                <input
                  type="text"
                  placeholder="e.g. 9427867368 / 9313546921"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Complete Address / Factory Location</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Plot No. 10 A Survey No. 197 Near Micromelt, Veraval (Shapar), Rajkot"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                ></textarea>
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingParty ? 'Update Party' : 'Create Party')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

