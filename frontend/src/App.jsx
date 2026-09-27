import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ExplainabilityDrawer from './components/ExplainabilityDrawer';
import GlobalSearchModal from './components/GlobalSearchModal';
import Toast from './components/Toast';

import DashboardPage from './pages/DashboardPage';
import TendersPage from './pages/TendersPage';
import BiddersPage from './pages/BiddersPage';
import BidderDetailPage from './pages/BidderDetailPage';
import VerificationQueuePage from './pages/VerificationQueuePage';
import CompliancePage from './pages/CompliancePage';
import RiskMonitorPage from './pages/RiskMonitorPage';
import DocumentsPage from './pages/DocumentsPage';
import GovernmentPage from './pages/GovernmentPage';
import ComparisonPage from './pages/ComparisonPage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

function MainLayout() {
  const { activeView } = useApp();

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tenders':
        return <TendersPage />;
      case 'bidders':
        return <BiddersPage />;
      case 'bidder-detail':
        return <BidderDetailPage />;
      case 'queue':
        return <VerificationQueuePage />;
      case 'compliance':
        return <CompliancePage />;
      case 'risk':
        return <RiskMonitorPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'government':
        return <GovernmentPage />;
      case 'comparison':
        return <ComparisonPage />;
      case 'audit':
        return <AuditPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-slate-100">
          {renderActiveView()}
        </main>
      </div>

      <ExplainabilityDrawer />
      <GlobalSearchModal />
      <Toast />

      {/* Official Government Bottom Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-3 px-6 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2 print:hidden z-30">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-slate-200">GeM Sentinel AI v2.0</span>
          <span>•</span>
          <span>Chennai Petroleum Corporation Limited (CPCL)</span>
          <span>•</span>
          <span>Ministry of Petroleum & Natural Gas</span>
        </div>
        <div className="text-slate-500 font-mono text-[10.5px]">
          Smart Automation Theme | Problem Statement 26100 | Smart India Hackathon
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
