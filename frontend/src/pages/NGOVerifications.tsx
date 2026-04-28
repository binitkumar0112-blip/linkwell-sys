// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Loader2, MapPin, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ngoDashboardService, TaskSubmission } from '../services/ngoDashboardService';
import { getUserFriendlyError } from '../lib/errorMessages';

export default function NGOVerifications() {
  const { user, linkedProfile, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [ngoId, setNgoId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (role !== 'ngo_admin') {
      navigate(role === 'volunteer' ? '/volunteer-dashboard' : '/citizen-dashboard', { replace: true });
    }
  }, [authLoading, user, role, navigate]);

  useEffect(() => {
    if (authLoading || !user || role !== 'ngo_admin') return;
    loadVerifications();
  }, [authLoading, user, role, linkedProfile]);

  async function loadVerifications() {
    setLoading(true);
    try {
      const resolvedNgoId = linkedProfile?.assigned_ngo_id || await ngoDashboardService.getNgoProfileId(user.uid);
      setNgoId(resolvedNgoId);
      if (!resolvedNgoId) {
        setSubmissions([]);
        return;
      }
      const data = await ngoDashboardService.getPendingVerifications(resolvedNgoId);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load verifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(sub: TaskSubmission, action: 'approve' | 'reject') {
    if (!ngoId) return;
    setActionLoading(sub.id);
    try {
      await ngoDashboardService.verifyTask(sub.id, sub.issue_id, sub.volunteer_id, ngoId, action);
      await loadVerifications();
    } catch (err: any) {
      alert(`Failed to ${action} proof: ` + getUserFriendlyError(err));
    } finally {
      setActionLoading(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-8">
        <div className="max-w-[1180px] mx-auto space-y-4 animate-pulse">
          <div className="h-10 w-72 bg-slate-200 rounded" />
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white border border-slate-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/ngo-dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-700 mb-3">
              <ArrowLeft className="h-4 w-4" /> NGO Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-indigo-600" /> Volunteer Proof Review
            </h1>
            <p className="text-slate-500 mt-1">Approve or reject proof submitted by volunteers for your claimed issues.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
            <p className="text-3xl font-bold text-indigo-600 leading-none mt-1">{submissions.length}</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-24 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <p className="font-bold text-slate-800 text-lg">No pending proofs</p>
            <p className="text-sm text-slate-400 mt-1">Volunteer submissions will appear here when they are ready for review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_210px]">
                  <div className="bg-slate-100 min-h-[220px] lg:min-h-full">
                    <img src={sub.proof_image_url} alt="Volunteer proof" className="w-full h-full max-h-[320px] lg:max-h-none object-cover" />
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                        <Clock className="h-3.5 w-3.5" /> Pending Review
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{sub.issues?.title || 'Unknown issue'}</h2>
                      <p className="text-sm text-slate-500 mt-1">{sub.issues?.description || 'No issue description available.'}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Volunteer</p>
                        <p className="text-sm font-bold text-slate-800 mt-1">{sub.users?.name || 'Unknown volunteer'}</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proof Location</p>
                        <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-indigo-500" />
                          {sub.latitude && sub.longitude ? `${sub.latitude.toFixed(3)}, ${sub.longitude.toFixed(3)}` : 'Not attached'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Volunteer Notes</p>
                      <p className="text-sm text-indigo-900">{sub.description || 'No notes added.'}</p>
                    </div>
                  </div>

                  <div className="p-5 border-t lg:border-t-0 lg:border-l border-slate-100 flex lg:flex-col gap-3 lg:justify-center">
                    <button
                      disabled={actionLoading === sub.id}
                      onClick={() => handleVerify(sub, 'approve')}
                      className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Approve
                    </button>
                    <button
                      disabled={actionLoading === sub.id}
                      onClick={() => handleVerify(sub, 'reject')}
                      className="flex-1 lg:flex-none bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
