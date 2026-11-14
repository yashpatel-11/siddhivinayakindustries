// frontend/src/components/Navbar.jsx
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Users, 
  Cog, 
  Database,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Lock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus, onRefreshBackend, onRunSetup, onLock }) {
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupMessage, setSetupMessage] = useState(null);

  const handleSetup = async () => {
    setSetupLoading(true);
    setSetupMessage(null);
    try {
      const res = await onRunSetup();
      setSetupMessage(res.message || "Setup completed!");
      setTimeout(() => setSetupMessage(null), 4000);
    } catch (e) {
      setSetupMessage("Setup error: " + e.message);
      setTimeout(() => setSetupMessage(null), 4000);
    } finally {
      setSetupLoading(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Stock Management', icon: Boxes, badge: 'Part/Party' },
    { id: 'inward', label: 'Inward Challans', icon: ArrowDownLeft },
    { id: 'outward', label: 'Outward Challans', icon: ArrowUpRight },
    { id: 'parties', label: 'Parties', icon: Users },
    { id: 'parts', label: 'Parts Master', icon: Cog },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Company Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-sky-900/30">
              SV
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                Siddhivinayak CNC
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Workshop
                </span>
              </div>
              <div className="text-[11px] text-slate-400 -mt-0.5">
                Challan & Stock Management System
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-sky-800 text-sky-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Backend & DB Status Widget */}
          <div className="flex items-center space-x-3">
            {backendStatus.online ? (
              <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-full text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline font-medium">PHP MySQL Connected</span>
                <span className="sm:hidden font-medium">MySQL</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-medium">Local Fast-Store</span>
                <span className="sm:hidden font-medium">Local</span>
                <button 
                  onClick={onRefreshBackend}
                  title="Test PHP backend connection"
                  className="hover:text-white ml-1 p-0.5 rounded transition"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={handleSetup}
              disabled={setupLoading}
              title="Initialize / Seed MySQL Database"
              className="hidden lg:flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>{setupLoading ? "Running DB Setup..." : "DB Setup"}</span>
            </button>

            {onLock && (
              <button
                onClick={onLock}
                title="Lock Terminal"
                className="flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex overflow-x-auto space-x-1 py-2 border-t border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
                  isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {setupMessage && (
          <div className="bg-sky-900/90 border border-sky-500 text-sky-200 text-xs px-3 py-1.5 rounded-lg mb-2 text-center">
            {setupMessage}
          </div>
        )}

      </div>
    </header>
  );
}

