import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, FolderKanban, Users, ClipboardCheck,
  Scale, AlertOctagon, FileText, Globe2, GitCompare,
  History, FileSpreadsheet, Settings, ShieldAlert,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const {
    activeView, setActiveView, isSidebarCollapsed, setIsSidebarCollapsed
  } = useApp();

  const navigationGroups = [
    {
      group: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, badge: null },
        { id: 'tenders', label: 'Tenders', icon: FolderKanban, badge: '7' },
        { id: 'bidders', label: 'Bidders Registry', icon: Users, badge: '74' },
        { id: 'queue', label: 'Verification Queue', icon: ClipboardCheck, badge: '18 Action', badgeColor: 'bg-amber-500/20 text-amber-300' },
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { id: 'compliance', label: 'Compliance Rules', icon: Scale, badge: 'Deterministic' },
        { id: 'risk', label: 'Risk Monitor & Watchlist', icon: AlertOctagon, badge: 'Live', badgeColor: 'bg-rose-500/20 text-rose-300' },
        { id: 'documents', label: 'Document Intelligence', icon: FileText, badge: 'OCR' },
        { id: 'government', label: 'Statutory Gateways', icon: Globe2, badge: '10 Mocks' },
        { id: 'comparison', label: 'Multi-Bidder Matrix', icon: GitCompare, badge: null },
      ]
    },
    {
      group: 'GOVERNANCE',
      items: [
        { id: 'audit', label: 'Audit Trail (C&AG)', icon: History, badge: null },
        { id: 'reports', label: 'Advisory Reports', icon: FileSpreadsheet, badge: 'Dossier' },
        { id: 'settings', label: 'System Configuration', icon: Settings, badge: null },
      ]
    }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 select-none transition-all duration-200 ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header Context / Collapse Toggle */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        {!isSidebarCollapsed && (
          <div className="overflow-hidden">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              CPCL PROCUREMENT DIVISION
            </span>
            <span className="text-xs text-slate-200 font-semibold truncate block">
              Refinery Materials Portal
            </span>
          </div>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors ml-auto"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {navigationGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            {!isSidebarCollapsed && (
              <div className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                {grp.group}
              </div>
            )}
            {grp.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id || (activeView === 'bidder-detail' && item.id === 'bidders');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-medium shrink-0 ml-1.5 ${
                        item.badgeColor || (isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Restrained Institutional Human-in-the-Loop Footer Notice */}
      {!isSidebarCollapsed && (
        <div className="p-3 m-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90 text-[10.5px] text-slate-400 leading-normal">
          <div className="flex items-center space-x-1 text-slate-300 font-semibold mb-0.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider font-bold">Decision Support Policy</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Deterministic rule engine. Final qualification decisions remain with the designated Procurement Officer under GFR Rule 144.
          </p>
        </div>
      )}
    </aside>
  );
}
