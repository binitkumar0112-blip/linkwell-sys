// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMyReports } from "../services/citizenReportService";
import { getIssues } from "../services/issues";
import MapView from "../components/MapView";
import {
  Plus, MapPin, CheckCircle2, Clock, AlertTriangle,
  Loader2, FileText, ArrowRight, TrendingUp, Activity
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  reported:    { label: 'Reported',    color: 'bg-blue-50 text-blue-700 border border-blue-200',    dot: 'bg-blue-500' },
  assigned:    { label: 'Assigned',    color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500' },
  resolved:    { label: 'Resolved',    color: 'bg-green-50 text-green-700 border border-green-200',  dot: 'bg-green-500' },
};

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  high:   { color: 'bg-red-100 text-red-700',    label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium' },
  low:    { color: 'bg-green-100 text-green-700', label: 'Low' },
};

function StatusTimeline({ status }: { status: string }) {
  const steps = ['reported', 'assigned', 'in_progress', 'resolved'];
  const currentIdx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full transition-all ${idx <= currentIdx ? STATUS_CONFIG[step]?.dot || 'bg-gray-300' : 'bg-gray-200'}`} />
          {idx < steps.length - 1 && (
            <div className={`h-0.5 w-4 ${idx < currentIdx ? 'bg-brand-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-xs text-text-muted capitalize">{status.replace('_', ' ')}</span>
    </div>
  );
}

export default function CommunityDashboard() {
  const { user, linkedProfile, loading: authLoading, role } = useAuth();
  const navigate = useNavigate();

  // Protect route: redirect users to their correct dashboard if role doesn't match
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    if (!user) return;
    
    // Use linkedProfile role as the source of truth
    const userRole = linkedProfile?.role || role || 'citizen';
    console.log("[CommunityDashboard] Role check:", { userRole, linkedProfileRole: linkedProfile?.role, role });
    
    if (userRole !== 'citizen') {
      console.log("[CommunityDashboard] Redirecting non-citizen role:", userRole);
      if (userRole === 'ngo_admin') navigate('/ngo-dashboard');
      else if (userRole === 'volunteer') navigate('/volunteer-dashboard');
    }
  }, [authLoading, user, role, linkedProfile, navigate]);

  const [myReports, setMyReports] = useState<any[]>([]);
  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');

  const userName = linkedProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading]);

  async function loadData() {
    setLoading(true);
    try {
      const [reports, issues] = await Promise.all([
        getMyReports(user.uid),
        getIssues()
      ]);
      setMyReports(reports);
      setAllIssues(issues);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Stats
  const total = myReports.length;
  const resolved = myReports.filter(r => r.status === 'resolved').length;
  const inProgress = myReports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;
  const pending = myReports.filter(r => r.status === 'reported').length;

  if (authLoading || loading) {
    return (
      <div className="bg-surface-alt min-h-[calc(100vh-72px)] animate-pulse">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-surface-main rounded-2xl border border-border-main p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div className="space-y-3 w-1/3">
              <div className="h-8 bg-border-main rounded w-full"></div>
              <div className="h-4 bg-border-main rounded w-2/3"></div>
            </div>
            <div className="h-12 w-40 bg-border-main rounded-xl"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-surface-main rounded-xl border border-border-main p-4 shadow-sm h-32"></div>
            ))}
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex justify-between">
              <div className="h-6 bg-border-main rounded w-1/4 mb-6"></div>
              <div className="h-8 bg-border-main rounded w-24"></div>
            </div>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-main rounded-xl border border-border-main p-5 h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-alt min-h-[calc(100vh-72px)]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── GREETING HEADER ─────────────────────────────────────────────── */}
        <div className="bg-surface-main rounded-2xl border border-border-main p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h1 className="text-3xl font-serif font-bold text-text-main mb-1">
              Hi, {userName} 👋
            </h1>
            <p className="text-text-muted">Track and report issues in your community.</p>
          </div>
          <Link
            to="/report"
            className="flex items-center gap-2 bg-brand-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-800 transition-all hover:scale-105 shadow-lg shadow-brand-900/20 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" /> Report New Issue
          </Link>
        </div>

        {/* ── STATS ROW ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Reported', value: total, icon: FileText, color: 'text-brand-900 bg-brand-50' },
            { label: 'Pending', value: pending, icon: Clock, color: 'text-blue-600 bg-blue-50' },
            { label: 'In Progress', value: inProgress, icon: Activity, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-main rounded-xl border border-border-main p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-text-main">{stat.value}</p>
              <p className="text-xs text-text-muted font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── MY REPORTS + MAP TOGGLE ─────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-main">My Reports</h2>
            <div className="flex gap-1 bg-surface-main border border-border-main rounded-lg p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeView === 'list' ? 'bg-brand-900 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                List
              </button>
              <button
                onClick={() => setActiveView('map')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeView === 'map' ? 'bg-brand-900 text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                Map
              </button>
            </div>
          </div>

          {/* MAP VIEW */}
          {activeView === 'map' && (
            <div className="rounded-2xl overflow-hidden border border-border-main shadow-sm h-72">
              <MapView issues={allIssues} />
            </div>
          )}

          {/* LIST VIEW */}
          {activeView === 'list' && (
            <>
              {myReports.length === 0 ? (
                <div className="bg-surface-main rounded-2xl border-2 border-dashed border-border-main p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-text-muted opacity-50" />
                  </div>
                  <h3 className="font-bold text-text-main mb-1">No reports yet</h3>
                  <p className="text-text-muted text-sm mb-5">You haven't reported any issues yet. See something wrong?</p>
                  <Link
                    to="/report"
                    className="inline-flex items-center gap-2 bg-brand-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-brand-800 transition"
                  >
                    <Plus className="h-4 w-4" /> Report First Issue
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReports.map(report => {
                    const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.reported;
                    const urgencyCfg = URGENCY_CONFIG[report.urgency] || URGENCY_CONFIG.medium;
                    return (
                      <div
                        key={report.id}
                        className="bg-surface-main rounded-xl border border-border-main p-5 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-text-main truncate">{report.title}</h3>
                            <p className="text-xs text-text-muted mt-0.5 capitalize">
                              {report.category} · {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${urgencyCfg.color}`}>
                              {urgencyCfg.label}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                        <StatusTimeline status={report.status} />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── QUICK LINKS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/community"
            className="bg-surface-main border border-border-main rounded-xl p-5 flex items-center justify-between hover:border-brand-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <MapPin className="h-5 w-5 text-brand-900" />
              </div>
              <div>
                <p className="font-bold text-text-main text-sm">Community Map</p>
                <p className="text-xs text-text-muted">See all issues near you</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-brand-900 transition-colors" />
          </Link>

          <Link
            to="/report"
            className="bg-brand-900 rounded-xl p-5 flex items-center justify-between hover:bg-brand-800 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Report an Issue</p>
                <p className="text-xs text-white/70">Takes less than a minute</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
          </Link>
        </div>

      </div>
    </div>
  );
}
