// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService, NgoApplication } from '../../services/adminService';
import { useAuth } from '../../services/useAuth';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Building2, Mail, Phone, Globe, MapPin, FileText, Calendar, User } from 'lucide-react';

export default function AdminNgoDetail() {
  const { verificationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [app, setApp] = useState<NgoApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!verificationId) return;
    adminService.getApplicationByVerificationId(verificationId).then(data => {
      setApp(data);
      setLoading(false);
    });
  }, [verificationId]);

  const handleApprove = async () => {
    if (!app) return;
    setActionLoading(true);
    try {
      await adminService.approveApplication(app.id, user?.email || 'admin');
      setApp({ ...app, status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user?.email || 'admin' });
    } catch (err) {
      alert('Failed: ' + (err as any).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!app || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await adminService.rejectApplication(app.id, rejectReason, user?.email || 'admin');
      setApp({ ...app, status: 'rejected', rejection_reason: rejectReason, reviewed_at: new Date().toISOString(), reviewed_by: user?.email || 'admin' });
      setRejectMode(false);
    } catch (err) {
      alert('Failed: ' + (err as any).message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Application not found.</p>
          <button onClick={() => navigate('/admin/dashboard')} className="text-indigo-600 font-semibold">← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const statusBadge = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }[app.status];

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-slate-900 font-medium mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{app.org_name}</h1>
                  <span className="font-mono text-xs font-bold text-purple-700">{app.verification_id}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                {app.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6">
            <DetailRow icon={Mail} label="Contact Email" value={app.contact_email} />
            <DetailRow icon={Phone} label="Phone" value={app.contact_phone} />
            <DetailRow icon={FileText} label="Registration Number" value={app.registration_number} />
            <DetailRow icon={MapPin} label="Address" value={app.address} />
            <DetailRow icon={Globe} label="Website" value={app.website} />
            <DetailRow icon={Calendar} label="Submitted" value={new Date(app.submitted_at).toLocaleString()} />
            {app.reviewed_by && (
              <DetailRow icon={User} label="Reviewed By" value={`${app.reviewed_by} on ${new Date(app.reviewed_at!).toLocaleString()}`} />
            )}

            {app.description && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed">{app.description}</p>
              </div>
            )}

            {app.rejection_reason && (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Rejection Reason</p>
                <p className="text-sm text-red-800">{app.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {app.status === 'pending' && (
            <div className="p-6 border-t border-slate-100 bg-slate-50">
              {rejectMode ? (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => { setRejectMode(false); setRejectReason(''); }}
                      className="px-4 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={actionLoading}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
