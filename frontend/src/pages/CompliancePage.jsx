import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Scale, CheckCircle2, Shield, BookOpen, AlertTriangle,
  Cpu, ArrowRight, FileCheck, Layers
} from 'lucide-react';

export default function CompliancePage() {
  const { setActiveView } = useApp();

  const rulesCatalog = [
    {
      id: 'SEC-BL-001',
      category: 'Statutory Compliance',
      name: 'Debarment & Non-Blacklisting Verification',
      authority: 'GFR 2017 Rule 151 / GeM Incident Management Policy',
      severity: 'CRITICAL',
      weight: '20% (Pillar)',
      description: 'Checks entity against national blacklist and CPSE debarment watchlists. Automatic critical flag if active debarment order exists.'
    },
    {
      id: 'MCA-001',
      category: 'Statutory Compliance',
      name: 'Corporate Legal Existence & Strike-Off Detection',
      authority: 'Companies Act 2013 Section 248 / RoC MCA21',
      severity: 'HIGH',
      weight: '20% (Pillar)',
      description: 'Verifies CIN/LLPIN against Ministry of Corporate Affairs database. Detects active strike-off notices or defaults in annual filing.'
    },
    {
      id: 'LABOR-001',
      category: 'Statutory Compliance',
      name: 'EPFO & ESIC Mandatory Labor Law Compliance',
      authority: 'EPF & MP Act 1952 / ESI Act 1948',
      severity: 'HIGH',
      weight: '20% (Pillar)',
      description: 'Evaluated conditionally when tender mandates site labor mobilization. Verifies absence of Section 7A or 45A arrears notices.'
    },
    {
      id: 'TAX-GST-001',
      category: 'Tax Compliance',
      name: 'GST Registration Validity & GSTR-3B Recency',
      authority: 'CGST Act 2017 Section 25 / GSTN Gateway',
      severity: 'HIGH',
      weight: '20% (Pillar)',
      description: 'Validates 15-character GSTIN. Flags lapsed return filing exceeding 60 days to mitigate Input Tax Credit (ITC) risks.'
    },
    {
      id: 'TAX-PAN-002',
      category: 'Tax Compliance',
      name: 'Income Tax Section 206AB Non-Filer Compliance',
      authority: 'Income Tax Act 1961 Section 206AB / 206CCA',
      severity: 'MEDIUM',
      weight: '20% (Pillar)',
      description: 'Identifies non-filers of income tax returns for preceding assessment years. Surcharge withholding notification for procurement officer.'
    },
    {
      id: 'REG-UDYAM-001',
      category: 'Registration Compliance',
      name: 'Udyam MSME Certificate & Migration Validity',
      authority: 'Ministry of MSME Gazette Notification S.O. 2119(E)',
      severity: 'HIGH',
      weight: '15% (Pillar)',
      description: 'Verifies authentic Udyam Registration. Disallows legacy EM-II/UAM certificates that expired without modern Udyam migration.'
    },
    {
      id: 'MII-LC-001',
      category: 'Local Content',
      name: 'Make in India (PPP-MII) Local Content Compliance',
      authority: 'DPIIT Public Procurement Order 2017 / GFR Rule 153',
      severity: 'HIGH',
      weight: '15% (Pillar)',
      description: 'Compares declared domestic value addition against tender threshold (e.g. 50% for Class-I Local Supplier). Deterministic threshold gate.'
    },
    {
      id: 'TNDR-OEM-001',
      category: 'Tender Eligibility',
      name: 'Manufacturer Authorization Form (MAF) Specificity',
      authority: 'GeM GTC Section 4 / CPCL Technical Specifications',
      severity: 'MEDIUM',
      weight: '20% (Pillar)',
      description: 'Requires tender-specific reference number on OEM authorization letters for non-OEM distributors.'
    },
    {
      id: 'DOC-CROSS-001',
      category: 'Documentation',
      name: 'Cross-Document Entity Identity Consistency',
      authority: 'Statutory Identity Verification Norms',
      severity: 'CRITICAL',
      weight: '10% (Pillar)',
      description: 'Mathematically cross-checks entity name, PAN, and GSTIN across submitted certificates to prevent shell entity substitution.'
    }
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>Deterministic Rules Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Compliance Rules & Transparent Scoring Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rules engine evaluates structured facts extracted by AI and simulated government databases with mathematical certainty.
          </p>
        </div>

        <button
          onClick={() => setActiveView('bidders')}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <span>Apply to Bidders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Architecture Graphic Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-xs">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Core Engineering Principle: AI Extraction + Deterministic Rules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-indigo-400 font-mono block">STAGE 1</span>
            <h4 className="font-bold text-white text-sm mt-0.5">AI Document OCR</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Extracts text, identifies fields (GSTIN, PAN, Dates, Local Content %), and computes extraction confidence.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-indigo-400 font-mono block">STAGE 2</span>
            <h4 className="font-bold text-white text-sm mt-0.5">Government Cross-Check</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Validates extracted claims against 10 simulated statutory registries (GSTN, Udyam, MCA, EPFO, ESIC, etc.).
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-blue-400 font-mono block">STAGE 3</span>
            <h4 className="font-bold text-white text-sm mt-0.5">Deterministic Rules</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Rules execute deterministically. No LLM hallucinations dictate compliance pass/fail results.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            <span className="text-[10px] text-emerald-400 font-mono block">STAGE 4</span>
            <h4 className="font-bold text-white text-sm mt-0.5">Advisory Decision Support</h4>
            <p className="text-slate-400 text-[11px] mt-1">
              Calculates transparent score, assigns risk, links evidentiary citations, and produces advisory briefs for officers.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Active Compliance Verification Rules ({rulesCatalog.length})
          </span>
          <span className="text-slate-500 font-mono text-[11px]">GFR 2017 & CPCL Baseline</span>
        </div>

        <div className="divide-y divide-slate-100">
          {rulesCatalog.map((r) => (
            <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-blue-900 tabular-nums">{r.id}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {r.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono tabular-nums">
                    Weight: {r.weight}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{r.name}</h3>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">{r.description}</p>
                <div className="text-[10.5px] text-slate-400 italic">
                  Legal Authority: {r.authority}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider ${
                  r.severity === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : r.severity === 'HIGH'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}>
                  {r.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
