import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  FolderKanban, Upload, Plus, FileText, CheckCircle2,
  AlertCircle, Scale, Shield, Sparkles, Building2,
  Calendar, IndianRupee, Edit3, ArrowRight, X, Search,
  Filter, Check, ArrowUpDown
} from 'lucide-react';

export default function TendersPage() {
  const { tenders, setTenders, setSelectedTenderId, setActiveView, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [selectedTender, setSelectedTender] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Extracted Requirements State
  const [extractedData, setExtractedData] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // New Tender State
  const [newTender, setNewTender] = useState({
    tender_id: `GEM/2026/B/${Math.floor(100000 + Math.random() * 900000)}`,
    tender_title: '',
    category: 'Class-I Local Supplier',
    tender_value: 14500000,
    required_local_content_pct: 50,
    epfo_esic_required: true,
    startup_waiver_eligible: false,
    submission_deadline: '2026-11-15'
  });

  const loadTenders = async () => {
    setLoading(true);
    try {
      const data = await api.getTenders();
      setTenders(data);
      if (data.length > 0 && !selectedTender) {
        setSelectedTender(data[0]);
      }
    } catch (err) {
      showToast('Error loading tenders', 'critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenders();
  }, []);

  const handleCreateTender = async (e) => {
    e.preventDefault();
    try {
      await api.createTender(newTender);
      showToast(`Tender ${newTender.tender_id} successfully created`, 'success');
      setShowCreateModal(false);
      loadTenders();
    } catch (err) {
      showToast(err.message, 'critical');
    }
  };

  const handleUploadTenderDoc = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.uploadTenderDoc(formData);
      showToast('AI analyzed tender specifications successfully', 'success');
      setExtractedData(res.extracted_parameters);
      setShowConfirmModal(true);
    } catch (err) {
      showToast(`Extraction failed: ${err.message}`, 'critical');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleConfirmRequirements = async () => {
    if (!extractedData) return;
    try {
      const exists = tenders.find(t => t.tender_id === extractedData.tender_id);
      if (exists) {
        await api.confirmTenderRequirements(extractedData.tender_id, extractedData);
      } else {
        await api.createTender(extractedData);
      }
      showToast('Requirements officially confirmed by Procurement Officer', 'success');
      setShowConfirmModal(false);
      loadTenders();
    } catch (err) {
      showToast(err.message, 'critical');
    }
  };

  const filteredTenders = tenders.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.tender_id.toLowerCase().includes(q) || t.tender_title.toLowerCase().includes(q);
    const matchCat = !categoryFilter || t.category === categoryFilter;
    return matchQ && matchCat;
  });

  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>CPCL Refinery Materials Procurement</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Tender Management & Clause Extraction</h1>
          <p className="text-slate-500 text-[11.5px] mt-0.5">
            Configure tender eligibility parameters, ingest GeM bid specifications, and officially confirm AI-extracted clauses.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-blue-700" />
            <span>Upload Tender Document (AI Extract)</span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleUploadTenderDoc} disabled={uploadingPdf} />
          </label>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Tender</span>
          </button>
        </div>
      </div>

      {uploadingPdf && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-3 text-xs text-blue-900 animate-pulse">
          <Sparkles className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
          <div>
            <div className="font-bold">Analyzing GeM Tender Document with Document Intelligence...</div>
            <div className="text-[11px] text-blue-700">Extracting clauses for Local Content threshold, MSME preference, EPFO/ESIC labor mandates, and OEM specifications.</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tender ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-slate-50 text-slate-700 text-xs font-medium"
          >
            <option value="">All Categories ({tenders.length})</option>
            <option value="Class-I Local Supplier">Class-I Local Supplier (&gt;=50%)</option>
            <option value="Class-II Local Supplier">Class-II Local Supplier (&gt;=20%)</option>
            <option value="Open Category">Open Category</option>
          </select>
        </div>
      </div>

      {/* Professional Tenders Data Table (Section 13) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Tender ID</th>
                <th className="p-3.5">Tender Title & Scope</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Min Local Content</th>
                <th className="p-3.5">Bidders Filed</th>
                <th className="p-3.5">Closing Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenders.map((t) => (
                <tr
                  key={t.tender_id}
                  onClick={() => setSelectedTender(t)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    selectedTender?.tender_id === t.tender_id ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <td className="p-3.5 font-mono font-bold text-blue-900 text-[11.5px] whitespace-nowrap">
                    {t.tender_id}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900 max-w-sm truncate">{t.tender_title}</div>
                    <div className="text-[10.5px] text-slate-500 font-mono">
                      Estimated Value: ₹{(t.tender_value / 100000).toFixed(1)} Lakhs
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600 font-medium">
                    {t.department}
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-slate-800">{t.category}</span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-blue-900">
                    {t.required_local_content_pct}%
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-800">
                    {t.bidders_count || 0}
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                    {t.submission_deadline}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {t.tender_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedTenderId(t.tender_id);
                        setActiveView('bidders');
                      }}
                      className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-medium text-[11px] transition-colors"
                    >
                      Bidders ({t.bidders_count || 0})
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Tender Requirements Inspector (Section 14 & 15) */}
      {selectedTender && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
          <div className="flex justify-between items-start border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-blue-900">{selectedTender.tender_id}</span>
                <span className="text-[10.5px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  {selectedTender.department}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {selectedTender.confirmed_by_officer ? 'Requirements Confirmed by Officer' : 'Pending Confirmation'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                {selectedTender.tender_title}
              </h2>
            </div>

            <button
              onClick={() => {
                setSelectedTenderId(selectedTender.tender_id);
                setActiveView('bidders');
              }}
              className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs flex items-center space-x-1.5 transition-colors"
            >
              <span>Examine Bids ({selectedTender.bidders_count || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Statutory Clauses Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Local Content (PPP-MII)</span>
              <span className="font-bold text-slate-900 text-sm font-mono">{selectedTender.required_local_content_pct}% Minimum</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{selectedTender.category}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Labor Law Compliance</span>
              <span className={`font-bold text-sm ${selectedTender.epfo_esic_required ? 'text-slate-900' : 'text-slate-500'}`}>
                {selectedTender.epfo_esic_required ? 'EPFO & ESIC Mandatory' : 'Exempted (Supply-Only)'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Section 7A/45A Clearance</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Startup India Policy</span>
              <span className={`font-bold text-sm ${selectedTender.startup_waiver_eligible ? 'text-emerald-700' : 'text-slate-700'}`}>
                {selectedTender.startup_waiver_eligible ? 'Prior Exp/Turnover Waived' : 'Standard Specifications'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">DPIIT Relaxation</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">OEM Authorization (MAF)</span>
              <span className="font-bold text-slate-900 text-sm">
                {selectedTender.oem_authorization_required ? 'Tender-Specific Required' : 'Not Mandatory'}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">GeM Bid Ref Validation</span>
            </div>
          </div>

          {/* Technical and Special Undertakings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Technical Specifications & Standards
              </h3>
              <ul className="space-y-1 list-disc pl-4 text-slate-600 text-[11.5px]">
                {selectedTender.technical_requirements?.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
              <h3 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Financial Standing & Statutory Undertakings
              </h3>
              <ul className="space-y-1 list-disc pl-4 text-slate-600 text-[11.5px]">
                {selectedTender.financial_requirements?.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
                {selectedTender.special_requirements?.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for AI Extracted Requirements (Section 15) */}
      {showConfirmModal && extractedData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-300 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <CheckCircle2 className="w-5 h-5 text-blue-700" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Review & Confirm Tender Requirements</h2>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] space-y-1">
              <div className="font-bold text-slate-800">Source Document: {extractedData.extracted_from_doc || 'Tender Specifications PDF'}</div>
              <div>AI Document Intelligence extracted these parameters. As Procurement Officer, verify and confirm before committing to the compliance engine.</div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">GeM Bid Number</label>
                <input
                  type="text"
                  value={extractedData.tender_id || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, tender_id: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tender Title</label>
                <input
                  type="text"
                  value={extractedData.tender_title || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, tender_title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Local Content (%)</label>
                  <input
                    type="number"
                    value={extractedData.required_local_content_pct || 50}
                    onChange={(e) => setExtractedData({ ...extractedData, required_local_content_pct: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier Category</label>
                  <select
                    value={extractedData.category || 'Class-I Local Supplier'}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="Class-I Local Supplier">Class-I Local Supplier (&gt;=50%)</option>
                    <option value="Class-II Local Supplier">Class-II Local Supplier (&gt;=20%)</option>
                    <option value="Open Category">Open Category</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extractedData.epfo_esic_required}
                    onChange={(e) => setExtractedData({ ...extractedData, epfo_esic_required: e.target.checked })}
                    className="rounded border-slate-300 text-blue-700"
                  />
                  <span className="font-medium">EPFO & ESIC Mandatory</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extractedData.startup_waiver_eligible}
                    onChange={(e) => setExtractedData({ ...extractedData, startup_waiver_eligible: e.target.checked })}
                    className="rounded border-slate-300 text-blue-700"
                  />
                  <span className="font-medium">Permit Startup Waiver</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequirements}
                className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Commit Requirements</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Tender Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-300 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Register New Tender</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTender} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">GeM Bid Number</label>
                <input
                  type="text"
                  required
                  value={newTender.tender_id}
                  onChange={(e) => setNewTender({ ...newTender, tender_id: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-md font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tender Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supply of Instrumentation & Controls — CPCL Cauvery Basin"
                  value={newTender.tender_title}
                  onChange={(e) => setNewTender({ ...newTender, tender_title: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-md text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Min Local Content (%)</label>
                  <input
                    type="number"
                    value={newTender.required_local_content_pct}
                    onChange={(e) => setNewTender({ ...newTender, required_local_content_pct: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    value={newTender.tender_value}
                    onChange={(e) => setNewTender({ ...newTender, tender_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border rounded-md text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 text-white rounded-md font-semibold"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
