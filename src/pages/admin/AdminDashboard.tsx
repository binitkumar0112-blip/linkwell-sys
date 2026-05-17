// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, NgoApplication } from '../../services/adminService';
import { useAuth } from '../../services/useAuth';
import { Loader2, CheckCircle, XCircle, RotateCcw, Building2, Clock, Eye } from 'lucide-react';

type TabKey = 'pending' | 'approved' | 'rejected';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [applications, setApplications] = useState<NgoApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await adminService.getApplications(activeTab);
      setApplications(data);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const handleApprove = async (app: NgoApplication) => {
    setActionLoading(app.id);
    try {
      await adminService.approveApplication(app.id, user?.email || 'admin');
      await fetchApplications();
    } catch (err) {
      alert('Failed to approve: ' + (err as any).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (app: NgoApplication) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(app.id);
    try {
      await adminService.rejectApplication(app.id, reason, user?.email || 'admin');
      await fetchApplications();
    } catch (err) {
      alert('Failed to reject: ' + (err as any).message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (app: NgoApplication) => {
    if (!confirm('Revoke this approval? The NGO will be set back to pending.')) return;
    setActionLoading(app.id);
    try {
      await adminService.revokeApplication(app.id, user?.email || 'admin');
      await fetchApplications();
    } catch (err) {
      alert('Failed to revoke: ' + (err as any).message);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: TabKey; label: string; icon: any; color: string }[] = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600' },
    { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-green-600' },
    { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">Manage NGO verification applications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">No {activeTab} applications found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Organization</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Verification ID</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900 text-sm">{app.org_name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                        {app.verification_id}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{app.contact_email}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* View detail */}
                        <button
                          onClick={() => navigate(`/admin/ngo/${app.verification_id}`)}
                          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </button>

                        {activeTab === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={actionLoading === app.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {actionLoading === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(app)}
                              disabled={actionLoading === app.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                            >
                              {actionLoading === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                              Reject
                            </button>
                          </>
                        )}

                        {activeTab === 'approved' && (
                          <button
                            onClick={() => handleRevoke(app)}
                            disabled={actionLoading === app.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                          >
                            {actionLoading === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
