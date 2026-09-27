import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Shield, Bell, Search, User, ChevronDown, CheckCircle2,
  AlertTriangle, Cpu, Database, Building2, ExternalLink,
  ChevronRight, Command, Sparkles
} from 'lucide-react';

export default function Navbar() {
  const {
    activeView, setActiveView, selectedBidderId, selectedTenderId, setSelectedTenderId,
    tenders, systemStatus, currentUser, notifications, setIsSearchOpen
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic breadcrumb mapping
  const getBreadcrumbs = () => {
    const crumbs = [{ label: 'Operations', view: 'dashboard' }];
    switch (activeView) {
      case 'dashboard':
        crumbs.push({ label: 'Command Center', view: 'dashboard' });
        break;
      case 'tenders':
        crumbs.push({ label: 'Tenders', view: 'tenders' });
        break;
      case 'bidders':
        crumbs.push({ label: 'Bidders Registry', view: 'bidders' });
        break;
      case 'bidder-detail':
        crumbs.push({ label: 'Bidders', view: 'bidders' });
        crumbs.push({ label: selectedBidderId, view: 'bidder-detail' });
        break;
      case 'queue':
        crumbs.push({ label: 'Verification Queue', view: 'queue' });
        break;
      case 'compliance':
        crumbs.push({ label: 'Compliance Rules Engine', view: 'compliance' });
        break;
      case 'risk':
        crumbs.push({ label: 'Risk Monitor & Watchlist', view: 'risk' });
        break;
      case 'documents':
        crumbs.push({ label: 'Document Intelligence', view: 'documents' });
        break;
      case 'government':
        crumbs.push({ label: 'Statutory Verification Gateways', view: 'government' });
        break;
      case 'comparison':
        crumbs.push({ label: 'Multi-Bidder Comparison', view: 'comparison' });
        break;
      case 'audit':
        crumbs.push({ label: 'Audit Trail', view: 'audit' });
        break;
      case 'reports':
        crumbs.push({ label: 'Advisory Reports', view: 'reports' });
        break;
      case 'settings':
        crumbs.push({ label: 'System Configuration', view: 'settings' });
        break;
      default:
        crumbs.push({ label: 'Workspace', view: 'dashboard' });
    }
    return crumbs;
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xs select-none">
      {/* Institutional Top Identity Ribbon */}
      <div className="bg-slate-950 px-5 py-1 text-[11px] text-slate-400 flex flex-wrap justify-between items-center border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-amber-400 tracking-wider">भारत सरकार | GOVERNMENT OF INDIA</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-300">Ministry of Petroleum & Natural Gas</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-200 font-medium">Chennai Petroleum Corporation Limited (CPCL)</span>
        </div>

        <div className="flex items-center space-x-3 text-[10.5px]">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
            CPCL REFINERY COMPLIANCE GATEWAY
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold tracking-wide">
            SIMULATED GOVERNMENT DATA
          </span>
        </div>
      </div>

      {/* Main Operational Top Bar */}
      <div className="px-5 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center space-x-4 min-w-0">
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveView('dashboard')}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-700 border border-blue-500/30 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-bold tracking-tight text-white font-mono">GeM Sentinel AI</span>
              </div>
              <p className="text-[10.5px] text-slate-400 -mt-0.5">Bid Compliance & Verification Intelligence</p>
            </div>
          </div>

          {/* Breadcrumb Trail */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 border-l border-slate-800 pl-4 py-0.5">
            {getBreadcrumbs().map((crumb, idx, arr) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                <button
                  onClick={() => setActiveView(crumb.view)}
                  className={`hover:text-slate-200 transition-colors ${
                    idx === arr.length - 1 ? 'text-slate-200 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Center: Global Search Trigger Button */}
        <div className="hidden md:flex flex-1 max-w-xs">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all shadow-xs"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search bidders, tenders, GSTIN...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Tender Context, Status & Profile */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Quick Tender Context Dropdown */}
          <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={selectedTenderId || ''}
              onChange={(e) => setSelectedTenderId(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer truncate max-w-[200px] text-xs font-medium"
            >
              {tenders.map((t) => (
                <option key={t.tender_id} value={t.tender_id} className="bg-slate-900 text-slate-200">
                  {t.tender_id}
                </option>
              ))}
            </select>
          </div>

          {/* API Gateway Status Badge */}
          <div
            onClick={() => setActiveView('settings')}
            className="cursor-pointer hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs transition-colors"
            title="Click to configure API Gateway & Cloud Coordinates"
          >
            <span className={`w-2 h-2 rounded-full ${systemStatus ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className="text-slate-400 text-[11px]">API:</span>
            <span className="font-semibold text-slate-200 text-[11px]">
              {systemStatus ? 'ONLINE' : 'CONNECTING'}
            </span>
          </div>

          {/* AI Engine Status Badge */}
          <div
            onClick={() => setActiveView('settings')}
            className="cursor-pointer hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs transition-colors"
            title="Click to view AI Engine mode"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 text-[11px]">AI:</span>
            <span className="font-semibold text-indigo-300 uppercase text-[11px]">
              {systemStatus?.ai_engine?.mode || 'MOCK'}
            </span>
          </div>

          {/* Notifications Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white relative transition-colors"
              title="Operational Alerts"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9.5px] flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-200">Operational Notifications</span>
                  <span className="text-[10px] text-slate-400">{notifications.length} Unresolved</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-semibold text-[11px] ${n.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                          {n.title}
                        </span>
                        <span className="text-[9.5px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Officer Profile Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
              RK
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight">Rajesh Kumar</div>
              <div className="text-[10px] text-slate-400">Sr. Procurement Officer</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
