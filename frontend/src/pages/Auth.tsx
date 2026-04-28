// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, MapPin, Users, Building2, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserFriendlyError } from '../lib/errorMessages';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, linkedProfile, onboardingCompleted, loading: authLoading, loginWithEmail, signupWithEmail, loginWithGoogle } = useAuth();

  const isNgo = location.pathname.includes('/ngo');
  const isVolunteer = location.pathname.includes('/volunteer');
  const roleValue = isNgo ? 'ngo_admin' : isVolunteer ? 'volunteer' : 'citizen';
  const roleLabel = isNgo ? 'NGO Admin' : isVolunteer ? 'Volunteer' : 'Citizen';

  // Automatically redirect when auth state resolves
  useEffect(() => {
    // Wait for auth to resolve before redirecting. The NGO portal intent is
    // enough to continue even if the Supabase profile row was just created.
    if (user && !authLoading) {
      console.log("[Auth] Full state resolved. Redirecting...", {
        firebaseUid: user.uid,
        role,
        linkedProfileRole: linkedProfile?.role,
        linkedProfileNgoId: linkedProfile?.assigned_ngo_id,
        isNgoPortal: isNgo,
        isNewSignup: localStorage.getItem('is_new_signup'),
      });

      const isNewSignup = localStorage.getItem('is_new_signup') === 'true';

      const finalRole = isNgo ? 'ngo_admin' : linkedProfile?.role || role || 'citizen';
      
      // NGO admins get immediate dashboard access. Missing NGO details are
      // handled by the setup form inside the dashboard, not by pending review.
      if (finalRole === 'ngo_admin') {
        const ngoId = linkedProfile?.assigned_ngo_id;
        
        if (!ngoId || !onboardingCompleted) {
          console.log('[Auth] NGO admin needs setup - redirecting to dashboard setup');
        }
        navigate('/ngo-dashboard');
      } else if (finalRole === 'volunteer') {
        navigate('/volunteer-dashboard');
      } else {
        // Citizens from NGO portal with no NGO yet - show questionnaire
        if (isNgo && isNewSignup) {
          console.log('[Auth] Citizen from NGO portal - will show questionnaire');
          return;
        }
        navigate('/citizen-dashboard');
      }
    }
  }, [user, role, linkedProfile, onboardingCompleted, authLoading, navigate, isNgo]);

  // Explicit logging for debugging
  useEffect(() => {
    if (user) {
      console.log("[Auth] Auth State:", {
        firebaseUid: user.uid,
        authLoading,
        role,
        linkedProfileRole: linkedProfile?.role,
        intendedRole: localStorage.getItem('intended_role')
      });
    }
  }, [user, role, linkedProfile, authLoading]);

  const roleConfig = {
    ngo_admin: { icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', gradient: 'from-purple-600 to-indigo-700', badge: 'bg-purple-100 text-purple-700' },
    volunteer: { icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-100 text-emerald-700' },
    citizen:   { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', gradient: 'from-indigo-600 to-purple-700', badge: 'bg-indigo-100 text-indigo-700' },
  }[roleValue];

  const RoleIcon = roleConfig.icon;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isLogin) await loginWithEmail(email, password, roleValue);
      else {
        if (isNgo) localStorage.setItem('signup_portal', 'ngo');
        if (isVolunteer) localStorage.setItem('signup_portal', 'volunteer');
        await signupWithEmail(email, password, roleValue);
      }
      // routing is handled by useEffect
    } catch (err: any) {
      setError(getUserFriendlyError(err));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError('');
    try {
      if (isLogin) {
        await loginWithGoogle(roleValue);
        if (isNgo) return;
        const { auth: firebaseAuth } = await import('../lib/firebase');
        const { supabase } = await import('../lib/supabase');
        const { signOut } = await import('firebase/auth');
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
          const { data: existingUser } = await supabase.from('users').select('id').eq('id', currentUser.uid).maybeSingle();
          if (!existingUser) { await signOut(firebaseAuth); setError('❌ Account not found. Please sign up first.'); setIsLogin(false); setLoading(false); return; }
        }
      } else {
        localStorage.setItem('is_new_signup', 'true');
        if (isNgo) localStorage.setItem('signup_portal', 'ngo');
        if (isVolunteer) localStorage.setItem('signup_portal', 'volunteer');
        await loginWithGoogle(roleValue);
      }
      // routing is handled by useEffect
    } catch (err: any) {
      setError(getUserFriendlyError(err));
      setLoading(false);
    } 
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left panel — gradient */}
      <div className={`hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-gradient-to-br ${roleConfig.gradient} p-12 text-white`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><MapPin className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
          <span className="text-xl font-bold">Linkwell</span>
        </div>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6"><RoleIcon className="h-7 w-7 text-white" /></div>
          <h2 className="text-3xl font-bold mb-3">{roleLabel} Portal</h2>
          <p className="text-white/70 text-[15px] leading-relaxed">
            {isNgo ? 'Manage community issues, coordinate volunteers, and track your NGO\'s impact.' :
             isVolunteer ? 'Accept task assignments, track your progress, and build your trust score.' :
             'Report civic issues, track resolutions, and connect with your local NGO network.'}
          </p>
          <div className="mt-8 space-y-3">
            {['Verified NGO network', 'Real-time issue tracking', 'Volunteer coordination'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">© 2025 Linkwell</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">
            {/* Role badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${roleConfig.badge}`}>
              <RoleIcon className="h-3.5 w-3.5" /> {roleLabel} Portal
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1">{isLogin ? 'Welcome back' : 'Create account'}</h1>
            <p className="text-slate-400 text-sm mb-6">{isLogin ? 'Sign in to continue to your dashboard.' : 'Join the Linkwell civic network today.'}</p>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-200 mb-5">{error}</div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-semibold text-slate-400 uppercase tracking-widest">or</span></div>
            </div>

            <button onClick={handleGoogleLogin} disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-3 border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-indigo-600 hover:underline">
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
