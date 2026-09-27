import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X, AlertTriangle, CheckCircle, ShieldCheck, Scale,
  FileSearch, Sparkles, ArrowRight, BookOpen, ExternalLink,
  Copy, Check, ShieldAlert, Cpu
} from 'lucide-react';

export default function ExplainabilityDrawer() {
  const { isExplainOpen, closeExplainDrawer, explainData, explainLoading, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isExplainOpen) return null;

  const handleCopyClause = () => {
    if (explainData?.llm_advisory_clause) {
      navigator.clipboard.writeText(explainData.llm_advisory_clause);
      setCopied(true);
      showToast('Clarification notice clause copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  FORENSIC COMPLIANCE INVESTIGATION
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono tabular-nums">
                  RULE REF: {explainData?.rule_id || 'STATUTORY'}
                </span>
              </div>
              <h2 className="text-base font-bold text-white leading-tight mt-0.5">
                {explainData?.title || 'Rule Verification Determination'}
              </h2>
            </div>
          </div>
          <button
            onClick={closeExplainDrawer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {explainLoading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium">Extracting evidentiary cross-references and audit facts...</p>
            </div>
          ) : (
            <>
              {/* 1. Tender Requirement */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-400 font-semibold text-[10.5px] uppercase tracking-wider">
                  <Scale className="w-3.5 h-3.5 text-blue-400" />
                  <span>1. Applicable Tender Requirement & Criterion</span>
                </div>
                <p className="text-slate-100 font-semibold leading-relaxed text-[12px]">
                  {explainData?.tender_requirement}
                </p>
              </div>

              {/* 2. Detected Discrepancy & Observed Data */}
              <div className="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 font-semibold text-[10.5px] uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>2. Observed Data & Identified Finding</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-mono text-[11.5px] bg-slate-950/60 p-2.5 rounded border border-rose-900/30">
                  {explainData?.detected_state}
                </p>
              </div>

              {/* 3. Deterministic Rule Logic & Calculated Result */}
              <div className="bg-slate-800/50 border border-slate-700/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400 font-semibold text-[10.5px] uppercase tracking-wider">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>3. Rule Execution Logic & Calculated Determination</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                    Deterministic Engine v2.0
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9.5px] uppercase">Evaluation Method</span>
                    <span className="text-slate-200 font-medium">Exact Statutory Rule Match</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9.5px] uppercase">Execution Result</span>
                    <span className="text-amber-400 font-medium font-bold">DISCREPANCY DETECTED</span>
                  </div>
                </div>
              </div>

              {/* 4. Evidentiary Chain & Citations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs tracking-wide uppercase">
                    4. Evidentiary Citations & Proof Points
                  </span>
                  <span className="text-[11px] text-blue-400 font-mono tabular-nums">
                    AI Confidence: {Math.round((explainData?.ai_confidence || 0.95) * 100)}%
                  </span>
                </div>

                {explainData?.evidence_chain && explainData.evidence_chain.length > 0 ? (
                  <div className="space-y-2.5">
                    {explainData.evidence_chain.map((ev, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-blue-300 font-mono">{ev.source}</span>
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-900 font-mono">
                              CROSS-CHECK
                            </span>
                          </div>
                          <span className="text-slate-500 font-mono text-[10px]">VERIFIED FACT</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800/80 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase">Detected Fact</span>
                            <span className="text-rose-300 font-medium truncate block tabular-nums">
                              {ev.detected || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[9.5px] uppercase">Required Benchmark</span>
                            <span className="text-emerald-300 font-medium truncate block tabular-nums">
                              {ev.expected || 'N/A'}
                            </span>
                          </div>
                        </div>
                        {ev.citation && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-900/40 p-2 rounded border border-slate-800/40">
                            "{ev.citation}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-800/40 rounded-lg text-slate-400 italic text-center">
                    Rule triggered by statutory registry flag or non-submission of required document.
                  </div>
                )}
              </div>

              {/* 5. Regulatory Basis */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center space-x-2 text-slate-400 text-[10.5px] font-semibold uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>5. Regulatory Citation & Statutory Basis</span>
                </div>
                <p className="text-slate-300 text-[11.5px] leading-relaxed">
                  {explainData?.regulatory_basis || 'General Financial Rules (GFR 2017) Rule 144 / Public Procurement Order 2017 / GeM GTC Clauses.'}
                </p>
              </div>

              {/* 6. AI Legal Advisory Synthesis & Draft Clause */}
              {explainData?.llm_legal_explanation && (
                <div className="bg-indigo-950/20 border border-indigo-700/40 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center space-x-2 text-indigo-300 font-semibold text-[10.5px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>6. AI Legal Advisory Synthesis</span>
                  </div>
                  <p className="text-slate-200 text-[11.5px] leading-relaxed">
                    {explainData.llm_legal_explanation}
                  </p>
                  {explainData.llm_advisory_clause && (
                    <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-indigo-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-300 font-mono font-bold uppercase">
                          RECOMMENDED CLARIFICATION NOTICE PARAGRAPH:
                        </span>
                        <button
                          onClick={handleCopyClause}
                          className="flex items-center space-x-1 text-[10.5px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition-colors"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy Text'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-indigo-100 bg-slate-900 p-2.5 rounded leading-relaxed border border-indigo-950">
                        "{explainData.llm_advisory_clause}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 7. Recommended Officer Action */}
              <div className="bg-emerald-950/20 border border-emerald-700/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-[10.5px] uppercase tracking-wider">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>7. Recommended Procurement Officer Action</span>
                </div>
                <p className="text-emerald-100 font-medium text-[12px] leading-relaxed">
                  {explainData?.recommended_officer_action}
                </p>
              </div>

              {/* 8. Official Statutory Disclaimer */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[10.5px] text-slate-500 text-center leading-relaxed flex items-center justify-center space-x-2">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{explainData?.disclaimer || 'AI-assisted verification is advisory. The Procurement Officer retains sovereign legal authority for all qualification decisions.'}</span>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            CPCL Procurement Governance Framework
          </span>
          <button
            onClick={closeExplainDrawer}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Dismiss Investigation
          </button>
        </div>
      </div>
    </div>
  );
}
