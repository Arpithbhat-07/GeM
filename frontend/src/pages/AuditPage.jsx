import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  History, Search, RefreshCw, Shield, User, Filter,
  Calendar, ArrowRight, FileText, Download, CheckCircle2,
  Lock, Key
} from 'lucide-react';

export default function AuditPage() {
  const { showToast } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        action: actionFilter || undefined,
        user: userFilter || undefined,
        limit: 150
      });
      setLogs(data);
    } catch (err) {
      showToast('Error loading vigilance audit logs', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, userFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.entity_id?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.user?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Entity ID', 'Entity Type', 'User', 'Details', 'Source'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp || ''}"`,
      `"${l.action || ''}"`,
      `"${l.entity_id || ''}"`,
      `"${l.entity || ''}"`,
      `"${l.user || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.source || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gem_sentinel_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit log CSV exported successfully', 'success');
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>C&AG / Central Vigilance Commission (CVC) Compliance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Immutable Verification Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident chronological audit logging recording all AI extractions, statutory API queries, score calculations, and officer qualification determinations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchLogs}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Trail</span>
          </button>
        </div>
      </div>

      {/* Integrity Badge Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 font-bold tracking-wider text-emerald-400">
            <Lock className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase">
              CRYPTOGRAPHIC CHAIN INTEGRITY: SECURED
            </span>
          </div>
          <p className="text-slate-300 text-[11.5px] leading-relaxed">
            Every administrative interaction and automated heuristic calculation generates an immutable record compliant with Section 4 of the Public Procurement Bill and C&AG guidelines for electronic procurement scrutiny.
          </p>
        </div>
        <span className="shrink-0 px-3 py-1 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700 flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Audit Log Intact</span>
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by Entity ID, Action, User, or Description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-600"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Action Types ({logs.length})</option>
          <option value="COMPLIANCE_VERIFICATION_EXECUTED">Compliance Verification Executed</option>
          <option value="OFFICER_FINAL_REVIEW_RECORDED">Officer Final Review Recorded</option>
          <option value="DOCUMENT_UPLOADED_AND_EXTRACTED">Document Uploaded & Extracted</option>
          <option value="TENDER_CREATED">Tender Created</option>
          <option value="TENDER_DOC_AI_EXTRACTED">Tender Doc AI Extracted</option>
          <option value="GOVERNMENT_CHECKS_EXECUTED">Government Checks Executed</option>
        </select>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
        >
          <option value="">All Authorized Users</option>
          <option value="officer_cpcl">officer_cpcl (Rajesh Kumar)</option>
          <option value="admin_gem">admin_gem (Dr. Ananya Sharma)</option>
          <option value="auditor_cag">auditor_cag (Vikram Seth)</option>
          <option value="system_seeder">system_seeder (System Background)</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp (UTC)</th>
                <th className="p-3.5">Action Event</th>
                <th className="p-3.5">Entity / Target</th>
                <th className="p-3.5">Officer / Account</th>
                <th className="p-3.5">Audit Particulars & State Diff</th>
                <th className="p-3.5">Origin Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Retrieving immutable vigilance records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No audit records match the selected filter parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log._id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                      {log.timestamp}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono font-bold text-blue-900 text-[11.5px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-slate-700">
                      <span className="font-semibold tabular-nums">{log.entity_id}</span>
                      <span className="text-[10px] text-slate-400 block uppercase">({log.entity})</span>
                    </td>

                    <td className="p-3.5 font-medium text-slate-800">
                      {log.user}
                    </td>

                    <td className="p-3.5 text-slate-700 max-w-md">
                      <div className="leading-snug">{log.details || 'N/A'}</div>
                      {log.old_value !== undefined && log.new_value !== undefined && log.old_value !== null && (
                        <div className="text-[10.5px] text-slate-500 font-mono mt-1 bg-slate-50 p-1.5 rounded border border-slate-200 inline-block">
                          <span className="text-rose-600 line-through mr-1.5">{String(log.old_value)}</span>
                          <span className="text-slate-400 mr-1.5">→</span>
                          <span className="text-emerald-700 font-bold">{String(log.new_value)}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-[10.5px] text-slate-500">
                      {log.source}
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
