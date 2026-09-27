import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Shield, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle,
  Play, FileText, Upload, RefreshCw, Scale, Globe2, BookOpen,
  ArrowLeft, ExternalLink, Sparkles, Building2, MapPin, Tag,
  FileCheck, Clock, Send, Eye, ShieldAlert, Cpu, Check, Layers
} from 'lucide-react';

export default function BidderDetailPage() {
  const {
    selectedBidderId, selectedTenderId, setActiveView,
    openExplainDrawer, showToast, getBusinessFinding
  } = useApp();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [demoCases, setDemoCases] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'govt' | 'docs' | 'timeline'

  // Officer Review Form
  const [reviewDecision, setReviewDecision] = useState('PENDING');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // New Document Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('OTHER');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchBidderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getBidder(selectedBidderId, selectedTenderId);
      setData(res);
      setReviewDecision(res.bidder.officer_decision || 'PENDING');
      setReviewRemarks(res.bidder.officer_remarks || '');

      const cases = await api.getDemoCases();
      setDemoCases(cases);
    } catch (err) {
      showToast('Error loading bidder compliance dossier', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBidderId) {
      fetchBidderDetail();
    }
  }, [selectedBidderId, selectedTenderId]);

  const handleRunVerification = async () => {
    setVerifying(true);
    try {
      showToast('Executing deterministic compliance pipeline...', 'info');
      await api.runCompliance(selectedBidderId, selectedTenderId);
      showToast('Verification completed and compliance score updated', 'success');
      fetchBidderDetail();
    } catch (err) {
      showToast(err.message, 'critical');
    } finally {
      setVerifying(false);
    }
  };

  const handleLoadDemoCase = async (caseKey) => {
    try {
      showToast(`Loading standard verification profile: '${caseKey}'...`, 'info');
      await api.loadDemoCase({ bidder_id: selectedBidderId, case_key: caseKey, tender_id: selectedTenderId });
      showToast('Profile documents loaded. Re-verifying compliance...', 'success');
      await api.runCompliance(selectedBidderId, selectedTenderId);
      fetchBidderDetail();
    } catch (err) {
      showToast(err.message, 'critical');
    }
  };

  const handleOfficerSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.recordOfficerReview(selectedBidderId, {
        decision: reviewDecision,
        remarks: reviewRemarks
      });
      showToast('Procurement Officer qualification determination committed to audit trail', 'success');
      fetchBidderDetail();
    } catch (err) {
      showToast(err.message, 'critical');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadingDoc(true);
    const fd = new FormData();
    fd.append('bidder_id', selectedBidderId);
    fd.append('tender_id', selectedTenderId);
    fd.append('document_type', uploadType);
    fd.append('file', uploadFile);

    try {
      await api.uploadDocument(fd);
      showToast('Document uploaded and structured OCR fields extracted', 'success');
      setUploadFile(null);
      await api.runCompliance(selectedBidderId, selectedTenderId);
      fetchBidderDetail();
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'critical');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">Loading bidder compliance dossier...</span>
        </div>
      </div>
    );
  }

  const bidder = data?.bidder || {};
  const compliance = data?.compliance_result || {};
  const checks = compliance?.checks || [];
  const scoreBreakdown = compliance?.score_breakdown || [];
  const aiRec = compliance?.ai_recommendation || {};
  const documents = data?.documents || [];
  const govtVerifs = data?.government_verifications || [];
  const auditTimeline = data?.audit_timeline || [];

  const passedChecksCount = checks.filter(c => c.status === 'PASS').length;
  const failedChecksCount = checks.filter(c => c.status === 'FAIL').length;
  const warningChecksCount = checks.filter(c => c.status === 'WARNING').length;

  const scoreVal = compliance.compliance_score !== undefined ? compliance.compliance_score : (bidder.compliance_score || 0);
  const riskVal = compliance.risk_level || bidder.risk_level || 'EVALUATING';
  const finding = getBusinessFinding(bidder.scenario_tag);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Standard Profile Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => setActiveView('bidders')}
          className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Bidder Evaluation Registry</span>
        </button>

        <div className="flex items-center space-x-3">
          {/* Pre-loaded Verification Profile Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-700" />
            <span className="font-semibold text-slate-700">Verification Profile:</span>
            <select
              onChange={(e) => {
                if (e.target.value) handleLoadDemoCase(e.target.value);
              }}
              defaultValue=""
              className="bg-transparent text-blue-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Pre-Configured Dossier...</option>
              {demoCases.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunVerification}
            disabled={verifying}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Evaluating...' : 'Re-Run Deterministic Rules'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-mono text-sm font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                {bidder.bidder_id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {bidder.entity_category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono text-slate-600 bg-slate-50 border border-slate-200">
                Tender Ref: {selectedTenderId}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {bidder.company_name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Sector: <strong className="text-slate-800">{bidder.sector}</strong></span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>State: <strong className="text-slate-800">{bidder.state}</strong></span>
              </span>
              <span>•</span>
              <span>GSTIN: <strong className="font-mono text-slate-800 tabular-nums">{bidder.gstin}</strong></span>
              <span>•</span>
              <span>PAN: <strong className="font-mono text-slate-800 tabular-nums">{bidder.pan}</strong></span>
              <span>•</span>
              <span>Audit Finding: <strong className="text-slate-800">{finding.title}</strong></span>
            </div>
          </div>

          {/* Compliance Score & Risk Badge */}
          <div className="flex items-center space-x-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
            <div className="text-center pr-4 border-r border-slate-200">
              <span className="text-[10.5px] text-slate-500 uppercase tracking-wider block font-semibold">
                Compliance Score
              </span>
              <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                <span className={`text-3xl font-extrabold font-mono tabular-nums leading-none ${
                  scoreVal >= 85
                    ? 'text-emerald-700'
                    : scoreVal >= 60
                    ? 'text-amber-600'
                    : 'text-rose-700'
                }`}>
                  {scoreVal}
                </span>
                <span className="text-xs font-mono text-slate-400 font-semibold">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Weighted Model</span>
            </div>

            <div className="text-center pl-1">
              <span className="text-[10.5px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
                Risk Classification
              </span>
              <span className={`px-3 py-1 rounded text-xs font-bold font-mono tracking-wider inline-block ${
                riskVal === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : riskVal === 'HIGH'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : riskVal === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {riskVal}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                {riskVal === 'LOW' ? 'Statutory Cleared' : 'Action Required'}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Stage Governance Pipeline Strip */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Verification Pipeline Lifecycle
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
              <div className="truncate">
                <div className="font-semibold text-slate-800 text-[11px]">1. AI Extraction</div>
                <div className="text-[10px] text-emerald-700 font-medium">OCR Parsed & Validated</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
              <div className="truncate">
                <div className="font-semibold text-slate-800 text-[11px]">2. Cross-Verification</div>
                <div className="text-[10px] text-emerald-700 font-medium">10 Statutory Adapters</div>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
              <div className="truncate">
                <div className="font-semibold text-slate-800 text-[11px]">3. Rule Engine</div>
                <div className="text-[10px] text-emerald-700 font-medium">16 Deterministic Rules</div>
              </div>
            </div>

            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
              bidder.officer_decision && bidder.officer_decision !== 'PENDING'
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                bidder.officer_decision && bidder.officer_decision !== 'PENDING'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {bidder.officer_decision && bidder.officer_decision !== 'PENDING' ? '✓' : '4'}
              </div>
              <div className="truncate">
                <div className="font-semibold text-slate-800 text-[11px]">4. Officer Review</div>
                <div className={`text-[10px] font-medium ${
                  bidder.officer_decision && bidder.officer_decision !== 'PENDING' ? 'text-emerald-700' : 'text-amber-800'
                }`}>
                  {bidder.officer_decision || 'Pending Final Review'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-600 font-semibold block">Passed Rules</span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums">{passedChecksCount} of {checks.length}</span>
            <span className="text-[10px] text-slate-500 block">Satisfies statutory criteria</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-600 font-semibold block">Critical Non-Compliance</span>
            <span className="text-lg font-bold text-rose-700 tabular-nums">{failedChecksCount}</span>
            <span className="text-[10px] text-slate-500 block">Disqualification grounds</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-600 font-semibold block">Advisory Notices</span>
            <span className="text-lg font-bold text-amber-700 tabular-nums">{warningChecksCount}</span>
            <span className="text-[10px] text-slate-500 block">Officer discretion required</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-600 font-semibold block">Verified Credentials</span>
            <span className="text-lg font-bold text-blue-800 tabular-nums">{documents.length + govtVerifs.length}</span>
            <span className="text-[10px] text-slate-500 block">Documents & Statutory APIs</span>
          </div>
        </div>
      </div>

      {/* AI Recommendation Advisory Banner */}
      <div className={`p-5 rounded-2xl border text-xs space-y-3 ${
        riskVal === 'CRITICAL'
          ? 'bg-rose-50/40 border-rose-200 text-rose-950'
          : riskVal === 'HIGH'
          ? 'bg-amber-50/40 border-amber-200 text-amber-950'
          : 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-700" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-blue-900">
              AI-ASSISTED ADVISORY RECOMMENDATION
            </span>
          </div>
          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-white border border-slate-300 shadow-2xs">
            {aiRec.status_label || 'FURTHER REVIEW REQUIRED'}
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-900 leading-snug">
          {aiRec.summary || 'Statutory review in progress.'}
        </p>

        {aiRec.suggested_action && (
          <div className="p-3.5 bg-white/90 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">
              RECOMMENDED PROCUREMENT OFFICER ACTION:
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {aiRec.suggested_action}
            </p>
          </div>
        )}

        <div className="text-[10.5px] text-slate-500 italic pt-1 flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{aiRec.officer_disclaimer || 'AI recommendations are decision-support only. Sovereign qualification determination remains the exclusive responsibility of the designated Procurement Officer.'}</span>
        </div>
      </div>

      {/* 6 Compliance Pillars Scoring Breakdown */}
      {scoreBreakdown.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Six Compliance Verification Pillars</h3>
              <p className="text-slate-500 text-[11px]">Weighted scoring breakdown across statutory, commercial, and technical integrity criteria</p>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">GFR 2017 & CPCL Manual</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreBreakdown.map((sb) => (
              <div key={sb.category} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-[11.5px]">
                  <span className="font-semibold text-slate-800">{sb.category}</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">{sb.earned_points} / {sb.max_points} pts</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      sb.percentage >= 80 ? 'bg-emerald-600' : (sb.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-600')
                    }`}
                    style={{ width: `${sb.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10.5px] text-slate-500 tabular-nums">
                  <span>Weight: {sb.weight}%</span>
                  <span>{sb.checks_passed} of {sb.checks_total} checks passed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold space-x-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'matrix'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Requirement Matrix ({checks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('govt')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'govt'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Statutory Verifications ({govtVerifs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'docs'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Document Intelligence & OCR ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'timeline'
              ? 'border-blue-700 text-blue-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Trail ({auditTimeline.length})</span>
        </button>
      </div>

      {/* Tab 1: Requirement Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10.5px] tracking-wider">
                <tr>
                  <th className="p-3.5">Rule ID & Clause</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Primary Determination & Evidence</th>
                  <th className="p-3.5 text-center">Confidence</th>
                  <th className="p-3.5 text-right">Explainability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checks.map((chk, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono text-[11px] font-bold text-blue-900 tabular-nums">{chk.rule_id}</div>
                      <div className="font-semibold text-slate-900 mt-0.5">{chk.requirement}</div>
                    </td>

                    <td className="p-3.5 text-slate-600 font-medium">
                      {chk.category}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold font-mono tracking-wider ${
                        chk.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : chk.status === 'FAIL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : chk.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {chk.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-700 max-w-md">
                      <p className="leading-snug font-medium">{chk.reason}</p>
                      {chk.evidence && chk.evidence.length > 0 && (
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                            Source: {chk.evidence[0].source}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-center font-mono text-slate-700 font-medium tabular-nums">
                      {Math.round(chk.confidence * 100)}%
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => openExplainDrawer(bidder.bidder_id, chk.rule_id)}
                        className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium text-[11px] transition-colors border border-blue-200"
                      >
                        Inspect Rule
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Simulated Government Verifications */}
      {activeTab === 'govt' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <span className="font-semibold">
              SIMULATED GOVERNMENT DATA: 10 statutory adapters connected in decision-support sandbox.
            </span>
            <span className="text-[10.5px] font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800 font-semibold">
              Statutory Sandbox Gateway v2.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {govtVerifs.map((gv) => (
              <div key={gv.provider} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="font-mono font-bold text-blue-900">{gv.provider}</span>
                    <h4 className="font-bold text-slate-900">{gv.provider_name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    gv.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : gv.status === 'FAILED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : gv.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {gv.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-mono">{gv.query_key}:</span>
                    <span className="font-mono font-bold text-slate-800 tabular-nums">{gv.query_value}</span>
                  </div>
                </div>

                {gv.discrepancies && gv.discrepancies.length > 0 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px] space-y-1">
                    <span className="font-bold block">FLAGGED DISCREPANCIES:</span>
                    {gv.discrepancies.map((d, idx) => (
                      <p key={idx}>• {d}</p>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">{gv.simulated_label}</span>
                  <span>{gv.timestamp ? gv.timestamp.slice(0, 19).replace('T', ' ') : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Document Intelligence & OCR */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          {/* Upload Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Upload Supporting Document for Structured OCR Extraction</h3>
              <p className="text-slate-500 text-[11px]">Upload tender bid affidavits, certificates, or annexures for automated key-value parsing</p>
            </div>
            <form onSubmit={handleUploadDocument} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-1/3">
                <label className="block text-slate-600 font-semibold mb-1">Document Classification</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 font-medium"
                >
                  <option value="GST_CERTIFICATE">GST Registration Certificate (REG-06)</option>
                  <option value="UDYAM_CERTIFICATE">Udyam Registration Certificate</option>
                  <option value="PAN_CARD">Permanent Account Number (PAN Card)</option>
                  <option value="LOCAL_CONTENT_AFFIDAVIT">Make in India (PPP-MII) Affidavit</option>
                  <option value="OEM_AUTHORIZATION">OEM Manufacturer Authorization (MAF)</option>
                  <option value="EPFO_CHALLAN">EPFO Monthly Electronic Challan (ECR)</option>
                  <option value="ESIC_DOC">ESIC Registration Document</option>
                  <option value="OTHER">Other Technical Specification</option>
                </select>
              </div>

              <div className="w-full sm:w-1/2">
                <label className="block text-slate-600 font-semibold mb-1">Select File (PDF or Document)</label>
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc || !uploadFile}
                className="w-full sm:w-auto px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
              >
                {uploadingDoc ? 'Extracting...' : 'Upload & Extract'}
              </button>
            </form>
          </div>

          {/* Uploaded Documents List with OCR Fields */}
          <div className="space-y-4">
            {documents.map((doc) => {
              const extractions = doc.extraction?.extracted_fields || {};
              const inconsistencies = doc.extraction?.inconsistencies_detected || [];
              return (
                <div key={doc._id || doc.filename} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{doc.filename}</div>
                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Type: {doc.document_type} • Size: {(doc.file_size / 1024).toFixed(1)} KB • Uploaded: {doc.uploaded_at?.slice(0, 10)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs text-blue-900 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                        OCR Confidence: {Math.round((doc.extraction?.confidence_score || 0.95) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Extracted Key-Value Fields */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Extracted Structured Metadata
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-[11px]">
                      {Object.entries(extractions).map(([k, v]) => (
                        <div key={k} className="overflow-hidden">
                          <span className="text-slate-500 text-[10px] block uppercase">{k.replace('_', ' ')}</span>
                          <span className="font-bold text-slate-800 truncate block tabular-nums">
                            {typeof v === 'boolean' ? (v ? 'YES' : 'NO') : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inconsistencies detected if any */}
                  {inconsistencies.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                      <span className="font-bold block text-[11px]">CROSS-DOCUMENT ANOMALIES DETECTED:</span>
                      {inconsistencies.map((inc, idx) => (
                        <p key={idx}>• {inc}</p>
                      ))}
                    </div>
                  )}

                  {/* Raw OCR Text Snippet */}
                  {doc.extraction?.raw_text_snippet && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Extracted OCR Text Segment
                      </span>
                      <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-32">
                        {doc.extraction.raw_text_snippet}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Vigilance & Audit Trail</h3>
            <p className="text-slate-500 text-[11px]">Chronological event logging of OCR extractions, statutory checks, and officer reviews</p>
          </div>
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
            {auditTimeline.map((item, idx) => (
              <div key={idx} className="relative flex items-start space-x-4 pl-8">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-700 ring-4 ring-white"></div>
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 font-mono text-[11.5px]">{item.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">{item.timestamp}</span>
                  </div>
                  <p className="text-slate-700 text-[11.5px]">{item.details}</p>
                  <div className="text-[10px] text-slate-400 mt-1">
                    User: <strong className="text-slate-700">{item.user}</strong> • Source: {item.source}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formal Procurement Officer Review Action Bar */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs">
        <div className="flex items-center space-x-2 text-amber-400">
          <Shield className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Official Procurement Officer Qualification Determination
          </h3>
        </div>

        <p className="text-slate-300 text-[11.5px] leading-relaxed">
          In adherence to General Financial Rules (GFR 2017) Rule 144, the artificial intelligence verification engine serves solely as an advisory intelligence tool. Record your official qualification decision and remarks below.
        </p>

        <form onSubmit={handleOfficerSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Officer Determination</label>
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-semibold focus:outline-none"
              >
                <option value="PENDING">PENDING EXAMINATION</option>
                <option value="QUALIFIED_RECOMMENDED">QUALIFIED FOR COMMERCIAL OPENING</option>
                <option value="DISQUALIFIED_RECOMMENDED">DISQUALIFIED / REJECTED</option>
                <option value="CLARIFICATION_REQUESTED">CLARIFICATION NOTICE ISSUED</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Official Remarks & Statutory Citations</label>
              <input
                type="text"
                required
                placeholder="e.g. Cleared after verifying active GST and 65% local content affidavit."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-400">
              Designated Officer: <strong className="text-slate-200">Rajesh Kumar, Senior Procurement Officer, CPCL</strong>
            </span>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <FileCheck className="w-4 h-4" />
              <span>{submittingReview ? 'Recording...' : 'Register Official Officer Decision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
