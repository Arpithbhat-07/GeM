import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import {
  Search, X, Building2, Users, FileText, Shield,
  ArrowRight, CornerDownLeft, ExternalLink
} from 'lucide-react';

export default function GlobalSearchModal() {
  const {
    isSearchOpen, setIsSearchOpen, tenders,
    navigateToBidder, setSelectedTenderId, setActiveView
  } = useApp();

  const [query, setQuery] = useState('');
  const [bidders, setBidders] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // Fetch initial sample bidders
      api.getBidders({ limit: 50 }).then(setBidders).catch(() => {});
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const matchingTenders = q
    ? tenders.filter(t =>
        t.tender_id?.toLowerCase().includes(q) ||
        t.tender_title?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q)
      ).slice(0, 4)
    : tenders.slice(0, 3);

  const matchingBidders = q
    ? bidders.filter(b =>
        b.bidder_id?.toLowerCase().includes(q) ||
        b.company_name?.toLowerCase().includes(q) ||
        b.gstin?.toLowerCase().includes(q) ||
        b.pan?.toLowerCase().includes(q) ||
        b.sector?.toLowerCase().includes(q)
      ).slice(0, 6)
    : bidders.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden text-xs flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bidders, tenders, GSTIN, PAN, or verification references... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:outline-none text-xs font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-mono text-[10px] border border-slate-300">
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tenders Section */}
          {matchingTenders.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2">
                Procurement Tenders
              </span>
              <div className="space-y-1">
                {matchingTenders.map(t => (
                  <div
                    key={t.tender_id}
                    onClick={() => {
                      setSelectedTenderId(t.tender_id);
                      setActiveView('tenders');
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                      <div className="truncate">
                        <span className="font-mono font-bold text-blue-900 mr-2">{t.tender_id}</span>
                        <span className="font-medium text-slate-800">{t.tender_title}</span>
                      </div>
                    </div>
                    <span className="text-[10.5px] text-slate-500 font-medium shrink-0 ml-2">
                      {t.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bidders Section */}
          {matchingBidders.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-2">
                Participating Bidders & Entities
              </span>
              <div className="space-y-1">
                {matchingBidders.map(b => (
                  <div
                    key={b.bidder_id}
                    onClick={() => {
                      navigateToBidder(b.bidder_id);
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Users className="w-4 h-4 text-slate-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-mono font-bold text-blue-900 mr-2">{b.bidder_id}</span>
                        <span className="font-semibold text-slate-900">{b.company_name}</span>
                        <span className="text-[10.5px] text-slate-500 ml-2 font-mono">
                          ({b.state} • {b.sector})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        b.risk_level === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : b.risk_level === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {b.risk_level || 'EVALUATING'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {matchingTenders.length === 0 && matchingBidders.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No matching records found for "{query}".
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[10.5px] text-slate-500 flex justify-between items-center">
          <span>Search index spans 7 CPCL tenders and 74 registered bidders</span>
          <span className="flex items-center space-x-1">
            <span>Select with click or</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[9px]">ESC</kbd>
            <span>to dismiss</span>
          </span>
        </div>
      </div>
    </div>
  );
}
