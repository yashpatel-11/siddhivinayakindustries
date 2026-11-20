// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import StockManagement from './pages/StockManagement';
import InwardChallans from './pages/InwardChallans';
import OutwardChallans from './pages/OutwardChallans';
import Parties from './pages/Parties';
import Parts from './pages/Parts';
import ChallanPrintModal from './components/ChallanPrintModal';
import PinLockScreen from './components/PinLockScreen';
import { api } from './services/api';

export default function App() {
  const [isLocked, setIsLocked] = useState(() => {
    return sessionStorage.getItem('sv_system_unlocked') !== 'true';
  });
  const [currentWorkshop, setCurrentWorkshop] = useState(() => {
    const saved = localStorage.getItem('sv_current_workshop');
    if (saved) return saved;
    return api.getCurrentWorkshop ? api.getCurrentWorkshop() : 'siddhivinayak';
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState({ online: false, message: 'Checking...' });
  const [dashboardData, setDashboardData] = useState(null);
  const [printingChallan, setPrintingChallan] = useState(null); // { data, type }

  // Navigation state passed to tabs
  const [inwardOpenCreate, setInwardOpenCreate] = useState(false);
  const [outwardOpenCreate, setOutwardOpenCreate] = useState(false);
  const [prefillOutward, setPrefillOutward] = useState(null);

  useEffect(() => {
    checkBackend();
    loadDashboard(currentWorkshop);
  }, [currentWorkshop]);

  const checkBackend = async () => {
    const status = await api.checkHealth();
    setBackendStatus(status);
  };

  const loadDashboard = async (ws = currentWorkshop) => {
    try {
      const data = await api.getDashboard(ws);
      setDashboardData(data);
    } catch (e) {
      console.error("Dashboard load failed:", e);
    }
  };

  const handleWorkshopChange = (ws) => {
    setCurrentWorkshop(ws);
    if (api.setCurrentWorkshop) {
      api.setCurrentWorkshop(ws);
    }
    loadDashboard(ws);
  };

  const handleNavigate = (tab, options = {}) => {
    setActiveTab(tab);
    if (tab === 'inward') {
      setInwardOpenCreate(!!options.openCreate);
    }
    if (tab === 'outward') {
      setOutwardOpenCreate(!!options.openCreate);
      setPrefillOutward(options);
    }
  };

  const handleViewChallan = (challan, type = 'INWARD') => {
    setPrintingChallan({ data: challan, type });
  };

  const handleActionComplete = () => {
    loadDashboard(currentWorkshop);
    checkBackend();
  };

  const handleUnlock = () => {
    sessionStorage.setItem('sv_system_unlocked', 'true');
    setIsLocked(false);
  };

  const handleLock = () => {
    sessionStorage.removeItem('sv_system_unlocked');
    setIsLocked(true);
  };

  if (isLocked) {
    return <PinLockScreen onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans">

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setInwardOpenCreate(false);
          setOutwardOpenCreate(false);
          setPrefillOutward(null);
        }}
        currentWorkshop={currentWorkshop}
        onWorkshopChange={handleWorkshopChange}
        backendStatus={backendStatus}
        onRefreshBackend={async () => {
          await checkBackend();
          await loadDashboard(currentWorkshop);
        }}
        onRunSetup={async () => {
          const res = await api.runSetup();
          await checkBackend();
          await loadDashboard(currentWorkshop);
          return res;
        }}
        onLock={handleLock}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            dashboardData={dashboardData}
            onNavigate={handleNavigate}
            onViewChallan={handleViewChallan}
            currentWorkshop={currentWorkshop}
          />
        )}

        {activeTab === 'stock' && (
          <StockManagement
            currentWorkshop={currentWorkshop}
            onNavigateWithData={(tab, data) => handleNavigate(tab, data)}
          />
        )}

        {activeTab === 'inward' && (
          <InwardChallans
            currentWorkshop={currentWorkshop}
            onViewChallan={handleViewChallan}
            initialOpenCreate={inwardOpenCreate}
            onActionComplete={handleActionComplete}
          />
        )}

        {activeTab === 'outward' && (
          <OutwardChallans
            currentWorkshop={currentWorkshop}
            onViewChallan={handleViewChallan}
            initialOpenCreate={outwardOpenCreate}
            prefillData={prefillOutward}
            onActionComplete={handleActionComplete}
          />
        )}

        {activeTab === 'parties' && (
          <Parties onActionComplete={handleActionComplete} />
        )}

        {activeTab === 'parts' && (
          <Parts onActionComplete={handleActionComplete} />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-700">
              {currentWorkshop === 'gayatri' ? 'Gayatri Industries' : 'Siddhivinayak CNC Workshop'}
            </span> • Delivery Challan & Inventory System
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Frontend: React 19 + Tailwind CSS</span>
            <span>•</span>
            <span>Backend: PHP 8 + MySQL PDO</span>
          </div>
        </div>
      </footer>

      {/* Printable Challan Modal */}
      {printingChallan && (
        <ChallanPrintModal
          challan={printingChallan.data}
          type={printingChallan.type}
          workshop={printingChallan.data?.workshop || currentWorkshop}
          onClose={() => setPrintingChallan(null)}
        />
      )}

    </div>
  );
}
