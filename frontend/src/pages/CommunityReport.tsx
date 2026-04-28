// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Mic, Paperclip, Send, Loader2, MapPin, CheckCircle2, AlertTriangle, User, List, ChevronRight } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { submitIssueReport, getMyReports } from "../services/citizenReportService";
import { AIService } from "../services/api";
import { getCityName } from '../lib/geocode';
import { getUserFriendlyError } from '../lib/errorMessages';

const CATEGORIES = ['infrastructure', 'health', 'education', 'food', 'rescue', 'other'];

// urgency is now assessed by the AI service

const STATUS_COLORS: Record<string, string> = {
  reported: 'bg-blue-100 text-blue-700',
  assigned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  pending_verification: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
};

export default function CommunityReport() {
  const { user, linkedProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [activeTab, setActiveTab] = useState<'report' | 'my_reports'>('report');
  const [title, setTitle] = useState(() => searchParams.get('title') || '');
  const [description, setDescription] = useState(() => searchParams.get('description') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [successUrgency, setSuccessUrgency] = useState<string | null>(null);
  const [successReason, setSuccessReason] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string>(searchParams.get('locality') || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState('en-IN');
  const [isPrefilled, setIsPrefilled] = useState(!!searchParams.get('source'));

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [successId, setSuccessId] = useState('');
  const [locLoading, setLocLoading] = useState(false);

  // My reports state
  const [myReports, setMyReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-detect location on mount
  useEffect(() => {
    if (!searchParams.get('source')) {
      detectLocation();
    } else {
      // OCR source - keep the locality as city name but still detect coordinates
      setLocLoading(false);
    }
    setupSpeech();
  }, []);

  // Load my reports when tab switches
  useEffect(() => {
    if (activeTab === 'my_reports' && user) {
      loadMyReports();
    }
  }, [activeTab, user]);

  function detectLocation() {
    if (!('geolocation' in navigator)) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const city = await getCityName(latitude, longitude);
        setCityName(city);
        setLocLoading(false);
      },
      () => {
        // Default to Mumbai
        setCoords({ lat: 19.0760, lng: 72.8777 });
        setCityName('Mumbai (default)');
        setLocLoading(false);
      },
      { timeout: 8000 }
    );
  }

  function setupSpeech() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let finals = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finals += event.results[i][0].transcript + ' ';
      }
      if (finals) setDescription(prev => prev + finals);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
        setIsRecording(true);
      } else {
        alert("Speech recognition not supported. Use Chrome.");
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  async function loadMyReports() {
    if (!user) return;
    setReportsLoading(true);
    try {
      const data = await getMyReports(user.uid);
      setMyReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent, forceSubmit = false) => {
    e.preventDefault();
    setErrorMsg('');
    setIsDuplicate(false);
    setIsSubmitting(true);

    try {
      const result = await submitIssueReport({
        title,
        description,
        category,
        latitude: coords?.lat ?? 19.0760,
        longitude: coords?.lng ?? 72.8777,
        reported_by: user?.uid || null,
        contact_email: contactEmail || null,
        photo_url: photoUrl || null,
      });
      setSuccessId(result.id);
      if (result.urgency) setSuccessUrgency(result.urgency);
      if (result.urgency_reason) setSuccessReason(result.urgency_reason);
      // Clear URL params after successful submission
      navigate('/report', { replace: true });
    } catch (err: any) {
      if (err.message === 'DUPLICATE') {
        setIsDuplicate(true);
      } else {
        setErrorMsg(getUserFriendlyError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceSubmit = async () => {
    setIsDuplicate(false);
    setIsSubmitting(true);
    try {
      // Temporarily override duplicate detection by submitting directly (with AI urgency)
      const { supabase } = await import('../lib/supabase');
      // Ask AI for urgency
      let assessed = { urgency: 'medium', reason: 'Not assessed' } as { urgency: string; reason: string };
      try {
        const aiRes = await AIService.assessUrgency(title, description, category || '');
        if (aiRes && typeof aiRes === 'object' && ['low', 'medium', 'high'].includes((aiRes.urgency || '').toLowerCase())) {
          assessed.urgency = aiRes.urgency.toLowerCase();
          assessed.reason = aiRes.reason || '';
        }
      } catch (e) {
        // keep fallback
      }

      const { data, error } = await supabase
        .from('issues')
        .insert([{
          title: title.trim(),
          description: description.trim(),
          category: category.toLowerCase(),
          latitude: coords?.lat ?? 19.0760,
          longitude: coords?.lng ?? 72.8777,
          urgency: assessed.urgency,
          urgency_reason: assessed.reason,
          status: 'reported',
          reported_by: user?.uid || null,
          photo_url: photoUrl || null,
        }])
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      setSuccessId(data.id);
      setSuccessUrgency(assessed.urgency);
      setSuccessReason(assessed.reason);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────────────────
  if (successId) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-surface-alt flex items-center justify-center p-6">
        <div className="bg-surface-main border border-border-main rounded-2xl p-10 max-w-md w-full text-center shadow-lg">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-text-main mb-2">Report Submitted!</h2>
          <p className="text-text-muted mb-2">Your issue has been logged and is now visible to NGOs and volunteers.</p>
          {successUrgency && (
            <p className="text-sm font-semibold mb-1">Urgency: <span className="capitalize">{successUrgency}</span> <span className="text-text-muted">(assessed)</span></p>
          )}
          {successReason && (
            <p className="text-xs text-text-muted mb-3 italic">Reason: {successReason}</p>
          )}
          <p className="text-xs text-text-muted mb-6 font-mono bg-surface-alt px-3 py-2 rounded">
            Reference: {successId.slice(0, 16)}...
          </p>

          {!user && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-bold text-brand-900 mb-1">🔍 Want to track this issue?</p>
              <p className="text-xs text-text-muted mb-3">Login to see real-time status updates on your reports.</p>
              <Link
                to="/auth/citizen"
                className="inline-flex items-center gap-2 bg-brand-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-800 transition"
              >
                Login to track <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setSuccessId(''); setTitle(''); setDescription(''); setCategory(''); setPhotoUrl(null); }}
              className="flex-1 border-2 border-border-main py-3 rounded-xl font-bold text-text-muted hover:bg-surface-alt transition"
            >
              Report Another
            </button>
            <button
              onClick={() => navigate('/community')}
              className="flex-1 bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-surface-alt">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-text-main mb-2">
            {isPrefilled ? 'Review OCR Extracted Data' : 'See something wrong?'}
          </h1>
          <p className="text-text-muted text-lg">
            {isPrefilled 
              ? 'The information below was extracted from your uploaded document. Please review and submit.'
              : 'Report it in under a minute. No login required.'}
          </p>
          {isPrefilled && (
            <div className="mt-4 inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 text-cyan-800 px-4 py-2 rounded-lg text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Pre-filled from OCR scan
            </div>
          )}
        </div>

        {/* Tabs (only show My Reports if logged in) */}
        {user && (
          <div className="flex gap-1 bg-surface-main border border-border-main rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-brand-900 text-white shadow' : 'text-text-muted hover:text-text-main'}`}
            >
              <Send className="h-4 w-4" /> Report Issue
            </button>
            <button
              onClick={() => setActiveTab('my_reports')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'my_reports' ? 'bg-brand-900 text-white shadow' : 'text-text-muted hover:text-text-main'}`}
            >
              <List className="h-4 w-4" /> My Reports
            </button>
          </div>
        )}

        {/* ── MY REPORTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'my_reports' && user && (
          <div className="bg-surface-main border border-border-main rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-text-main">Your Submitted Reports</h2>
            {reportsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-brand-900" /></div>
            ) : myReports.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>You haven't submitted any reports yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.map(report => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-surface-alt rounded-xl border border-border-main hover:border-brand-200 transition">
                    <div>
                      <p className="font-bold text-text-main text-sm">{report.title}</p>
                      <p className="text-xs text-text-muted capitalize">{report.category} · {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[report.status] || 'bg-gray-100 text-gray-600'}`}>
                        {report.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REPORT FORM TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'report' && (
          <div className="bg-surface-main border border-border-main rounded-2xl shadow-sm overflow-hidden">

            {/* Duplicate Warning Banner */}
            {isDuplicate && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-yellow-800 text-sm">Similar issue already reported</p>
                  <p className="text-xs text-yellow-700 mb-3">A very similar issue was reported in the last 10 minutes. Are you sure you want to submit a new one?</p>
                  <div className="flex gap-2">
                    <button onClick={handleForceSubmit} disabled={isSubmitting} className="bg-yellow-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-700 transition disabled:opacity-50">
                      {isSubmitting ? 'Submitting...' : 'Submit Anyway'}
                    </button>
                    <button onClick={() => setIsDuplicate(false)} className="border border-yellow-400 text-yellow-800 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-100 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm font-medium text-red-700">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">📍 Location</label>
                <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${coords ? 'border-green-400 bg-green-50' : 'border-border-main bg-surface-alt'}`}>
                  {locLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-900" />
                  ) : (
                    <MapPin className={`h-4 w-4 ${coords ? 'text-green-600' : 'text-text-muted'}`} />
                  )}
                  <span className={`text-sm font-semibold ${coords ? 'text-green-700' : 'text-text-muted'}`}>
                    {locLoading ? 'Detecting location...' : cityName || 'Location not detected'}
                  </span>
                  {!coords && !locLoading && (
                    <button type="button" onClick={detectLocation} className="ml-auto text-xs text-brand-900 font-bold underline">
                      Retry
                    </button>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat} type="button" onClick={() => setCategory(cat)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${category === cat ? 'border-brand-900 bg-brand-900 text-white' : 'border-border-main bg-surface-alt text-text-muted hover:border-brand-300'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency is assessed automatically by AI; no manual input needed */}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Short Title * <span className="normal-case text-text-muted font-normal">(min 5 chars)</span></label>
                <input
                  type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Large pothole on MG Road"
                  className="w-full border-2 border-border-main bg-surface-alt rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-900 transition-colors"
                  required minLength={5}
                />
              </div>

              {/* Description + Voice */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest">Description * <span className="normal-case text-text-muted font-normal">(min 10 chars)</span></label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Voice:</span>
                    <button type="button" onClick={() => setSpeechLang('hi-IN')} className={`text-xs font-bold px-2 py-1 rounded ${speechLang === 'hi-IN' ? 'bg-brand-900 text-white' : 'text-text-muted'}`}>HI</button>
                    <button type="button" onClick={() => setSpeechLang('en-IN')} className={`text-xs font-bold px-2 py-1 rounded ${speechLang === 'en-IN' ? 'bg-brand-900 text-white' : 'text-text-muted'}`}>EN</button>
                    <button
                      type="button" onClick={toggleRecording}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-alt border border-border-main text-text-muted hover:text-brand-900'}`}
                    >
                      <Mic className="h-3.5 w-3.5" />
                      {isRecording ? 'Stop' : 'Record'}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue precisely. What's the problem? Where exactly? How severe?"
                  className="w-full border-2 border-border-main bg-surface-alt rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-900 transition-colors resize-y min-h-[100px]"
                  required minLength={10}
                />
              </div>

              {/* Optional email (for non-logged-in users) */}
              {!user && (
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Contact Email <span className="normal-case text-text-muted font-normal">(optional — to receive updates)</span></label>
                  <input
                    type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full border-2 border-border-main bg-surface-alt rounded-xl px-4 py-3 text-sm text-text-main outline-none focus:border-brand-900 transition-colors"
                  />
                </div>
              )}

              {/* Photo */}
              <div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-brand-900 transition-colors">
                  <Paperclip className="h-4 w-4" />
                  {photoUrl ? '✅ Photo attached' : 'Attach a photo (optional)'}
                </button>
                {photoUrl && (
                  <img src={photoUrl} alt="Preview" className="mt-3 rounded-xl max-h-40 object-cover border border-border-main" />
                )}
              </div>

              {/* Who is reporting */}
              {user && (
                <div className="flex items-center gap-2 text-sm text-text-muted bg-surface-alt px-4 py-3 rounded-xl border border-border-main">
                  <User className="h-4 w-4" />
                  Reporting as <strong className="text-text-main">{linkedProfile?.name || user.email}</strong>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={isSubmitting || !category}
                className="w-full flex items-center justify-center gap-3 bg-brand-900 text-white font-bold py-4 rounded-xl text-base hover:bg-brand-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-900/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>

              <p className="text-xs text-center text-text-muted">
                🔒 Max 5 reports per minute · Duplicate reports are detected automatically
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
