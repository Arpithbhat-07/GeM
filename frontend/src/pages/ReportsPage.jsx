import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  FileSpreadsheet, Printer, Download, Building2, Shield,
  CheckCircle2, AlertTriangle, Scale, Globe2, FileText,
  Clock, ShieldAlert, ArrowLeft
} from 'lucide-react';

export default function ReportsPage() {
  const { selectedBidderId, selectedTenderId, showToast, setActiveView } = useApp();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getReport(selectedTenderId, selectedBidderId);
      setReport(data);
    } catch (err) {
      showToast('Error generating official compliance dossier', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedBidderId, selectedTenderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !report) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">Compiling sovereign compliance dossier...</span>
        </div>
      </div>
    );
  }

  const meta = report?.report_metadata || {};
  const tender = report?.tender || {};
  const bidder = report?.bidder || {};
  const compliance = report?.compliance || {};
  const checks = compliance?.checks || [];
  const govtVerifs = report?.government_verifications || [];

  const scoreVal = compliance.compliance_score !== undefined ? compliance.compliance_score : (bidder.compliance_score || 0);

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Action Header */}
      <div className="flex justify-between items-center print:hidden border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveView('bidder-detail')}
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Return to Bidder Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bid Compliance Verification Dossier</h1>
            <p className="text-xs text-slate-500">Official statutory intelligence document for CPCL Procurement Review Committee</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as Official PDF</span>
        </button>
      </div>

      {/* Official Printable Report Card */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-8 space-y-6 text-xs text-slate-800 print:border-none print:shadow-none print:p-0">
        {/* Official Header Banner */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div className="space-y-1">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              भारत सरकार | Government of India — Ministry of Petroleum & Natural Gas
            </div>
            <h2 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight">
              Chennai Petroleum Corporation Limited (CPCL)
            </h2>
            <div className="text-[11px] text-slate-600 font-medium">
              Refinery Materials Management Division, Manali, Chennai — 600068
            </div>
            <div className="font-mono text-blue-900 font-bold text-xs pt-1">
              GeM Sentinel AI — Integrated Bid Compliance Verification Platform
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-800 tabular-nums">
              {meta.report_id}
            </span>
            <div className="text-[10px] text-slate-500 font-mono tabular-nums">
              Date: {meta.generated_at?.slice(0, 10)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Officer: {meta.generated_by}
            </div>
          </div>
        </div>

        {/* Mandatory Advisory Disclaimer Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium italic">
            "{meta.advisory_disclaimer}"
          </span>
        </div>

        {/* Section 1: Tender & Bidder Identifiers */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1 border-r border-slate-200 pr-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Tender Subject</span>
            <div className="font-mono font-bold text-blue-900 tabular-nums">{tender.tender_id}</div>
            <div className="font-bold text-slate-900 text-xs">{tender.tender_title}</div>
            <div className="text-[11px] text-slate-600">Category: {tender.category} • Required Local Content: <strong className="tabular-nums">{tender.required_local_content_pct}%</strong></div>
          </div>

          <div className="space-y-1 pl-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Bidder Subject</span>
            <div className="font-mono font-bold text-blue-900 tabular-nums">{bidder.bidder_id}</div>
            <div className="font-bold text-slate-900 text-xs">{bidder.company_name}</div>
            <div className="text-[11px] text-slate-600">State: {bidder.state} • Sector: {bidder.sector}</div>
            <div className="font-mono text-[10.5px] text-slate-500 tabular-nums">GSTIN: {bidder.gstin} • PAN: {bidder.pan}</div>
          </div>
        </div>

        {/* Section 2: Executive Compliance Assessment */}
        <div className="grid grid-cols-3 gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Compliance Score</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black font-mono text-blue-900 tabular-nums">{scoreVal}</span>
              <span className="text-xs font-mono text-slate-400 font-semibold">/ 100</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Weighted model</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Risk Classification</span>
            <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">{compliance.risk_level || bidder.risk_level}</span>
            <span className="text-[10px] text-slate-500 block">Deterministic signal</span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">AI Advisory Recommendation</span>
            <span className="text-xs font-bold text-slate-900 block mt-0.5">{compliance.ai_recommendation?.status_label}</span>
            <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{compliance.ai_recommendation?.summary}</span>
          </div>
        </div>

        {/* Section 3: Detailed Rules Evaluation Matrix */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Requirement Compliance Verification Matrix
          </h3>
          <table className="w-full border border-slate-200 rounded-lg text-left text-[11px]">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-2.5">Rule ID</th>
                <th className="p-2.5">Requirement</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5">Observation / Evidentiary Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checks.map((c, i) => (
                <tr key={i}>
                  <td className="p-2 font-mono font-bold text-blue-900 tabular-nums">{c.rule_id}</td>
                  <td className="p-2 font-semibold text-slate-900">{c.requirement}</td>
                  <td className="p-2 text-slate-600">{c.category}</td>
                  <td className="p-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                      c.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-2 text-slate-700">{c.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: Government Registry Verification Records */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Statutory Registries Cross-Verification
            </h3>
            <span className="text-[9.5px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
              SIMULATED GOVERNMENT DATA
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
            {govtVerifs.map((g) => (
              <div key={g.provider} className="p-2 bg-slate-50 border border-slate-200 rounded flex justify-between items-center">
                <span className="font-semibold text-slate-800">{g.provider_name}</span>
                <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                  g.status === 'VERIFIED' ? 'text-emerald-800 bg-emerald-50' : 'text-rose-800 bg-rose-50'
                }`}>
                  {g.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Officer Formal Determination */}
        <div className="p-4 border-2 border-slate-900 rounded-xl space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 block">
            Procurement Officer Formal Determination & Signature Block
          </span>
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500">Official Decision:</span>{' '}
              <strong className="text-slate-900 font-bold">{bidder.officer_decision || 'PENDING'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Review Date:</span>{' '}
              <strong className="font-mono text-slate-900 tabular-nums">{bidder.reviewed_at?.slice(0, 10) || 'Pending'}</strong>
            </div>
          </div>
          <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="text-[10px] text-slate-500 block uppercase font-semibold">Officer Remarks:</span>
            {bidder.officer_remarks || 'Pending final examination by Procurement Review Committee.'}
          </div>

          <div className="pt-6 flex justify-between items-end text-[11px] text-slate-600">
            <div>
              <div>Digital Verification Stamp: <strong>GeM Sentinel AI v2.0</strong></div>
              <div>Hash Reference: <span className="font-mono text-[10px] tabular-nums">SHA256:7f89b4a1...</span></div>
            </div>
            <div className="text-right">
              <div className="w-48 border-b border-slate-400 mb-1"></div>
              <div className="font-bold text-slate-900">Rajesh Kumar</div>
              <div className="text-[10px] text-slate-500">Senior Procurement Officer, CPCL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
