import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  AlertOctagon, AlertTriangle, ShieldCheck, RefreshCw,
  ArrowRight, ShieldAlert, FileText, CheckCircle2
} from 'lucide-react';

export default function RiskMonitorPage() {
  const { selectedTenderId, navigateToBidder, showToast, getBusinessFinding } = useApp();
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRiskBidders = async () => {
    setLoading(true);
    try {
      const data = await api.getBidders({ tender_id: selectedTenderId });
      setBidders(data);
    } catch (err) {
      showToast('Error loading risk surveillance data', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskBidders();
  }, [selectedTenderId]);

  const criticalBidders = bidders.filter(b => b.risk_level === 'CRITICAL');
  const highBidders = bidders.filter(b => b.risk_level === 'HIGH');
  const mediumBidders = bidders.filter(b => b.risk_level === 'MEDIUM');
  const lowBidders = bidders.filter(b => b.risk_level === 'LOW');

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-rose-700">
            <span>Tender: {selectedTenderId}</span>
            <span>•</span>
            <span>Statutory Risk Surveillance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Compliance Risk Monitor & Watchlist
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time risk stratification based on objective statutory verification flags (Debarment, Strike-off, GSTR-3B lapse, Local Content shortfalls).
          </p>
        </div>

        <button
          onClick={fetchRiskBidders}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Watchlist</span>
        </button>
      </div>

      {/* 4 Risk Stratum Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-rose-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Critical Risk</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">{criticalBidders.length}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Debarment / RoC Strike-off</span>
        </div>

        <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">High Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">{highBidders.length}</div>
          <span className="text-[10px] text-slate-500 block mt-1">GST Lapse / MII Shortfall</span>
        </div>

        <div className="p-4 bg-white border border-yellow-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-yellow-800">Medium Risk</span>
            <ShieldAlert className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-yellow-700 tabular-nums">{mediumBidders.length}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Section 206AB / Clarifications</span>
        </div>

        <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Low Risk</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">{lowBidders.length}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Statutorily Cleared</span>
        </div>
      </div>

      {/* Critical & High Risk Watchlist */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            High & Critical Priority Watchlist ({criticalBidders.length + highBidders.length} Suppliers)
          </span>
          <span className="text-[11px] text-rose-700 font-semibold">Immediate Officer Scrutiny Required</span>
        </div>

        <div className="divide-y divide-slate-100">
          {[...criticalBidders, ...highBidders].map((b) => {
            const finding = getBusinessFinding(b.scenario_tag);
            return (
              <div
                key={b.bidder_id}
                onClick={() => navigateToBidder(b.bidder_id, selectedTenderId)}
                className="p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-blue-900 text-[12px] tabular-nums">{b.bidder_id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                      b.risk_level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {b.risk_level}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {finding.title}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{b.company_name}</h3>
                  <div className="text-slate-600 text-[11.5px] max-w-xl">
                    <p className="font-medium text-slate-800">{finding.description}</p>
                    <div className="text-[10.5px] text-slate-400 font-mono mt-0.5 tabular-nums">
                      State: {b.state} • Sector: {b.sector} • GSTIN: {b.gstin}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-5 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Compliance</span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">{b.compliance_score || 0} / 100</span>
                  </div>
                  <button
                    onClick={() => navigateToBidder(b.bidder_id, selectedTenderId)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
                  >
                    <span>Inspect Findings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
