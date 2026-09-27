import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AppContext = createContext();

export const BUSINESS_FINDINGS_MAP = {
  clean: {
    label: 'Statutory Cleared',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'All statutory credentials and declarations verified consistent with national registries.'
  },
  gst_lapse: {
    label: 'GSTR-3B Filing Lapse',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Tax return filing elapsed beyond permissible grace window (ITC risk flagged).'
  },
  blacklisted: {
    label: 'Debarred / Watchlist Flag',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Entity actively listed on GeM Incident Management or CPSE debarment register.'
  },
  pan_206ab: {
    label: 'Sec 206AB Non-Filer Withholding',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Specified person under Section 206AB; higher rate of TDS surcharge applicable if awarded.'
  },
  low_local_content: {
    label: 'MII Local Content Shortfall',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Declared domestic value addition falls below minimum tender threshold.'
  },
  udyam_expired: {
    label: 'Legacy EM-II / Unmigrated MSME',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Legacy MSME certificate expired without mandatory Udyam migration.'
  },
  epfo_esic_arrears: {
    label: 'Labor Contribution Arrears',
    badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    description: 'Section 7A or 45A contribution recovery proceeding active in statutory portal.'
  },
  startup_recognized: {
    label: 'DPIIT Recognized Startup',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Eligible for prior experience and turnover relaxation where tender permits.'
  },
  mca_strikeoff: {
    label: 'RoC Strike-off Proceedings',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Registrar of Companies notice active under Section 248 of Companies Act 2013.'
  },
  nsic_registered: {
    label: 'NSIC Single Point Registered',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    description: 'Eligible for tender set free of cost and EMD exemption under SPRS scheme.'
  }
};

export function getBusinessFinding(tag) {
  return BUSINESS_FINDINGS_MAP[tag] || {
    label: tag ? tag.replace(/_/g, ' ').toUpperCase() : 'General Review',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    description: 'Standard procurement compliance scrutiny applicable.'
  };
}

export function AppProvider({ children }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedBidderId, setSelectedBidderId] = useState('BID-001');
  const [selectedTenderId, setSelectedTenderId] = useState('GEM/2026/B/894210');
  
  const [tenders, setTenders] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    username: 'officer_cpcl',
    full_name: 'Rajesh Kumar',
    designation: 'Senior Procurement Officer',
    department: 'Chennai Petroleum Corporation Limited (CPCL)',
    role: 'PROCUREMENT_OFFICER'
  });

  // Shell Layout States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Explainability Drawer State
  const [explainData, setExplainData] = useState(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);

  // Multi-Bidder Comparison State
  const [comparedBidderIds, setComparedBidderIds] = useState(['BID-001', 'BID-002', 'BID-003', 'BID-004']);

  // Notifications / Toast
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Compliance Discrepancy', message: 'BID-001 Make in India local content affidavit declared at 28.7% (below 50% tender requirement).', time: '12m ago', type: 'critical' },
    { id: 2, title: 'Watchlist Flag', message: 'BID-014 actively flagged on GeM Incident Management debarment roster.', time: '28m ago', type: 'critical' },
    { id: 3, title: 'Tax Compliance Notice', message: 'BID-003 GSTR-3B tax return filing elapsed beyond 60-day threshold.', time: '1h ago', type: 'warning' },
    { id: 4, title: 'Master Registry Synchronized', message: 'All 74 participating bidders indexed against CPCL Manali & Cauvery Basin tenders.', time: '2h ago', type: 'info' }
  ]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const refreshSystem = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
      const tenderList = await api.getTenders();
      setTenders(tenderList);
      if (tenderList.length > 0 && !selectedTenderId) {
        setSelectedTenderId(tenderList[0].tender_id);
      }
    } catch (err) {
      console.error('Error fetching initial app data:', err);
    }
  };

  useEffect(() => {
    refreshSystem();
  }, []);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to toggle Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsExplainOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openExplainDrawer = async (bidderId, ruleId) => {
    setIsExplainOpen(true);
    setExplainLoading(true);
    try {
      const res = await api.explainRule(bidderId, ruleId, selectedTenderId);
      setExplainData(res);
    } catch (err) {
      console.error('Error fetching explanation:', err);
      setExplainData({
        title: 'Rule Determination Analysis',
        detected_state: 'Evidentiary citations unavailable.',
        recommendation_action: 'Proceed with manual document portfolio examination.'
      });
    } finally {
      setExplainLoading(false);
    }
  };

  const closeExplainDrawer = () => {
    setIsExplainOpen(false);
    setExplainData(null);
  };

  const navigateToBidder = (bidderId, tenderId = null) => {
    setSelectedBidderId(bidderId);
    if (tenderId) setSelectedTenderId(tenderId);
    setActiveView('bidder-detail');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedBidderId,
        setSelectedBidderId,
        selectedTenderId,
        setSelectedTenderId,
        tenders,
        setTenders,
        systemStatus,
        setSystemStatus,
        currentUser,
        setCurrentUser,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isSearchOpen,
        setIsSearchOpen,
        explainData,
        isExplainOpen,
        explainLoading,
        openExplainDrawer,
        closeExplainDrawer,
        comparedBidderIds,
        setComparedBidderIds,
        notifications,
        toast,
        showToast,
        refreshSystem,
        navigateToBidder,
        getBusinessFinding
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
