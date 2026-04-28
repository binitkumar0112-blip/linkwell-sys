// @ts-nocheck
import { useState, useEffect } from 'react';
import { BarChart3, Download, Users, CheckCircle, Clock, Calendar, Loader2 } from 'lucide-react';
import { getAppStats } from '../services/statsService';
import { supabase } from '../lib/supabase';

const CATEGORY_COLORS = {
  infrastructure: 'bg-blue-500',
  health:         'bg-teal-500',
  food:           'bg-orange-500',
  education:      'bg-purple-500',
  rescue:         'bg-red-500',
  other:          'bg-slate-400',
};

const CATEGORY_LABELS = {
  infrastructure: 'Infrastructure & Roads',
  health:         'Health & Sanitation',
  food:           'Food Distribution',
  education:      'Education / Supplies',
  rescue:         'Rescue & Emergency',
  other:          'Other',
};

export default function ImpactReports() {
  const [downloading, setDownloading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    getAppStats().then(setStats);
    loadCategoryStats();
  }, []);

  const loadCategoryStats = async () => {
    setChartLoading(true);
    try {
      // Fetch all issues with their category and status
      const { data, error } = await supabase
        .from('issues')
        .select('category, status');

      if (error) throw error;

      if (!data || data.length === 0) {
        setChartData([]);
        return;
      }

      // Aggregate: count total and resolved per category
      const catMap: Record<string, { total: number; resolved: number }> = {};
      for (const issue of data) {
        const cat = issue.category || 'other';
        if (!catMap[cat]) catMap[cat] = { total: 0, resolved: 0 };
        catMap[cat].total++;
        if (issue.status === 'resolved') catMap[cat].resolved++;
      }

      // Convert to sorted chart rows (highest resolution % first)
      const rows = Object.entries(catMap)
        .map(([cat, counts]) => ({
          key: cat,
          label: CATEGORY_LABELS[cat] || cat,
          total: counts.total,
          resolved: counts.resolved,
          pct: counts.total > 0 ? Math.round((counts.resolved / counts.total) * 100) : 0,
          color: CATEGORY_COLORS[cat] || 'bg-slate-400',
        }))
        .sort((a, b) => b.pct - a.pct);

      setChartData(rows);
    } catch (e) {
      console.error('Failed to load category stats:', e);
    } finally {
      setChartLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto my-8 space-y-8">
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Report downloaded successfully (PDF)
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-gray-900 mb-2">Impact Reports</h1>
          <p className="text-gray-600">Track your NGO's community impact, volunteer engagement, and resolved issues.</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-70"
        >
          {downloading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Report PDF
        </button>
      </div>

      {/* ── KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <div className="p-2 bg-blue-50 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
            <span className="font-medium">Total Problems Resolved</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">{stats?.resolvedIssues || 0}</div>
          <div className="text-sm text-green-600 mt-2 font-medium">Verified solutions</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-purple-600">
            <div className="p-2 bg-purple-50 rounded-lg"><Clock className="w-6 h-6" /></div>
            <span className="font-medium">Active Volunteers</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">{stats?.volunteers || 0}</div>
          <div className="text-sm text-green-600 mt-2 font-medium">Ready to help</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <div className="p-2 bg-orange-50 rounded-lg"><Users className="w-6 h-6" /></div>
            <span className="font-medium">NGO Partners</span>
          </div>
          <div className="text-4xl font-bold text-gray-900">{stats?.ngos || 0}</div>
          <div className="text-sm text-gray-500 mt-2 font-medium">Collaborating orgs</div>
        </div>
      </div>

      {/* ── Category Chart ──────────────────────── */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-medium text-gray-900">Issue Resolution by Category</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            <Calendar className="w-4 h-4" />
            All Time (Live)
          </div>
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading category data…
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No issue data yet. Reports will appear here as issues are logged.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {chartData.map((item) => (
              <div key={item.key}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">
                    {item.resolved}/{item.total} resolved ({item.pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
