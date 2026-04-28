import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, FileText, Home, Users, CheckCircle, Clock, AlertCircle, MapPin, X, Share2, PlusCircle, TrendingUp, Inbox, Award, Mail, Phone, ShieldCheck, Building2 } from "lucide-react";
import { SeverityBadge, StatusBadge, CategoryBadge } from "../components/ui/badges";
import { useAuth } from "../hooks/useAuth";
import { ngoDashboardService, Issue, DashboardStats, Volunteer, TaskSubmission } from "../services/ngoDashboardService";
import { ngoNetworkService, NgoResource } from "../services/ngoNetworkService";
import { getUserFriendlyError } from "../lib/errorMessages";
import NGOQuestionnaire from "../components/NGOQuestionnaire";

export default function NgoDashboard() {
  const { user, linkedProfile, role, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Protect route: ensure only NGO admins stay on this page
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (role !== 'ngo_admin') {
      if (role === 'volunteer') navigate('/volunteer-dashboard');
      else navigate('/citizen-dashboard');
    }
  }, [authLoading, user, role, navigate]);
  
  const [activeTab, setActiveTab] = useState<'incoming' | 'claimed' | 'volunteers' | 'network' | 'verifications'>('incoming');
  const [loading, setLoading] = useState(true);
  const [ngoId, setNgoId] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({ total: 0, claimed: 0, inProgress: 0, resolved: 0 });
  const [incomingIssues, setIncomingIssues] = useState<Issue[]>([]);
  const [claimedIssues, setClaimedIssues] = useState<(Issue & { assignment_id: string, assigned_volunteer_id: string | null })[]>([]);
  const [volunteers, setVolunteers] = useState<(Volunteer & { name: string; email?: string })[]>([]);
  const [networkResources, setNetworkResources] = useState<NgoResource[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<TaskSubmission[]>([]);
  const [showNgoQuestionnaire, setShowNgoQuestionnaire] = useState(() =>
    localStorage.getItem('signup_portal') === 'ngo' && localStorage.getItem('is_new_signup') === 'true'
  );
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedIssueIdForAssign, setSelectedIssueIdForAssign] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Volunteer detail modal
  const [volunteerDetailOpen, setVolunteerDetailOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<(Volunteer & { name: string; email?: string }) | null>(null);

  // Network Resource Post Modal
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    category: 'other',
    description: '',
    quantity: 1
  });

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;
      setLoading(true);
      // Use assigned_ngo_id from global Supabase profile
      const nId = linkedProfile?.assigned_ngo_id || null;
      setNgoId(nId);

      // Verification check has been disabled to allow instant NGO access

      const [inIssues, vols, netRes] = await Promise.all([
        ngoDashboardService.getIncomingIssues(),
        ngoDashboardService.getAvailableVolunteers(),
        ngoNetworkService.getNetworkResources()
      ]);
      
      setIncomingIssues(inIssues);
      setVolunteers(vols);
      setNetworkResources(netRes);

      if (nId) {
        const [cIssues, st, pVerifs] = await Promise.all([
          ngoDashboardService.getClaimedIssues(nId),
          ngoDashboardService.getStats(nId),
          ngoDashboardService.getPendingVerifications(nId)
        ]);
        setClaimedIssues(cIssues);
        setStats(st);
        setPendingVerifications(pVerifs);
      } else {
        console.warn('[NgoDashboard] NGO access is enabled, but no NGO profile ID is assigned yet.');
      }
      
      setLoading(false);
    }
    loadDashboard();
  }, [user, linkedProfile]);

  const handleClaim = async (issueId: string) => {
    if (!ngoId) {
      alert("Please complete your NGO profile first to claim issues.");
      return;
    }
    setActionLoading(issueId);
    try {
      await ngoDashboardService.claimIssue(issueId, ngoId);
      // Refresh data
      const [inIssues, cIssues, st, pVerifs] = await Promise.all([
        ngoDashboardService.getIncomingIssues(),
        ngoDashboardService.getClaimedIssues(ngoId),
        ngoDashboardService.getStats(ngoId),
        ngoDashboardService.getPendingVerifications(ngoId)
      ]);
      setIncomingIssues(inIssues);
      setClaimedIssues(cIssues);
      setStats(st);
      setPendingVerifications(pVerifs);
      setActiveTab('claimed');
    } catch (e: any) {
      alert("Failed to claim issue: " + getUserFriendlyError(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyTask = async (submissionId: string, issueId: string, volunteerId: string, action: 'approve' | 'reject') => {
    if (!ngoId) return;
    setActionLoading(submissionId);
    try {
      await ngoDashboardService.verifyTask(submissionId, issueId, volunteerId, ngoId, action);
      
      // Refresh Data
      const [cIssues, st, pVerifs] = await Promise.all([
        ngoDashboardService.getClaimedIssues(ngoId),
        ngoDashboardService.getStats(ngoId),
        ngoDashboardService.getPendingVerifications(ngoId)
      ]);
      setClaimedIssues(cIssues);
      setStats(st);
      setPendingVerifications(pVerifs);
    } catch (e: any) {
      alert(`Failed to ${action} task: ` + getUserFriendlyError(e));
    } finally {
      setActionLoading(null);
    }
  };

  const openAssignModal = (assignmentId: string, issueId: string) => {
    setSelectedAssignmentId(assignmentId);
    setSelectedIssueIdForAssign(issueId);
    setSelectedVolunteerId('');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedAssignmentId || !selectedIssueIdForAssign || !selectedVolunteerId) return;
    setActionLoading('assign');
    try {
      await ngoDashboardService.assignVolunteer(selectedAssignmentId, selectedIssueIdForAssign, selectedVolunteerId);
      
      if (ngoId) {
        const cIssues = await ngoDashboardService.getClaimedIssues(ngoId);
        setClaimedIssues(cIssues);
      }
      setAssignModalOpen(false);
    } catch (e: any) {
      alert("Failed to assign volunteer: " + getUserFriendlyError(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngoId) return;
    
    setActionLoading('post-resource');
    try {
      await ngoNetworkService.postResource(ngoId, newResource);
      
      // Refresh the network feed
      const netRes = await ngoNetworkService.getNetworkResources();
      setNetworkResources(netRes);
      
      setPostModalOpen(false);
      setNewResource({ title: '', category: 'other', description: '', quantity: 1 });
    } catch (e: any) {
      alert("Failed to post resource: " + getUserFriendlyError(e));
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuestionnaireComplete = () => {
    setShowNgoQuestionnaire(false);
    refreshProfile();
  };

  const navItems = [
    { icon: Home, label: 'Overview', active: activeTab !== 'volunteers' && activeTab !== 'network', to: '/ngo-dashboard', onClick: undefined },
    { icon: FileText, label: 'OCR Digitization', active: false, to: '/ngo/ocr-upload', onClick: undefined },
    { icon: ShieldCheck, label: 'Proof Review', active: false, badge: pendingVerifications.length, to: '/ngo/verifications', onClick: undefined },
    { icon: Users, label: 'Volunteers', active: activeTab === 'volunteers', to: '#', onClick: () => setActiveTab('volunteers') },
    { icon: Share2, label: 'Network Hub', active: activeTab === 'network', to: '#', onClick: () => setActiveTab('network') },
    { icon: FileText, label: 'Impact Reports', active: false, to: '/ngo/reports', onClick: undefined },
    { icon: Bell, label: 'Network Alerts', active: false, badge: 0, to: '/alerts', onClick: undefined }
  ];

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row flex-1 h-[calc(100vh-72px)] overflow-hidden animate-pulse">
        <aside className="w-full md:w-[240px] shrink-0 border-r border-border-main bg-surface-main p-4 space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-surface-alt rounded w-full"></div>)}
        </aside>
        <main className="flex-1 bg-surface-alt p-4 md:p-8 space-y-8">
          <div className="max-w-[1200px] mx-auto w-full space-y-8">
            <div className="space-y-2">
              <div className="h-10 bg-border-main rounded w-1/3"></div>
              <div className="h-4 bg-border-main rounded w-1/4"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-main border border-border-main rounded-xl"></div>)}
            </div>
            <div className="h-[400px] bg-surface-main border border-border-main rounded-xl"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 h-[calc(100vh-72px)] overflow-hidden">
      
      <aside className="w-full md:w-[240px] shrink-0 border-r border-slate-200 bg-white flex flex-col md:overflow-y-auto">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0"><MapPin className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
            <div><p className="text-xs font-semibold text-slate-400">NGO Portal</p><p className="text-sm font-bold text-slate-800 truncate">{linkedProfile?.name || 'Your NGO'}</p></div>
          </div>
        </div>
        <div className="flex md:flex-col gap-1 md:gap-1 p-2 md:p-3 overflow-x-auto md:overflow-x-visible">
          {navItems.map((item, idx) => (
            item.onClick ? (
              <button key={idx} onClick={item.onClick}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all whitespace-nowrap w-full text-left ${item.active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium'}`}>
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={item.active ? 2.5 : 2} />
                <span className="text-[14px]">{item.label}</span>
                {item.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </button>
            ) : (
              <Link key={idx} to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all whitespace-nowrap justify-between ${item.active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium'}`}>
                <div className="flex items-center gap-3">
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={item.active ? 2.5 : 2} />
                  <span className="text-[14px]">{item.label}</span>
                </div>
                {item.badge > 0 && <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">{item.badge}</span>}
                {item.active && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </Link>
            )
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-surface-alt overflow-auto p-4 md:p-8">
        <div className="max-w-[1200px] mx-auto w-full space-y-8">
          
          <div>
            <h1 className="text-[32px] font-serif font-bold text-text-main mb-1">
              {activeTab === 'volunteers' ? 'Volunteer Network' : activeTab === 'network' ? 'Cross-NGO Network Hub' : 'NGO Dashboard'}
            </h1>
            <p className="text-[15px] text-text-muted">
              {activeTab === 'volunteers'
                ? `${volunteers.length} registered volunteers in the network.`
                : activeTab === 'network'
                ? `Collaborate and share resources with other verified NGOs.`
                : `Welcome back, ${linkedProfile?.name || 'NGO Admin'}. Here is your workspace overview.`}
            </p>
          </div>

          {activeTab !== 'volunteers' && activeTab !== 'network' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">NGO Profile Questionnaire</h2>
                  <p className="text-sm text-slate-500 mt-1">Set or update your organization name, focus area, and headquarters location.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNgoQuestionnaire(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors whitespace-nowrap"
              >
                Open Questionnaire
              </button>
            </div>
          )}

          {/* ── NETWORK HUB VIEW ──────────────────────────────── */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-brand-50 p-5 rounded-xl border border-brand-100">
                <div>
                  <h3 className="font-bold text-brand-900 text-lg flex items-center gap-2"><Share2 className="h-5 w-5" /> Share Surplus Resources</h3>
                  <p className="text-sm text-brand-700 mt-1">Help other NGOs by listing extra volunteers, medical supplies, or equipment.</p>
                </div>
                <button 
                  onClick={() => setPostModalOpen(true)}
                  className="flex items-center gap-2 bg-brand-900 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-brand-800 transition-colors shadow-sm whitespace-nowrap"
                >
                  <PlusCircle className="h-5 w-5" /> Post Resource
                </button>
              </div>

              <div>
                <h3 className="font-bold text-text-main text-lg mb-4">Available Network Resources</h3>
                {networkResources.length === 0 ? (
                  <div className="text-center py-16 text-text-muted bg-surface-main rounded-xl border border-dashed border-border-main">
                    <Share2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No resources are currently being shared.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {networkResources.map((res: NgoResource) => (
                      <div key={res.id} className="bg-surface-main border border-border-main rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-1 rounded">
                              {res.category}
                            </span>
                            <h4 className="font-bold text-text-main text-lg mt-2">{res.title}</h4>
                            <p className="text-xs text-text-muted mt-1">Shared by <span className="font-bold">{res.ngo?.name}</span></p>
                          </div>
                          <div className="text-center bg-surface-alt rounded p-2 min-w-[60px]">
                            <span className="block text-xl font-bold text-brand-900 leading-none">{res.quantity}</span>
                            <span className="text-[10px] text-text-muted font-bold uppercase">Qty</span>
                          </div>
                        </div>
                        <p className="text-sm text-text-muted mb-4 line-clamp-2">{res.description}</p>
                        <button className="w-full py-2 bg-surface-alt border border-brand-200 text-brand-900 font-bold rounded hover:bg-brand-50 transition-colors text-sm">
                          Request Resource
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── VOLUNTEERS VIEW ──────────────────────────────── */}
          {activeTab === 'volunteers' && (
            <div>
              {volunteers.length === 0 ? (
                <div className="text-center py-24 text-text-muted bg-surface-main rounded-2xl border-2 border-dashed border-border-main shadow-sm">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-bold text-text-main text-lg">No volunteers registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {volunteers.map((vol: any) => {
                    const trustColor =
                      vol.trust_level === 'Community Leader' ? 'bg-purple-100 text-purple-700' :
                      vol.trust_level === 'Trusted' ? 'bg-green-100 text-green-700' :
                      vol.trust_level === 'Verified' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600';
                    const isAvail = (vol.availability_status || 'available') === 'available';
                    return (
                      <div key={vol.id} onClick={() => { setSelectedVolunteer(vol); setVolunteerDetailOpen(true); }} className="bg-surface-main border border-border-main rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4 cursor-pointer hover:border-indigo-300 hover:-translate-y-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                              <span className="text-brand-900 font-bold text-lg">{(vol.name || 'V')[0].toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-bold text-text-main text-[15px]">{vol.name || 'Unnamed Volunteer'}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trustColor}`}>{vol.trust_level || 'New'}</span>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full ${isAvail ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            {isAvail ? 'Available' : 'Busy'}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-text-muted">Trust Score</span>
                            <span className="text-brand-900">{vol.trust_score || 0} pts</span>
                          </div>
                          <div className="w-full bg-surface-alt rounded-full h-1.5">
                            <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((vol.trust_score || 0) % 50) * 2)}%` }} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-text-muted border-t border-border-main pt-3">
                          <span>✅ {vol.tasks_completed || 0} tasks done</span>
                          {vol.skills && vol.skills.length > 0 && (
                            <span>🛠️ {vol.skills.slice(0, 2).join(', ')}{vol.skills.length > 2 ? '…' : ''}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── OVERVIEW (Stats + Tabs) ──────────────────────── */}
          {activeTab !== 'volunteers' && activeTab !== 'network' && (<>
          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, label: 'Total Issues', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50', val: 'text-slate-900' },
              { icon: CheckCircle, label: 'Claimed', value: stats.claimed, color: 'text-indigo-600', bg: 'bg-indigo-50', val: 'text-indigo-700' },
              { icon: Clock, label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50', val: 'text-amber-700' },
              { icon: FileText, label: 'Verifications', value: stats.pendingVerifications || pendingVerifications.length, color: 'text-blue-600', bg: 'bg-blue-50', val: 'text-blue-700' },
              { icon: Award, label: 'Resolved', value: stats.resolved, color: 'text-emerald-600', bg: 'bg-emerald-50', val: 'text-emerald-700' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
                </div>
                <p className={`text-3xl font-bold leading-none ${s.val}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex border-b border-slate-200 px-4 bg-slate-50">
              <button onClick={() => setActiveTab('incoming')}
                className={`h-12 px-6 text-[13px] font-bold tracking-wide border-b-[3px] transition-colors ${activeTab === 'incoming' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                Incoming
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'incoming' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{incomingIssues.length}</span>
              </button>
              <button onClick={() => setActiveTab('claimed')}
                className={`h-12 px-6 text-[13px] font-bold tracking-wide border-b-[3px] transition-colors ${activeTab === 'claimed' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                Claimed
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'claimed' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{claimedIssues.length}</span>
              </button>
              <button onClick={() => setActiveTab('verifications')}
                className={`h-12 px-6 text-[13px] font-bold tracking-wide border-b-[3px] transition-colors ${activeTab === 'verifications' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                Verifications
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'verifications' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{pendingVerifications.length}</span>
              </button>
            </div>

            <div className="p-5 flex-1 bg-slate-50/40">
              {activeTab === 'incoming' && (
                <div className="space-y-3">
                  {incomingIssues.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Inbox className="h-6 w-6 text-slate-400" /></div>
                      <p className="font-bold text-slate-700 mb-1">No incoming issues</p>
                      <p className="text-sm text-slate-400">New community reports will appear here.</p>
                    </div>
                  ) : (
                    incomingIssues.map(issue => {
                      const border = issue.urgency === 'critical' ? 'border-l-red-500' : issue.urgency === 'high' ? 'border-l-orange-500' : 'border-l-amber-400';
                      return (
                      <div key={issue.id} className={`bg-white border border-slate-200 border-l-4 ${border} rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <SeverityBadge severity={issue.urgency as any} />
                            {issue.category && <CategoryBadge category={issue.category} />}
                          </div>
                          <h3 className="font-bold text-[16px] text-slate-900">{issue.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium flex-wrap">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {issue.latitude?.toFixed(2)}, {issue.longitude?.toFixed(2)}</span>
                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                            {issue.priority_score > 0 && <span className="font-semibold text-indigo-600">Priority: {issue.priority_score}</span>}
                            {issue.upvotes_count > 0 && <span className="font-semibold text-blue-600">👍 {issue.upvotes_count}</span>}
                          </div>
                        </div>
                        <button onClick={() => handleClaim(issue.id)} disabled={actionLoading}
                          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">
                          Claim Issue
                        </button>
                      </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'claimed' && (
                <div className="space-y-3">
                  {claimedIssues.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-6 w-6 text-slate-400" /></div>
                      <p className="font-bold text-slate-700 mb-1">Nothing claimed yet</p>
                      <p className="text-sm text-slate-400">Browse incoming issues to start managing them.</p>
                    </div>
                  ) : (
                    claimedIssues.map(issue => (
                      <div key={issue.id} className="bg-white border border-slate-200 border-l-4 border-l-indigo-500 rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <StatusBadge status={issue.status as any} />
                            <SeverityBadge severity={issue.urgency as any} />
                          </div>
                          <h3 className="font-bold text-[16px] text-slate-900">{issue.title}</h3>
                          <p className="text-sm text-slate-500 line-clamp-2 max-w-2xl">{issue.description}</p>
                        </div>
                        <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-2">
                          {issue.assigned_volunteer_id ? (
                            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 text-sm font-bold flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" /> Volunteer Assigned
                            </div>
                          ) : (
                            <button onClick={() => openAssignModal(issue.assignment_id, issue.id)}
                              className="w-full bg-white border-2 border-indigo-500 text-indigo-700 font-bold px-6 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                              Assign Volunteer
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'verifications' && (
                <div className="space-y-4">
                  {pendingVerifications.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><CheckCircle className="h-6 w-6 text-slate-400" /></div>
                      <p className="font-bold text-slate-700 mb-1">No pending verifications</p>
                      <p className="text-sm text-slate-400">When volunteers submit proof, they will appear here.</p>
                    </div>
                  ) : (
                    pendingVerifications.map(sub => (
                      <div key={sub.id} className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-2xl p-5 flex flex-col lg:flex-row gap-6 shadow-sm">
                        
                        {/* Left: Image Proof */}
                        <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200">
                          <img src={sub.proof_image_url} alt="Proof" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>

                        {/* Middle: Details */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">Pending Review</span>
                              <span className="text-xs text-slate-400 font-semibold">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-bold text-[16px] text-slate-900">{sub.issues?.title || 'Unknown Issue'}</h3>
                            <p className="text-sm text-slate-600 mt-1"><span className="font-semibold text-slate-700">Volunteer:</span> {sub.users?.name || 'Unknown'}</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <p className="text-sm text-slate-700 italic">"{sub.description}"</p>
                          </div>
                          {sub.latitude && sub.longitude && (
                            <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Location attached
                            </p>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="w-full lg:w-auto shrink-0 flex flex-col lg:justify-center gap-2">
                          <button 
                            disabled={actionLoading === sub.id}
                            onClick={() => handleVerifyTask(sub.id, sub.issue_id, sub.volunteer_id, 'approve')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" /> Approve & Resolve
                          </button>
                          <button 
                            disabled={actionLoading === sub.id}
                            onClick={() => handleVerifyTask(sub.id, sub.issue_id, sub.volunteer_id, 'reject')}
                            className="w-full bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold px-6 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          </>)}
        </div>
      </main>

      {/* Volunteer Detail Modal */}
      {showNgoQuestionnaire && user && (
        <NGOQuestionnaire
          userId={user.uid}
          onComplete={handleQuestionnaireComplete}
          onCancel={() => setShowNgoQuestionnaire(false)}
        />
      )}

      {/* Volunteer Detail Modal */}
      {volunteerDetailOpen && selectedVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setVolunteerDetailOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white relative">
              <button onClick={() => setVolunteerDetailOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-2xl">{(selectedVolunteer.name || 'V')[0].toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="font-bold text-xl">{selectedVolunteer.name || 'Unknown Volunteer'}</h2>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedVolunteer.trust_level === 'Community Leader' ? 'bg-purple-200 text-purple-900' :
                    selectedVolunteer.trust_level === 'Trusted' ? 'bg-green-200 text-green-900' :
                    selectedVolunteer.trust_level === 'Verified' ? 'bg-blue-200 text-blue-900' :
                    'bg-white/20 text-white'
                  }`}>{selectedVolunteer.trust_level || 'New'}</span>
                  <span className={`ml-2 text-xs font-bold px-2.5 py-1 rounded-full ${(selectedVolunteer.availability_status || 'available') === 'available' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'}`}>
                    {(selectedVolunteer.availability_status || 'available') === 'available' ? '● Available' : '● Busy'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Information</h3>
              <div className="space-y-3">
                {selectedVolunteer.email && (
                  <a href={`mailto:${selectedVolunteer.email}`} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <Mail className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-semibold text-indigo-700">{selectedVolunteer.email}</p>
                    </div>
                  </a>
                )}
                {!selectedVolunteer.email && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-slate-400">Not available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{selectedVolunteer.trust_score || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Trust Score</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{selectedVolunteer.tasks_completed || 0}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks Done</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-emerald-600">
                    {(selectedVolunteer.availability_status || 'available') === 'available' ? 'Yes' : 'No'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Available</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            {selectedVolunteer.skills && selectedVolunteer.skills.length > 0 && (
              <div className="px-6 pb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVolunteer.skills.map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests */}
            {selectedVolunteer.interests && selectedVolunteer.interests.length > 0 && (
              <div className="px-6 pb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVolunteer.interests.map((interest: string, i: number) => (
                    <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              {selectedVolunteer.email && (
                <a
                  href={`mailto:${selectedVolunteer.email}`}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  <Mail className="h-4 w-4" /> Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Volunteer Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-main w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-surface-alt">
              <h2 className="font-serif font-bold text-xl">Assign Volunteer</h2>
              <button onClick={() => setAssignModalOpen(false)} className="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-surface-main transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-muted">Select an available volunteer to handle this issue.</p>
              
              <div className="space-y-2">
                {volunteers.length === 0 ? (
                  <div className="p-4 border border-border-main bg-surface-alt text-center text-sm text-text-muted rounded">No volunteers available.</div>
                ) : (
                  <select 
                    value={selectedVolunteerId}
                    onChange={(e) => setSelectedVolunteerId(e.target.value)}
                    className="w-full border-2 border-border-main bg-surface-main p-3 rounded font-medium focus:border-brand-900 outline-none"
                  >
                    <option value="">-- Choose a volunteer --</option>
                    {volunteers.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} • {v.trust_level || 'New'} ({v.tasks_completed || 0} tasks)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-border-main bg-surface-alt flex justify-end gap-3">
              <button onClick={() => setAssignModalOpen(false)} className="px-4 py-2 font-bold text-text-muted hover:text-text-main transition-colors">Cancel</button>
              <button 
                onClick={handleAssignSubmit}
                disabled={!selectedVolunteerId || actionLoading}
                className="bg-brand-900 text-white px-6 py-2 rounded font-bold hover:bg-brand-800 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Resource Modal */}
      {postModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface-main w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-surface-alt shrink-0">
              <h2 className="font-serif font-bold text-xl">Share a Resource</h2>
              <button onClick={() => setPostModalOpen(false)} className="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-surface-main transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePostResource} className="p-6 space-y-4 overflow-y-auto">
              <p className="text-sm text-text-muted">Post extra volunteers, supplies, or equipment that other NGOs might need.</p>
              
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Title</label>
                  <input 
                    type="text" 
                    required
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    placeholder="e.g. 5 Available Medical Volunteers"
                    className="w-full border-2 border-border-main p-3 rounded font-medium focus:border-brand-900 outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={newResource.category}
                      onChange={(e) => setNewResource({...newResource, category: e.target.value})}
                      className="w-full border-2 border-border-main p-3 rounded font-medium focus:border-brand-900 outline-none"
                    >
                      <option value="volunteers">Volunteers</option>
                      <option value="medical">Medical</option>
                      <option value="food">Food</option>
                      <option value="equipment">Equipment</option>
                      <option value="transport">Transport</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      required
                      value={newResource.quantity}
                      onChange={(e) => setNewResource({...newResource, quantity: parseInt(e.target.value)})}
                      className="w-full border-2 border-border-main p-3 rounded font-medium focus:border-brand-900 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={newResource.description}
                    onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                    placeholder="Provide details about the resource or volunteers..."
                    className="w-full border-2 border-border-main p-3 rounded font-medium focus:border-brand-900 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-main flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="px-5 py-2.5 font-bold text-text-muted hover:bg-surface-alt rounded transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="bg-brand-900 text-white font-bold px-6 py-2.5 rounded hover:bg-brand-800 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Posting...' : 'Post Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
