import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Users, Search, Filter, ShieldCheck, AlertTriangle, AlertOctagon,
  CheckCircle2, RefreshCw, GitCompare, Play, Plus, ExternalLink,
  Building2, MapPin, Tag, ArrowUpDown, Download, Check, ChevronLeft,
  ChevronRight, ArrowUp, ArrowDown
} from 'lucide-react';

export default function BiddersPage() {
  const {
    selectedTenderId, navigateToBidder, setActiveView,
    setComparedBidderIds, showToast, getBusinessFinding, tenders,
    setSelectedTenderId
  } = useApp();

  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tenderFilter, setTenderFilter] = useState('ALL');
  const [findingFilter, setFindingFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Sorting State
  const [sortField, setSortField] = useState('bidder_id'); // 'bidder_id' | 'company_name' | 'compliance_score' | 'risk_level'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const loadBidders = async () => {
    setLoading(true);
    try {
      const data = await api.getBidders({
        tender_id: tenderFilter === 'ALL' ? undefined : tenderFilter,
        scenario_tag: findingFilter || undefined,
        risk_level: riskFilter || undefined,
        verification_status: statusFilter || undefined,
        search: search || undefined,
        limit: 200
      });
      setBidders(data);
      setCurrentPage(1);
    } catch (err) {
      showToast('Error loading bidders', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBidders();
  }, [tenderFilter, findingFilter, riskFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadBidders();
  };

  const toggleSelectBidder = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      showToast('Please select at least 2 bidders to compare', 'warning');
      return;
    }
    setComparedBidderIds(selectedIds);
    setActiveView('comparison');
  };

  const handleQuickRun = async (bidderId, tenderId, e) => {
    e.stopPropagation();
    try {
      showToast(`Running deterministic compliance verification for ${bidderId}...`, 'info');
      await api.runCompliance(bidderId, tenderId || selectedTenderId);
      showToast(`Verification completed for ${bidderId}`, 'success');
      loadBidders();
    } catch (err) {
      showToast(`Verification error: ${err.message}`, 'critical');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted and Paginated Bidders
  const sortedBidders = useMemo(() => {
    const list = [...bidders];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'risk_level') {
        const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        valA = order[valA] ?? 99;
        valB = order[valB] ?? 99;
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return sortDirection === 'asc' ? (valA - valB) : (valB - valA);
    });
    return list;
  }, [bidders, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedBidders.length / pageSize) || 1;
  const paginatedBidders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBidders.slice(start, start + pageSize);
  }, [sortedBidders, currentPage, pageSize]);

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">MEDIUM</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">UNRANKED</span>;
    }
  };

  const renderFindingBadge = (tag) => {
    const finding = getBusinessFinding(tag);
    let colorClass = 'bg-slate-50 text-slate-700 border-slate-200';
    if (finding.severity === 'CRITICAL') {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    } else if (finding.severity === 'HIGH') {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    } else if (finding.severity === 'MEDIUM') {
      colorClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else if (finding.severity === 'CLEAN' || finding.severity === 'LOW') {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
    } else if (finding.severity === 'INFO') {
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    }
    return (
      <span
        title={finding.description}
        className={`inline-block px-2 py-0.5 rounded text-[10px] border ${colorClass} truncate max-w-[140px]`}
      >
        {finding.title}
      </span>
    );
  };

  const handleRowClick = (bidder) => {
    const tId = (bidder.tender_ids && bidder.tender_ids[0]) || selectedTenderId;
    if (tId && setSelectedTenderId) {
      setSelectedTenderId(tId);
    }
    navigateToBidder(bidder.bidder_id, tId);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>Procurement Master Registry</span>
            <span>•</span>
            <span className="font-mono tabular-nums">{bidders.length} Bidders Registered</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Bidder Evaluation Registry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional master list of registered suppliers, statutory credentials, transparent compliance scores, and deterministic risk rankings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleCompare}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Compare Selected ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={loadBidders}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
            title="Refresh Bidder Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search company name, Bidder ID (BID-001), GSTIN, PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {/* Tender Filter */}
            <select
              value={tenderFilter}
              onChange={(e) => setTenderFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 font-semibold"
            >
              <option value="ALL">All CPCL Tenders (All 74 Bidders)</option>
              {tenders.map((t) => (
                <option key={t.tender_id} value={t.tender_id}>
                  {t.tender_id} ({t.bidders_count || 8} Bids)
                </option>
              ))}
            </select>

            {/* Finding Filter */}
            <select
              value={findingFilter}
              onChange={(e) => setFindingFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
            >
              <option value="">All Statutory Findings</option>
              <option value="clean">Clean / Fully Compliant</option>
              <option value="blacklisted">Debarment / GeM Incident Notice</option>
              <option value="gst_lapse">GSTR-3B Filing Lapse</option>
              <option value="udyam_expired">Legacy MSME / Udyam Invalidation</option>
              <option value="low_local_content">Non-Compliant Local Content (&lt;50%)</option>
              <option value="pan_206ab">Section 206AB Non-Filer Status</option>
              <option value="mca_strikeoff">RoC Strike-off Proceedings</option>
              <option value="epfo_esic_arrears">EPFO / ESIC Contribution Arrears</option>
              <option value="startup_recognized">DPIIT Recognized Startup</option>
              <option value="nsic_registered">NSIC Registered Enterprise</option>
            </select>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
            >
              <option value="">All Risk Tiers</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="REQUIRES_REVIEW">Requires Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="OFFICER_REVIEWED">Officer Reviewed</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {/* Bidders Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10.5px] tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === paginatedBidders.length && paginatedBidders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(paginatedBidders.map((b) => b.bidder_id));
                      else setSelectedIds([]);
                    }}
                    className="rounded border-slate-300"
                  />
                </th>
                <th
                  onClick={() => handleSort('bidder_id')}
                  className="p-3.5 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Bidder ID & Company</span>
                    {sortField === 'bidder_id' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                <th className="p-3.5">State & Sector</th>
                <th className="p-3.5">GST Status</th>
                <th className="p-3.5">Udyam Status</th>
                <th
                  onClick={() => handleSort('compliance_score')}
                  className="p-3.5 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Score</span>
                    {sortField === 'compliance_score' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('risk_level')}
                  className="p-3.5 text-center cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Risk Level</span>
                    {sortField === 'risk_level' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                <th className="p-3.5 text-center">Verification Status</th>
                <th className="p-3.5">Last Verified / Finding</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    Retrieving statutory compliance master data...
                  </td>
                </tr>
              ) : paginatedBidders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-slate-400">
                    No bidders match the specified criteria.
                  </td>
                </tr>
              ) : (
                paginatedBidders.map((b) => {
                  const isChecked = selectedIds.includes(b.bidder_id);
                  const tId = (b.tender_ids && b.tender_ids[0]) || selectedTenderId;
                  return (
                    <tr
                      key={b.bidder_id}
                      onClick={() => handleRowClick(b)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectBidder(b.bidder_id)}
                          className="rounded border-slate-300"
                        />
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono font-bold text-blue-900 text-[12px] tabular-nums">{b.bidder_id}</div>
                        <div className="font-semibold text-slate-900 truncate max-w-xs">{b.company_name}</div>
                        <div className="text-[10.5px] text-slate-400 font-mono tabular-nums">
                          GSTIN: {b.gstin || 'N/A'} • PAN: {b.pan || 'N/A'}
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        <div className="font-medium text-slate-800">{b.state}</div>
                        <div className="text-[11px] text-slate-500">{b.sector}</div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          b.gst_status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {b.gst_status || 'Active'}
                        </span>
                        <span className="block text-[9.5px] text-slate-400 font-mono mt-0.5 tabular-nums">
                          {b.gst_last_return_filed || '2026-08-25'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          (b.udyam_status || '').toLowerCase().includes('active')
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {b.udyam_status || 'Active'}
                        </span>
                        <span className="block text-[9.5px] text-slate-400 font-mono mt-0.5 truncate max-w-[110px]">
                          {b.udyam_number || 'N/A'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        {b.compliance_score !== null && b.compliance_score !== undefined ? (
                          <span className={`font-mono font-bold text-[12px] tabular-nums ${
                            b.compliance_score >= 85 ? 'text-emerald-700' : (b.compliance_score >= 60 ? 'text-amber-700' : 'text-rose-700')
                          }`}>
                            {b.compliance_score}%
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Pending</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {getRiskBadge(b.risk_level)}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          b.verification_status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : b.verification_status === 'REQUIRES_REVIEW'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {b.verification_status || 'IN_PROGRESS'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {renderFindingBadge(b.scenario_tag)}
                      </td>

                      <td className="p-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleQuickRun(b.bidder_id, tId, e)}
                          title="Execute Deterministic Compliance Engine"
                          className="p-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRowClick(b)}
                          className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-[11px] transition-colors"
                        >
                          Verify Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Showing</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              {sortedBidders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>
            <span>to</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              {Math.min(currentPage * pageSize, sortedBidders.length)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              {sortedBidders.length}
            </span>
            <span>bidders</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-slate-300 rounded bg-white text-xs font-semibold"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-slate-800 tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
