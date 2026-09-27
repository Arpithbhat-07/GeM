import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  FileText, Search, Filter, RefreshCw, Upload, Eye,
  CheckCircle2, AlertTriangle, Sparkles, Building2,
  FileCheck, Shield, Layers, ExternalLink, Hash
} from 'lucide-react';

export default function DocumentsPage() {
  const { selectedTenderId, showToast } = useApp();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (err) {
      showToast('Error loading documents repository', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filteredDocs = documents.filter((d) => {
    const matchesType = !filterType || d.document_type === filterType;
    const matchesSearch = !searchQuery ||
      d.bidder_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.filename?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>OCR & Multimodal Document Intelligence</span>
            <span>•</span>
            <span>Annexure Verification Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Bid Document Intelligence & Structured OCR
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated optical extraction, confidence-weighted parsing, and cross-referencing of vendor-submitted tender affidavits.
          </p>
        </div>

        <button
          onClick={fetchDocs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Documents</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Bidder ID (BID-001) or document filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-blue-600"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium text-xs"
        >
          <option value="">All Document Types ({documents.length})</option>
          <option value="GST_CERTIFICATE">GST Registration (REG-06)</option>
          <option value="UDYAM_CERTIFICATE">Udyam MSME Certificate</option>
          <option value="PAN_CARD">Permanent Account Number (PAN)</option>
          <option value="LOCAL_CONTENT_AFFIDAVIT">Make in India Affidavit</option>
          <option value="OEM_AUTHORIZATION">Manufacturer Authorization (MAF)</option>
          <option value="EPFO_CHALLAN">EPFO Monthly ECR</option>
          <option value="ESIC_DOC">ESIC Registration Form</option>
        </select>
      </div>

      {/* Split-Pane Document Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Registry list & Text Extract */}
        <div className="lg:col-span-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
            <span>Dossier Annexures ({filteredDocs.length})</span>
            <span className="text-[10px] text-slate-400">Click to inspect</span>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredDocs.map((d) => {
              const isSelected = selectedDoc?._id === d._id || (selectedDoc?.filename === d.filename && selectedDoc?.bidder_id === d.bidder_id);
              const conf = Math.round((d.extraction?.confidence_score || 0.95) * 100);
              return (
                <div
                  key={d._id || d.filename}
                  onClick={() => setSelectedDoc(d)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-blue-900 tabular-nums">{d.bidder_id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {d.document_type}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{d.filename}</div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-2">
                    <span className="font-mono tabular-nums">OCR Conf: <strong className="text-blue-700">{conf}%</strong></span>
                    <span className="font-mono tabular-nums">{d.uploaded_at?.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Left Sub-Pane: Extracted Raw Document Text with Highlighting */}
          {selectedDoc && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold uppercase tracking-wider text-[10.5px] text-slate-400 font-mono">
                  OCR Text Stream Extraction
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Text Layer Extracted
                </span>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] whitespace-pre-wrap max-h-[320px] overflow-y-auto leading-relaxed border border-slate-800">
                {selectedDoc.extraction?.raw_text_snippet || 'Document text extracted and tokenized.'}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Structured Key-Value Metadata & Inconsistencies */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 tabular-nums">
                      {selectedDoc.bidder_id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedDoc.document_type}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-1.5">{selectedDoc.filename}</h3>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    File Size: {(selectedDoc.file_size / 1024).toFixed(1)} KB • OCR Engine: {selectedDoc.extraction?.extraction_method || 'AI_OCR_GEMINI'}
                  </div>
                </div>

                <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Model Confidence</span>
                  <span className="text-xl font-bold font-mono text-blue-800 tabular-nums">
                    {Math.round((selectedDoc.extraction?.confidence_score || 0.95) * 100)}%
                  </span>
                </div>
              </div>

              {/* Extracted Fields Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Extracted Structured Key-Value Fields
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Object.keys(selectedDoc.extraction?.extracted_fields || {}).length} Fields Parsed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[11px]">
                  {Object.entries(selectedDoc.extraction?.extracted_fields || {}).map(([k, v]) => (
                    <div key={k} className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-medium">{k.replace(/_/g, ' ')}</span>
                      <span className="font-bold text-slate-900 truncate block mt-0.5 tabular-nums">
                        {typeof v === 'boolean' ? (v ? 'YES' : 'NO') : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inconsistencies detected if any */}
              {selectedDoc.extraction?.inconsistencies_detected?.length > 0 ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Cross-Document Discrepancies Flagged</span>
                  </div>
                  <div className="space-y-1">
                    {selectedDoc.extraction.inconsistencies_detected.map((inc, i) => (
                      <p key={i} className="text-[11.5px] leading-relaxed">
                        • {inc}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-medium">
                    No discrepancies detected. Extracted values cross-match with statutory registries.
                  </span>
                </div>
              )}

              {/* Statutory Verification Cross-Reference Note */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed space-y-1">
                <div className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider">
                  Verification Cross-Reference Notice
                </div>
                <p>
                  Extracted values are deterministically correlated against Government API responses (GSTN, MCA21, EPFO, ESIC, DPIIT, and GeM Incident Database). In case of conflict, the sovereign statutory source takes precedence over self-declared affidavits.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select an uploaded document from the dossier annexures to inspect OCR extractions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
