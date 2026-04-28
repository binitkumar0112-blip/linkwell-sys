// @ts-nocheck
import { useState, useEffect } from "react";
import { AlertCircle, MapPin, Clock, Loader2, ExternalLink, HandHelping, Building2, AlertTriangle } from "lucide-react";
import { SeverityBadge, CategoryBadge } from "../components/ui/badges";
import { ngoNetworkService, EscalatedAlert } from "../services/ngoNetworkService";
import { getUserFriendlyError } from "../lib/errorMessages";

export default function AlertPanel() {
  const [alerts, setAlerts] = useState<EscalatedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError(null);
    try {
      const data = await ngoNetworkService.getEscalatedAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error("[AlertPanel] Failed to load alerts:", getUserFriendlyError(err));
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  const handleAccept = async (alertId: string) => {
    setAcceptingId(alertId);
    // UI-only for now — just mark it visually
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setAcceptingId(null);
    }, 800);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex-1 bg-surface-alt p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-72 animate-pulse" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                <div className="h-5 w-64 bg-slate-200 rounded" />
              </div>
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-3/4 bg-slate-100 rounded" />
              <div className="flex gap-3 mt-4">
                <div className="h-10 w-32 bg-slate-200 rounded-xl" />
                <div className="h-10 w-28 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-surface-alt p-4 md:p-8 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 text-red-600 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-mono text-sm tracking-widest font-medium uppercase">Cross-NGO Alert Network</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 leading-tight mb-2">
            Escalated Cases
          </h1>
          <p className="text-slate-500">
            Requests from other NGOs that require immediate resource sharing.
            {alerts.length > 0 && <span className="font-semibold text-slate-700"> {alerts.length} open alert{alerts.length !== 1 ? 's' : ''}.</span>}
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-white border border-red-200 bg-red-50 rounded-2xl p-5">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">{error}</p>
                <button onClick={loadAlerts} className="text-sm underline text-red-600 hover:text-red-800 mt-1">Try again</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!error && alerts.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center py-16 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-7 w-7 text-green-500" />
            </div>
            <p className="font-bold text-slate-700 text-lg mb-1">No escalated cases right now</p>
            <p className="text-sm text-slate-400">When other NGOs escalate cases, they will appear here.</p>
          </div>
        )}

        {/* Alert cards */}
        {!error && alerts.map(alert => {
          const issue = alert.issues;
          const ngoName = alert.ngos?.name || 'Unknown NGO';
          const isHighUrgency = alert.urgency === 'critical' || alert.urgency === 'high';

          return (
            <div
              key={alert.id}
              className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${isHighUrgency ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-amber-400'}`}
            >
              <div className="space-y-4">
                {/* Top row: urgency + title */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={alert.urgency} />
                      {issue?.category && <CategoryBadge category={issue.category} />}
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">
                      {issue?.title || 'Untitled Issue'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(alert.created_at)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed">
                  {issue?.description || alert.message || 'No description provided.'}
                </p>

                {/* Escalation reason */}
                {alert.message && issue?.description && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">Escalation Reason</p>
                    <p className="text-sm text-amber-800">{alert.message}</p>
                  </div>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Escalated by <span className="text-slate-700">{ngoName}</span>
                  </span>
                  {issue?.latitude != null && issue?.longitude != null && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {issue.latitude.toFixed(3)}, {issue.longitude.toFixed(3)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    disabled={acceptingId === alert.id}
                    onClick={() => handleAccept(alert.id)}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                  >
                    {acceptingId === alert.id && (
                      <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    )}
                    <HandHelping className="h-4 w-4" />
                    Accept Request
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 border-2 border-indigo-200 font-semibold rounded-xl px-5 py-2.5 text-sm hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
