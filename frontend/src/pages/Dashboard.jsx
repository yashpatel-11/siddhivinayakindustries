// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Boxes, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Plus, 
  Eye, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function Dashboard({ 
  dashboardData, 
  onNavigate, 
  onViewChallan,
  currentWorkshop = 'siddhivinayak'
}) {
  const kpis = dashboardData?.kpis || {};
  const recentInwards = dashboardData?.recent_inwards || [];
  const recentOutwards = dashboardData?.recent_outwards || [];
  const topParts = dashboardData?.top_parts_stock || [];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-sky-500/20 text-sky-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-400/30">
              {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'}
            </span>
            <span className="text-slate-400 text-xs">CNC Machine Shop • Rule 55 CGST</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
            {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak Industries'} Stock & Operations
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Track inward jobwork materials, monitor CNC operations, manage stock part-wise and party-wise, and dispatch finished goods with delivery challans.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('inward', { openCreate: true })}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Inward Challan</span>
          </button>
          <button
            onClick={() => onNavigate('outward', { openCreate: true })}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Outward Challan</span>
          </button>
          <button
            onClick={() => onNavigate('stock')}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-sm font-medium border border-slate-700 transition"
          >
            <Boxes className="w-4 h-4 text-sky-400" />
            <span>Stock Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Floor Stock */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workshop Stock on Floor
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {Number(kpis.current_floor_stock || 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">NOS</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-medium">Active Raw / Machining</span> in shop
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
        </div>

        {/* Card 2: Total Inward */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inward Material
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {Number(kpis.total_inward_qty || 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">NOS</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{kpis.inward_challans_count || 0} Challans Received</span>
              <span className="font-semibold text-slate-700">₹ {(Number(kpis.total_inward_value || 0) / 1000).toFixed(1)}k</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Card 3: Total Outward Dispatched */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Dispatched
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
              {Number(kpis.total_outward_qty || 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">NOS</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{kpis.outward_challans_count || 0} Challans Dispatched</span>
              <span className="text-amber-700 font-medium">Scrap: {Number(kpis.total_waste_qty || 0)}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>

        {/* Card 4: Master Directory */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Master Directory
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-3">
              <div>
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{kpis.parties_count || 0}</span>
                <span className="text-xs text-slate-500 ml-1">Parties</span>
              </div>
              <div className="text-slate-300">/</div>
              <div>
                <span className="text-3xl font-bold text-slate-900 tabular-nums">{kpis.parts_count || 0}</span>
                <span className="text-xs text-slate-500 ml-1">Parts</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Clients, Suppliers & Component Masters
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
        </div>

      </div>

      {/* Part Stock Overview & Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Current Parts Stock on Floor</h2>
            <p className="text-xs text-slate-500">Live balance by component (Inward - Outward - Scrap)</p>
          </div>
          <button
            onClick={() => onNavigate('stock')}
            className="flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700"
          >
            <span>View Full Part & Party Breakdown</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topParts.length > 0 ? (
            topParts.map((part, idx) => {
              const current = Number(part.current_stock || 0);
              const inward = Number(part.inward_qty || 0);
              const pct = inward > 0 ? Math.min(100, Math.round((current / inward) * 100)) : 0;
              return (
                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{part.part_no}</div>
                      <div className="text-xs text-slate-600 truncate max-w-[180px]">{part.description}</div>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded font-semibold">
                      {part.grade || 'EN SERIES'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900">{current.toLocaleString()}</span>
                    <span className="text-xs text-slate-500">In: {inward.toLocaleString()} | Out: {Number(part.outward_qty || 0).toLocaleString()}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${
                        pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-6 text-slate-400 text-sm">
              No parts recorded yet. Click "+ Inward Challan" to begin.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Recent Inwards & Recent Outwards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Inwards */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Recent Inward Challans</h3>
                  <p className="text-[11px] text-slate-500">Material received from suppliers for machining</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('inward')}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentInwards.length > 0 ? (
                recentInwards.map((inv) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 font-mono">#{inv.challan_no}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-700">{inv.party_name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{inv.challan_date}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {inv.process_required === 'BROACHING / CNC TURNING' ? 'CNC TURNING' : (inv.process_required || 'CNC TURNING')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-900 tabular-nums font-mono">{Number(inv.total_qty || 0).toLocaleString()} <span className="font-sans font-normal text-xs text-slate-400">NOS</span></div>
                        <div className="text-xs text-slate-400">{inv.item_count || 1} item(s)</div>
                      </div>
                      <button
                        onClick={() => onViewChallan(inv, 'INWARD')}
                        className="inline-flex items-center p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition"
                        title="View / Print Challan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No inward challans yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Outwards */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Recent Outward Challans</h3>
                  <p className="text-xs text-slate-500">Machined goods dispatched back to clients</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('outward')}
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentOutwards.length > 0 ? (
                recentOutwards.map((out) => (
                  <div key={out.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 font-mono">#{out.challan_no}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-700">{out.party_name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{out.challan_date}</span>
                        <span>•</span>
                        <span className="text-indigo-700 font-medium">
                          {(out.process_carried_out === 'BROACHING / CNC TURNING COMPLETED' || out.process_carried_out === 'BROACHING / CNC TURNING')
                            ? 'CNC TURNING'
                            : (out.process_carried_out || 'CNC TURNING')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-900 tabular-nums font-mono">{Number(out.total_qty || 0).toLocaleString()} <span className="font-sans font-normal text-xs text-slate-400">NOS</span></div>
                        <div className="text-xs text-slate-400">{out.item_count || 1} item(s)</div>
                      </div>
                      <button
                        onClick={() => onViewChallan(out, 'OUTWARD')}
                        className="inline-flex items-center p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition"
                        title="View / Print Challan"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">No outward dispatches yet.</div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

