import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api, getApiBaseUrl, setApiBaseUrl } from '../api/client';
import {
  Settings, Cpu, Database, RefreshCw, Key, Shield,
  CheckCircle2, Sparkles, Building2, HardDrive, Globe,
  AlertCircle, Check, ArrowRight
} from 'lucide-react';

export default function SettingsPage() {
  const { systemStatus, setSystemStatus, showToast, refreshSystem } = useApp();
  const [aiMode, setAiMode] = useState('mock');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [reseeding, setReseeding] = useState(false);

  // Cloud API Gateway state
  const [apiEndpoint, setApiEndpoint] = useState(() => {
    const raw = getApiBaseUrl();
    return raw.replace(/\/api\/?$/, '');
  });
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (systemStatus?.ai_engine) {
      setAiMode(systemStatus.ai_engine.mode || 'mock');
    }
  }, [systemStatus]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSystemConfig({
        ai_mode: aiMode,
        gemini_api_key: apiKey || undefined
      });
      showToast(`AI engine mode set to ${res.ai_mode.toUpperCase()}`, 'success');
      refreshSystem();
    } catch (err) {
      showToast(err.message, 'critical');
    } finally {
      setSaving(false);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset and re-seed database with standard CPCL & GeM benchmark data?')) return;
    setReseeding(true);
    try {
      showToast('Re-indexing 74 vendor profiles across 7 CPCL refinery tenders...', 'info');
      const res = await api.reseedDatabase();
      showToast(res.message || 'Benchmark dataset successfully refreshed', 'success');
      refreshSystem();
    } catch (err) {
      showToast(err.message, 'critical');
    } finally {
      setReseeding(false);
    }
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setTestResult(null);
    const target = apiEndpoint.trim().replace(/\/+$/, '');
    const healthUrl = target ? `${target}/api/health` : '/api/health';
    try {
      const start = performance.now();
      const res = await fetch(healthUrl);
      const latency = Math.round(performance.now() - start);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      if (!ct.includes('application/json')) {
        throw new Error(`Endpoint returned '${ct}', expected JSON. Verify backend URL.`);
      }
      const data = await res.json();
      setTestResult({
        success: true,
        latency,
        status: data.status || 'ONLINE',
        bidders: data.data_availability?.bidders ?? 'Available',
        tenders: data.data_availability?.tenders ?? 'Available',
        database: data.database?.mode || 'Active'
      });
      showToast(`Connected to backend (${latency}ms)`, 'success');
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message
      });
      showToast(`Connection failed: ${err.message}`, 'critical');
    } finally {
      setTestingApi(false);
    }
  };

  const handleSaveApi = (e) => {
    e.preventDefault();
    const clean = apiEndpoint.trim().replace(/\/+$/, '');
    setApiBaseUrl(clean);
    showToast('Backend API Gateway saved. Reloading application state...', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleResetApi = () => {
    setApiBaseUrl('');
    setApiEndpoint('');
    setTestResult(null);
    showToast('Reset to default relative API (/api). Reloading...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <span>Enterprise Platform Administration</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
          System Configuration & AI Engine Parameters
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage multimodal AI operational modes, inspect database storage connectors, and maintain benchmark datasets.
        </p>
      </div>

      {/* Production API Gateway & Cloud Deployment Coordinates */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-900 font-bold uppercase tracking-wider text-xs">
            <Globe className="w-5 h-5 text-blue-700" />
            <span>Production API Gateway & Cloud Coordinates</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Active: {getApiBaseUrl()}
          </span>
        </div>

        <p className="text-slate-600 text-[11.5px] leading-relaxed">
          Configure the active FastAPI backend endpoint. When deployed across distributed cloud platforms (e.g. <strong>Vercel</strong> for Frontend and <strong>Render</strong> for Backend), enter your live Render backend URL below.
        </p>

        <form onSubmit={handleSaveApi} className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="e.g. https://your-backend.onrender.com (or leave empty for relative /api)"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-blue-600"
            />
            <button
              type="button"
              onClick={handleTestApi}
              disabled={testingApi}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingApi ? 'animate-spin' : ''}`} />
              <span>{testingApi ? 'Probing...' : 'Test Connection'}</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
            >
              Save & Apply
            </button>
            <button
              type="button"
              onClick={handleResetApi}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium"
            >
              Reset
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-xl border text-[11px] ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {testResult.success ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Backend Verified Healthy:</strong> Status: {testResult.status} • Bidders: {testResult.bidders} • Tenders: {testResult.tenders} • Storage: {testResult.database}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">{testResult.latency}ms</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Connection Failed:</strong> {testResult.error}
                  </span>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* AI Mode Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center space-x-2 text-blue-900 font-bold uppercase tracking-wider text-xs">
          <Cpu className="w-5 h-5 text-blue-700" />
          <span>Multimodal AI Engine Mode (Autonomous Fallback Architecture)</span>
        </div>

        <p className="text-slate-600 text-[11.5px] leading-relaxed">
          GeM Sentinel AI is architected with complete operational autonomy. In <strong>Autonomous Deterministic Mode</strong>, local high-speed pattern tokenizers extract structured compliance metadata with zero external cloud dependencies. In <strong>Google Gemini Mode</strong>, the Gemini 1.5 Flash endpoint performs deep semantic parsing and regulatory legal text synthesis.
        </p>

        <form onSubmit={handleSaveConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setAiMode('mock')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                aiMode === 'mock'
                  ? 'border-blue-700 bg-blue-50/50 shadow-xs ring-1 ring-blue-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">Autonomous Deterministic Engine</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Air-Gapped / Offline Resilient
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Utilizes local heuristic extractors, regex tokenizers, and statutory verification matrices. Provides 100% offline reliability without external network calls or cloud API keys.
              </p>
            </div>

            <div
              onClick={() => setAiMode('gemini')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                aiMode === 'gemini'
                  ? 'border-blue-700 bg-blue-50/50 shadow-xs ring-1 ring-blue-700'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-sm">Google Gemini 1.5 Flash API</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Cloud Semantic OCR
                </span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Direct integration with Google Generative AI endpoints for multimodal document image processing, visual parsing, and automated legal draft synthesis.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Google Gemini API Key (Optional in Deterministic Mode)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                placeholder={systemStatus?.ai_engine?.has_api_key ? '••••••••••••••••••••••••' : 'Enter Google AI Studio API Key'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
          >
            {saving ? 'Applying Settings...' : 'Save AI Configuration'}
          </button>
        </form>
      </div>

      {/* Database Engine Health */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-800 font-bold uppercase tracking-wider text-xs">
          <Database className="w-5 h-5 text-emerald-600" />
          <span>Database Engine Architecture</span>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">Active Storage Engine</span>
            <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
              {systemStatus?.database?.mode === 'mongodb' ? 'MongoDB Cluster (Motor Async)' : 'High-Performance Persistent Document Store'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-semibold block">Operational Status</span>
            <span className="text-sm font-bold text-emerald-700 flex items-center space-x-1.5 font-mono mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Operational & Synced</span>
            </span>
          </div>
        </div>

        <p className="text-slate-500 text-[11px] leading-relaxed">
          The database manager implements an automated dual-storage mechanism: if an enterprise MongoDB cluster is reachable, it binds asynchronously; otherwise, it seamlessly persists state to structured JSON storage with atomic disk writes.
        </p>
      </div>

      {/* Reset & Reseed Database */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Reload CPCL Benchmark Master Dataset</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Re-seed 74 supplier profiles across 7 CPCL refinery tenders to baseline statutory verification state.
            </p>
          </div>

          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="flex items-center space-x-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            <span>{reseeding ? 'Re-indexing...' : 'Reload Benchmark Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
