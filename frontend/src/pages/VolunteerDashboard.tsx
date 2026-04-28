// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { volunteerDashboardService, AssignedTask, Volunteer } from '../services/volunteerDashboardService';
import { CheckCircle2, MapPin, Loader2, Calendar, Star, Activity, ArrowRight, Clock, TrendingUp, Award, UploadCloud, X, Camera, FileText } from 'lucide-react';
import { SeverityBadge, StatusBadge, CategoryBadge } from '../components/ui/badges';
import Questionnaire from '../components/Questionnaire';
import { getCityName } from '../lib/geocode';
import { getUserFriendlyError } from '../lib/errorMessages';
import { DashboardPageSkeleton } from '../components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';

const TRUST_LEVELS: Record<string, { next: number; label: string; color: string; bg: string }> = {
  'New':              { next: 10,  label: 'New',              color: 'text-slate-600',  bg: 'bg-slate-100' },
  'Verified':         { next: 30,  label: 'Verified',         color: 'text-blue-700',   bg: 'bg-blue-100' },
  'Trusted':          { next: 60,  label: 'Trusted',          color: 'text-emerald-700',bg: 'bg-emerald-100' },
  'Community Leader': { next: 100, label: 'Community Leader', color: 'text-purple-700', bg: 'bg-purple-100' },
};

function TrustProgressRing({ score, level }: { score: number; level: string }) {
  const config = TRUST_LEVELS[level] || TRUST_LEVELS['New'];
  const pct = Math.min(100, Math.round((score % config.next) / config.next * 100));
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="#4F46E5" strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-800">{pct}%</span>
        </div>
      </div>
      <div>
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg} ${config.color}`}>{config.label}</span>
        <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{score} pts</p>
        <p className="text-xs text-slate-400 mt-0.5">to next level</p>
      </div>
    </div>
  );
}

function TaskCard({ task, onStart, onSubmitProof, actionLoading, cityName }: any) {
  const isCompleted = task.status === 'resolved' || task.assignment_status === 'completed';
  const isPendingVerification = task.status === 'pending_verification';
  const isInProgress = task.status === 'in_progress' || task.assignment_status === 'in_progress';
  const borderColor = task.urgency === 'critical' ? 'border-l-red-500' : task.urgency === 'high' ? 'border-l-orange-500' : task.urgency === 'medium' ? 'border-l-amber-400' : 'border-l-emerald-500';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderColor} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-bold text-[15px] text-slate-900 leading-snug flex-1">{task.title}</h3>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={task.status} />
          <SeverityBadge severity={task.urgency} />
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2">{task.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {task.category && <CategoryBadge category={task.category} />}
        {cityName && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200">
            <MapPin className="h-3 w-3" /> {cityName}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-200">
          <Calendar className="h-3 w-3" /> {new Date(task.created_at).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-100">
        {isCompleted ? (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4" /> Task Completed
          </div>
        ) : isPendingVerification ? (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 rounded-xl font-semibold text-sm border border-amber-200">
            <Clock className="h-4 w-4" /> Pending Verification
          </div>
        ) : isInProgress ? (
          <button disabled={actionLoading === task.id} onClick={() => onSubmitProof(task)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
            {actionLoading === task.id ? <Loader2 className="animate-spin h-4 w-4" /> : <><UploadCloud className="h-4 w-4" /> Submit Proof</>}
          </button>
        ) : (
          <button disabled={actionLoading === task.id} onClick={() => onStart(task.id, task.assignment_id)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
            {actionLoading === task.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Start Work'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VolunteerDashboard() {
  const { user, linkedProfile, loading: authLoading, role } = useAuth();
  const navigate = useNavigate();

  // Protect route: ensure only volunteers can access this page
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (role !== 'volunteer') {
      if (role === 'ngo_admin') navigate('/ngo-dashboard');
      else navigate('/citizen-dashboard');
    }
  }, [authLoading, user, role, navigate]);
  const [loading, setLoading] = useState(true);
  const [volunteerProfile, setVolunteerProfile] = useState<Volunteer | null>(null);
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cityNames, setCityNames] = useState<Record<string, string>>({});
  
  const [selectedTaskForProof, setSelectedTaskForProof] = useState<AssignedTask | null>(null);
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofDesc, setProofDesc] = useState('');

  useEffect(() => {
    if (authLoading) return;
    loadDashboard();
  }, [user, authLoading]);

  async function loadDashboard() {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await volunteerDashboardService.getVolunteerProfile(user.uid);
      setVolunteerProfile(profile);
      if (profile) {
        const tasks = await volunteerDashboardService.getMyAssignedTasks(profile.id);
        const urgencyOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const sorted = tasks.sort((a, b) => {
          const uA = urgencyOrder[a.urgency?.toLowerCase()] || 0;
          const uB = urgencyOrder[b.urgency?.toLowerCase()] || 0;
          return uA !== uB ? uB - uA : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setMyTasks(sorted);
        const cityMap: Record<string, string> = {};
        await Promise.all(sorted.map(async task => {
          if (task.latitude && task.longitude) cityMap[task.id] = await getCityName(task.latitude, task.longitude);
        }));
        setCityNames(cityMap);
      }
      // Fetch data directly using Supabase profile data if needed
      // No more custom claim role checks here!
      if (!linkedProfile) {
        setLoading(false);
        return;
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleStartWork = async (issueId: string, assignmentId: string) => {
    setActionLoading(issueId);
    try { await volunteerDashboardService.startTask(issueId, assignmentId); await loadDashboard(); }
    catch (e: any) { alert('Failed to start task: ' + getUserFriendlyError(e)); }
    finally { setActionLoading(null); }
  };

  const handleOpenProofModal = (task: AssignedTask) => {
    setSelectedTaskForProof(task);
    setProofImageFile(null);
    setProofPreview('');
    setProofDesc('');
  };

  const handleCloseProofModal = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setSelectedTaskForProof(null);
    setProofImageFile(null);
    setProofPreview('');
    setProofDesc('');
  };

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofImageFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForProof || !user || !proofImageFile) return;
    setActionLoading(selectedTaskForProof.id);
    try {
      const proofImage = await readFileAsDataUrl(proofImageFile);
      await volunteerDashboardService.submitTaskProof(
        selectedTaskForProof.id, 
        user.uid, 
        proofImage, 
        proofDesc,
        selectedTaskForProof.latitude,
        selectedTaskForProof.longitude
      );
      handleCloseProofModal();
      await loadDashboard();
    } catch (err: any) {
      alert("Failed to submit proof: " + getUserFriendlyError(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) return <DashboardPageSkeleton />;

  if (!volunteerProfile && user) {
    return (
      <div className="flex-1 bg-slate-50 h-[calc(100vh-64px)] overflow-auto relative">
        <Questionnaire userId={user.uid} onComplete={() => window.location.reload()} />
      </div>
    );
  }

  const trust = volunteerProfile?.trust_level || 'New';
  const score = volunteerProfile?.trust_score || 0;
  const completed = myTasks.filter(t => t.status === 'resolved' || t.assignment_status === 'completed').length;
  const active = myTasks.filter(t =>
    t.assignment_status === 'in_progress' ||
    t.status === 'in_progress' ||
    t.status === 'pending_verification'
  ).length;
  const isAvail = volunteerProfile?.availability_status === 'available';
  const name = linkedProfile?.name || user?.email?.split('@')[0] || 'Volunteer';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">

      {/* ── Gradient Header Banner ────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {initials}
              </div>
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-0.5">Volunteer Dashboard</p>
                <h1 className="text-2xl font-bold text-white">Welcome back, {name.split(' ')[0]}!</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAvail ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAvail ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              </span>
              <span className="font-bold text-sm text-white capitalize">{volunteerProfile?.availability_status || 'Available'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Stats + Trust Row ─────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-4">
          {/* Trust Score card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:col-span-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Trust Score</p>
            <TrustProgressRing score={score} level={trust} />
          </div>

          {/* Completed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed</p>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 leading-none">{volunteerProfile?.tasks_completed || 0}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Tasks resolved</p>
          </div>

          {/* Active */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Now</p>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-indigo-600 leading-none">{active}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">In progress / awaiting review</p>
          </div>
        </div>

        {/* ── My Tasks ─────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">My Assigned Tasks</h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{myTasks.length}</span>
            </div>
          </div>

          {myTasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">All caught up!</h3>
              <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">No active tasks assigned to you right now. Explore nearby issues to make an impact.</p>
              <Link to="/community"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all">
                Explore Nearby Issues <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {myTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartWork}
                  onSubmitProof={handleOpenProofModal}
                  actionLoading={actionLoading}
                  cityName={cityNames[task.id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── OCR Document Digitization Card ─────────────────────── */}
        <section>
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-cyan-700" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Digitize Paper Reports (OCR)</h3>
                  <p className="text-sm text-slate-600 mt-1">Upload photographed field surveys or handwritten reports to automatically extract text and create issues.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/volunteer/ocr-upload')}
                className="inline-flex items-center gap-2 bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all shrink-0"
              >
                Open OCR Scanner <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Activity Timeline ─────────────────────── */}
        {myTasks.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-5">Recent Activity</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {myTasks.slice(0, 5).map((task, i) => {
                const isComp = task.status === 'resolved' || task.assignment_status === 'completed';
                const isIP = task.status === 'in_progress' || task.assignment_status === 'in_progress';
                const dot = isComp ? 'bg-emerald-500' : isIP ? 'bg-amber-500' : 'bg-indigo-500';
                const label = isComp ? 'Completed' : isIP ? 'In Progress' : 'Assigned';
                return (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* Submit Proof Modal */}
      {selectedTaskForProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2"><UploadCloud className="h-5 w-5 text-indigo-600" /> Submit Proof of Work</h2>
              <button onClick={handleCloseProofModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitProof} className="p-6 space-y-5 overflow-y-auto">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                <p className="text-sm text-indigo-800 font-medium">Task: {selectedTaskForProof.title}</p>
                <p className="text-xs text-indigo-600 mt-1">Submit visual proof to mark this task as completed. An NGO admin will review it.</p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Image <span className="text-red-500">*</span></label>
                <label className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
                  proofPreview ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleProofImageChange}
                    className="sr-only"
                  />
                  <div className="h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Camera className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{proofImageFile ? proofImageFile.name : 'Choose proof image'}</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, or WebP up to 5 MB</p>
                  </div>
                </label>
                {proofPreview && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-32 relative">
                    <img src={proofPreview} alt="Proof preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Notes <span className="text-red-500">*</span></label>
                <textarea 
                  required
                  rows={3}
                  value={proofDesc}
                  onChange={(e) => setProofDesc(e.target.value)}
                  placeholder="Describe the work done..."
                  className="w-full border-2 border-slate-200 p-3 rounded-xl font-medium focus:border-indigo-600 outline-none resize-none text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseProofModal}
                  className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading === selectedTaskForProof.id || !proofImageFile || !proofDesc}
                  className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {actionLoading === selectedTaskForProof.id ? <Loader2 className="animate-spin h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                  Submit Proof
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
