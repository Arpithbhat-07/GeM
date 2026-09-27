import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  GitCompare, ShieldCheck, AlertTriangle, AlertOctagon,
  CheckCircle2, ArrowRight, RefreshCw, X, Scale, Plus
} from 'lucide-react';

export default function ComparisonPage() {
  const {
    comparedBidderIds, setComparedBidderIds, selectedTenderId,
    navigateToBidder, showToast, setActiveView
  } = useApp();

  const [matrixData, setMatrixData] = useState([]);
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchComparison = async () => {
    if (comparedBidderIds.length === 0) return;
    setLoading(true);
    try {
      const res = await api.compareBidders(comparedBidderIds, selectedTenderId);
      setMatrixData(res.bidders_matrix || []);
      setTender(res.tender);
    } catch (err) {
      showToast('Error loading comparative matrix', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [comparedBidderIds, selectedTenderId]);

  const removeBidderFromCompare = (bidderId) => {
    setComparedBidderIds(prev => prev.filter(id => id !== bidderId));
  };

  const getPassFailBadge = (status) => {
    if (status === 'PASS' || status === 'Active' || status === true || status === 'CLEAR') {
      return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">PASS</span>;
    }
    if (status === 'FAIL' || status === false || status === 'FLAG' || status === 'Debarred') {
      return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">FAIL</span>;
    }
    return <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">WARN</span>;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>Tender: {selectedTenderId}</span>
            <span>•</span>
            <span>Comparative Statutory Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Side-by-Side Bidder Compliance Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comparative analysis of statutory credentials, tax standing, local content declaration, and risk metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('bidders')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select More Bidders</span>
          </button>

          <button
            onClick={fetchComparison}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Matrix</span>
          </button>
        </div>
      </div>

      {/* Decision Support Advisory Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 font-bold tracking-wider text-amber-400">
            <Scale className="w-4 h-4" />
            <span className="font-mono text-[11px] uppercase">
              PROCUREMENT OFFICER DECISION SUPPORT NOTICE
            </span>
          </div>
          <p className="text-slate-300 text-[11.5px] leading-relaxed">
            The platform presents verified statutory facts for objective comparison. In strict compliance with General Financial Rules (GFR 2017) Rule 144, no automated commercial preference or tender award is conferred.
          </p>
        </div>
        <span className="shrink-0 px-3 py-1 rounded bg-slate-800 text-blue-300 font-mono text-[11px] border border-slate-700">
          GFR Rule 144 Compliant
        </span>
      </div>

      {matrixData.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 space-y-3">
          <GitCompare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No bidders currently selected for comparison.</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Navigate to the Bidder Evaluation Registry, select two or more suppliers using the checkboxes, and click "Compare Selected".
          </p>
          <button
            onClick={() => setActiveView('bidders')}
            className="mt-2 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors"
          >
            Open Bidder Registry
          </button>
        </div>
      ) : (
        /* Comparison Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-4 w-56 text-slate-600 uppercase text-[10.5px] tracking-wider">
                    EVALUATION PILLAR
                  </th>
                  {matrixData.map((b) => (
                    <th key={b.bidder_id} className="p-4 min-w-[220px] border-l border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono text-blue-900 text-[12px] font-bold tabular-nums">{b.bidder_id}</div>
                          <div className="font-bold text-slate-900 truncate max-w-[170px] text-xs mt-0.5">
                            {b.company_name}
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-normal">
                            {b.state} • {b.entity_category}
                          </div>
                        </div>
                        <button
                          onClick={() => removeBidderFromCompare(b.bidder_id)}
                          title="Remove from comparison"
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* Compliance Score */}
                <tr className="bg-slate-50/50 font-semibold">
                  <td className="p-4 text-slate-900 font-bold">Compliance Score (0-100)</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100 font-mono text-base font-extrabold text-blue-900 tabular-nums">
                      {b.compliance_score} / 100
                    </td>
                  ))}
                </tr>

                {/* Risk Level */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">Risk Classification</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10.5px] ${
                        b.risk_level === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : b.risk_level === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : b.risk_level === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {b.risk_level}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* GST Status */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">GST Registration Active</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      {getPassFailBadge(b.gst_status === 'Active' ? 'PASS' : 'WARN')}
                      <span className="text-[10px] text-slate-500 block mt-0.5">{b.gst_status}</span>
                    </td>
                  ))}
                </tr>

                {/* Udyam Status */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">Udyam Registration</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      {getPassFailBadge(!b.udyam_status.includes('Expired') ? 'PASS' : 'FAIL')}
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[180px]">{b.udyam_status}</span>
                    </td>
                  ))}
                </tr>

                {/* Income Tax Section 206AB */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">PAN 206AB Compliance</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      {getPassFailBadge(b.pan_206ab_compliant ? 'PASS' : 'WARN')}
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {b.pan_206ab_compliant ? 'Filing Compliant' : 'Higher TDS Non-Filer'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* MCA Corporate Standing */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">MCA Corporate Standing</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      {getPassFailBadge(!b.mca_status.includes('Strike Off') ? 'PASS' : 'FAIL')}
                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate max-w-[180px]">{b.mca_status}</span>
                    </td>
                  ))}
                </tr>

                {/* Local Content */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">Local Content (PPP-MII)</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100 font-mono">
                      {getPassFailBadge(b.local_content_pct >= (tender?.required_local_content_pct || 50) ? 'PASS' : 'FAIL')}
                      <span className="text-[11px] font-bold block mt-0.5 tabular-nums">{b.local_content_pct}%</span>
                    </td>
                  ))}
                </tr>

                {/* Debarment Status */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">Debarment / Blacklist Standing</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      {getPassFailBadge(!b.blacklisted ? 'CLEAR' : 'FLAG')}
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {b.blacklisted ? 'Active Debarment' : 'Watchlist Clear'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Verified Documents */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">Verified Credentials</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100 font-mono font-medium tabular-nums">
                      {b.documents_count} Files on file
                    </td>
                  ))}
                </tr>

                {/* Officer Decision */}
                <tr className="bg-slate-50/50">
                  <td className="p-4 font-bold text-slate-900">Officer Determination</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      <span className="font-semibold text-slate-900 text-[11px]">
                        {b.officer_decision || 'AWAITING_REVIEW'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="p-4 font-semibold text-slate-700">Action</td>
                  {matrixData.map((b) => (
                    <td key={b.bidder_id} className="p-4 border-l border-slate-100">
                      <button
                        onClick={() => navigateToBidder(b.bidder_id, selectedTenderId)}
                        className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs flex items-center space-x-1 shadow-xs transition-colors"
                      >
                        <span>Examine Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
