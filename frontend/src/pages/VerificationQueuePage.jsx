import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  ClipboardCheck, AlertTriangle, AlertOctagon, CheckCircle2,
  ArrowRight, RefreshCw, Send, ShieldAlert, FileText, Filter,
  Building2, MapPin, Scale, Search
} from 'lucide-react';

export default function VerificationQueuePage() {
  const { selectedTenderId, navigateToBidder, showToast, tenders, setSelectedTenderId } = useApp();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [tenderFilter, setTenderFilter] = useState(selectedTenderId || 'ALL');
  const [search, setSearch] = useState('');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getVerificationQueue({
        tender_id: tenderFilter === 'ALL' ? undefined : tenderFilter,
        priority: severityFilter || undefined
      });
      setQueue(data);
    } catch (err) {
      showToast('Error loading verification queue', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [tenderFilter, severityFilter]);

  const filteredQueue = queue.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.bidder_id?.toLowerCase().includes(q) ||
      item.company_name?.toLowerCase().includes(q) ||
      item.issue?.toLowerCase().includes(q) ||
      item.tender_id?.toLowerCase().includes(q)
    );
  });

  const criticalCount = queue.filter(b => b.priority === 'CRITICAL').length;
  const highCount = queue.filter(b => b.priority === 'HIGH').length;
  const mediumCount = queue.filter(b => b.priority === 'MEDIUM').length;
  const pendingCount = queue.filter(b => !b.status || b.status === 'PENDING').length;
  const resolvedCount = queue.length - pendingCount;

  const handleExamine = (bidderId, tenderId) => {
    if (tenderId && setSelectedTenderId) {
      setSelectedTenderId(tenderId);
    }
    navigateToBidder(bidderId, tenderId);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
            <span>Statutory Exception Triage</span>
            <span>•</span>
            <span>Human-in-the-Loop Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Procurement Officer Verification Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Prioritized exception queue of bids flagged with statutory discrepancies, requiring sovereign officer examination and determination.
          </p>
        </div>

        <button
          onClick={fetchQueue}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Urgency Summary Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div
          onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? '' : 'CRITICAL')}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition-all ${
            severityFilter === 'CRITICAL' ? 'border-rose-500 ring-2 ring-rose-500 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-rose-800">Critical Disqualifications</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-rose-700 font-mono tabular-nums">{criticalCount}</span>
            <span className="text-[11px] text-slate-500">Immediate action</span>
          </div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? '' : 'HIGH')}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition-all ${
            severityFilter === 'HIGH' ? 'border-amber-500 ring-2 ring-amber-500 bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-amber-800">Clarifications Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-700 font-mono tabular-nums">{highCount}</span>
            <span className="text-[11px] text-slate-500">High priority</span>
          </div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? '' : 'MEDIUM')}
          className={`p-4 bg-white border rounded-xl shadow-xs cursor-pointer transition-all ${
            severityFilter === 'MEDIUM' ? 'border-yellow-500 ring-2 ring-yellow-500 bg-yellow-50/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-yellow-800">Important Notices</span>
            <ShieldAlert className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-yellow-700 font-mono tabular-nums">{mediumCount}</span>
            <span className="text-[11px] text-slate-500">Officer discretion</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-emerald-800">Determinations Signed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">{resolvedCount}</span>
            <span className="text-[11px] text-slate-500">Of {queue.length} total</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search priority queue by Bidder ID, Company name, Issue, or Tender Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-600"
          />
        </div>

        {/* Tender Filter */}
        <select
          value={tenderFilter}
          onChange={(e) => setTenderFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
        >
          <option value="ALL">All CPCL Tenders</option>
          {tenders.map((t) => (
            <option key={t.tender_id} value={t.tender_id}>
              {t.tender_id} — {t.tender_title?.slice(0, 32)}...
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Urgency Levels ({queue.length})</option>
          <option value="CRITICAL">Critical Disqualifications ({criticalCount})</option>
          <option value="HIGH">High Priority ({highCount})</option>
          <option value="MEDIUM">Medium / Notices ({mediumCount})</option>
        </select>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="p-3.5 text-center w-24">Priority</th>
                <th className="p-3.5">Bidder & Supplier</th>
                <th className="p-3.5">Tender Ref</th>
                <th className="p-3.5">Statutory Issue & Finding</th>
                <th className="p-3.5">Regulatory Authority</th>
                <th className="p-3.5 text-right">Score</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    Loading prioritized compliance verification queue...
                  </td>
                </tr>
              ) : filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400">
                    No items in queue match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr
                    key={item.queue_id || item.bidder_id}
                    onClick={() => handleExamine(item.bidder_id, item.tender_id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider inline-block ${
                        item.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : item.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}>
                        {item.priority}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-900 tabular-nums text-[12px]">{item.bidder_id}</div>
                      <div className="font-semibold text-slate-900 truncate max-w-xs">{item.company_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.state} • {item.sector}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px] tabular-nums">
                        {item.tender_id}
                      </span>
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <div className="font-semibold text-slate-800 leading-snug">
                        {item.issue}
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs text-slate-600 font-medium">
                      <div className="text-[11px] leading-tight text-slate-500 font-mono">
                        {item.requirement}
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.compliance_score || 0}%
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.status === 'QUALIFIED_RECOMMENDED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'DISQUALIFIED_RECOMMENDED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : item.status === 'CLARIFICATION_REQUESTED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {item.status || 'PENDING'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleExamine(item.bidder_id, item.tender_id)}
                        className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-[11px] transition-colors inline-flex items-center space-x-1 shadow-xs"
                      >
                        <span>Examine Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
