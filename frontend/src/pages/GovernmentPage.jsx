import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Globe2, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2,
  RefreshCw, Building2, ExternalLink, Database, Cpu, ArrowLeft,
  Server, Shield
} from 'lucide-react';

export default function GovernmentPage() {
  const { selectedBidderId, selectedTenderId, showToast, setActiveView } = useApp();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGovtData = async () => {
    setLoading(true);
    try {
      const res = await api.getGovernmentVerifications(selectedBidderId);
      setRecords(res.verifications || []);
    } catch (err) {
      showToast('Error loading statutory verification records', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovtData();
  }, [selectedBidderId]);

  const handleVerifyAll = async () => {
    try {
      showToast('Querying all 10 statutory API adapters...', 'info');
      const res = await api.verifyAllGovernment(selectedBidderId, selectedTenderId);
      setRecords(res.verifications || []);
      showToast('All statutory integration feeds synchronized', 'success');
    } catch (err) {
      showToast(err.message, 'critical');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>Bidder Ref: {selectedBidderId}</span>
            <span>•</span>
            <span>Statutory Verification Gateways</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            National Statutory API Integration Gateway
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Modular enterprise adapter connectors interfacing with national regulatory databases for automated sovereign cross-verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('bidder-detail')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bidder Dossier</span>
          </button>

          <button
            onClick={handleVerifyAll}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Synchronize All 10 Adapters</span>
          </button>
        </div>
      </div>

      {/* Official Transparent Simulated Government Data Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 font-bold tracking-wider text-amber-400">
            <Globe2 className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase">
              SIMULATED GOVERNMENT DATA — ENTERPRISE DECISION-SUPPORT GATEWAY
            </span>
          </div>
          <p className="text-slate-300 text-[11.5px] leading-relaxed">
            Statutory verifications are performed through enterprise sandbox connectors mirroring live schemas. In production environments, credentials securely bind to Sovereign API Gateways (API Setu / GSTN GSP / MCA21 V3 / EPFO Unified Portal).
          </p>
        </div>
        <span className="shrink-0 px-3 py-1 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700 flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>10 Adapters Online</span>
        </span>
      </div>

      {/* Grid of 10 Adapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {records.map((r) => (
          <div key={r.provider} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono font-bold text-blue-900 text-xs tabular-nums">{r.provider}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{r.provider_name}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                r.status === 'VERIFIED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : r.status === 'FAILED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : r.status === 'WARNING'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {r.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-medium text-[10.5px]">Query Identifier:</span>
                <span className="font-bold text-slate-800 tabular-nums">{r.query_key}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans font-medium text-[10.5px]">Submitted Parameter:</span>
                <span className="font-bold text-blue-900 truncate max-w-[240px] tabular-nums">{r.query_value}</span>
              </div>
            </div>

            {r.discrepancies && r.discrepancies.length > 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11.5px] space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800">
                  STATUTORY DISCREPANCIES DETECTED:
                </span>
                {r.discrepancies.map((d, i) => (
                  <p key={i}>• {d}</p>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-700 text-[11px] font-medium bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Statutory registry verified consistent with tender submission.</span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-1 tabular-nums">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">{r.simulated_label}</span>
              <span>{r.timestamp?.slice(0, 19).replace('T', ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
