// @ts-nocheck
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import NgoDashboard from "./pages/NgoDashboard";
import CommunityReport from "./pages/CommunityReport";
import CommunityDashboard from "./pages/CommunityDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import VolunteerPortal from "./pages/VolunteerPortal";
import AlertPanel from "./pages/AlertPanel";
import DonationFlow from "./pages/DonationFlow";
import PublicCommunityView from "./pages/PublicCommunityView";
import AuthPage from "./pages/Auth";
import VolunteerRegister from "./pages/VolunteerRegister";
import OcrUploadDashboard from "./pages/OcrUploadDashboard";
import ImpactReports from "./pages/ImpactReports";
import IssueDetail from "./pages/IssueDetail";
import NGOList from "./pages/NGOList";
import NGOResourceDashboard from "./pages/NGOResourceDashboard";
import NGOPendingReview from "./pages/NGOPendingReview";
import NGOVerifications from "./pages/NGOVerifications";
import NgoRegister from "./pages/NgoRegister";
import PendingVerification from "./pages/PendingVerification";
import CheckStatus from "./pages/CheckStatus";
import NgoRejected from "./pages/NgoRejected";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNgoDetail from "./pages/admin/AdminNgoDetail";
import AdminRouteGuard from "./components/AdminRouteGuard";
import { useAuth } from "./services/useAuth";
import { useNavigate } from 'react-router-dom';
import Questionnaire from "./components/Questionnaire";

function ProtectedRoute({ children, allowedRole }: { children: JSX.Element, allowedRole?: string }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="p-8 text-center text-text-muted">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role === 'superadmin') return <Navigate to="/admin/dashboard" replace />;
  if (allowedRole && role !== allowedRole) {
    // wrong dashboard, send them to the right one
    if (role === 'ngo_admin') return <Navigate to="/ngo-dashboard" replace />;
    if (role === 'volunteer') return <Navigate to="/volunteer-dashboard" replace />;
    return <Navigate to="/citizen-dashboard" replace />;
  }

  return children;
}

export default function App() {
  const { user, role, onboardingCompleted, refreshProfile, loading, linkedProfile } = useAuth();

  // handles post-login redirects based on role
  function RoleRedirector() {
    const navigate = useNavigate();

    useEffect(() => {
      async function checkAndRedirect() {
        if (loading) {
          console.log('[RoleRedirector] Still loading...');
          return;
        }
        if (!user) {
          console.log('[RoleRedirector] No user - not redirecting');
          return;
        }
        const finalRole = (user && (window as any).__LINKWELL_SUPABASE_ROLE_OVERRIDE) ? (window as any).__LINKWELL_SUPABASE_ROLE_OVERRIDE : (role || 'citizen');
        const p = window.location.pathname;
        // auth pages handle redirects themselves
        if (p.startsWith('/auth')) {
          console.log('[RoleRedirector] On auth page - not redirecting');
          return;
        }
        // leave standalone pages alone
        if (p === '/ngo-register' || p === '/pending' || p === '/check-status' || p === '/ngo-rejected') {
          return;
        }
        
        console.log('========================================');
        console.log('[RoleRedirector] Checking redirect:');
        console.log('[RoleRedirector] - Current path:', p);
        console.log('[RoleRedirector] - User role:', finalRole);
        console.log('[RoleRedirector] - User email:', user.email);
        console.log('[RoleRedirector] - Role source:', (window as any).__LINKWELL_SUPABASE_ROLE_OVERRIDE ? 'window override' : 'useAuth hook');
        console.log('[RoleRedirector] - Onboarding completed:', onboardingCompleted);

        // superadmin goes straight to admin
        if (finalRole === 'superadmin') {
          if (!p.startsWith('/admin')) {
            console.log('[RoleRedirector] ➡️ Redirecting superadmin to /admin/dashboard');
            navigate('/admin/dashboard', { replace: true });
          }
          return;
        }
        
        // NGO admins need extra checks (verification, onboarding)
        if (finalRole === 'ngo_admin') {
          if (p === '/ngo/pending-review') {
            console.log('[RoleRedirector] Pending review bypassed for NGO admin');
            navigate('/ngo-dashboard', { replace: true });
            return;
          }


          try {
            const { supabase } = await import('./lib/supabase');
            const { data: appData } = await supabase
              .from('ngo_applications')
              .select('status')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!appData) {
              if (p !== '/ngo-register') navigate('/ngo-register', { replace: true });
              return;
            } else if (appData.status === 'pending') {
              if (p !== '/pending') navigate('/pending', { replace: true });
              return;
            } else if (appData.status === 'rejected') {
              if (p !== '/ngo-rejected') navigate('/ngo-rejected', { replace: true });
              return;
            }
          } catch (err) {
            console.error('[RoleRedirector] Error checking NGO status:', err);
          }

          // let the questionnaire show if onboarding isn't done
          if (!onboardingCompleted) {
            console.log('[RoleRedirector] NGO admin onboarding not complete - not redirecting');
            return;
          }
          
          if (!p.startsWith('/ngo-dashboard') && !p.startsWith('/ngo/') && p !== '/alerts') {
            console.log('[RoleRedirector] ➡️ Redirecting NGO admin to /ngo-dashboard');
            navigate('/ngo-dashboard', { replace: true });
          }
        } else if (finalRole === 'volunteer' && !p.startsWith('/volunteer-dashboard')) {
          console.log('[RoleRedirector] ➡️ Redirecting volunteer to /volunteer-dashboard');
          navigate('/volunteer-dashboard', { replace: true });
        } else if (finalRole === 'citizen' && !p.startsWith('/citizen-dashboard')) {
          console.log('[RoleRedirector] ➡️ Redirecting citizen to /citizen-dashboard');
          navigate('/citizen-dashboard', { replace: true });
        } else {
          console.log('[RoleRedirector] ✅ No redirect needed');
        }
        console.log('========================================\n');
      }
      
      checkAndRedirect();
    }, [user, role, loading, linkedProfile, onboardingCompleted]);
    return null;
  }

  // needs to be inside BrowserRouter for useLocation
  function AppContent() {
    const loc = useLocation();
    const isOnAuthPage = loc.pathname.startsWith('/auth');
    const isPendingReview = loc.pathname === '/ngo/pending-review';
    const isNgoApplicant = localStorage.getItem('signup_portal') === 'ngo';

    return (
      <>

        {!isOnAuthPage && !loading && user && !onboardingCompleted && role === 'volunteer' && (
          <Questionnaire userId={user.id} onComplete={refreshProfile} />
        )}
      </>
    );
  }

  return (
    <BrowserRouter>
      <RoleRedirector />
      <AppContent />
      <ErrorBoundary>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/ngo" element={<AuthPage />} />
            <Route path="/auth/volunteer" element={<AuthPage />} />
            <Route path="/auth/citizen" element={<AuthPage />} />
            <Route path="/auth/operator" element={<AuthPage />} />
            <Route path="/ngos" element={<NGOList />} />


            <Route path="/ngo-register" element={<NgoRegister />} />
            <Route path="/pending" element={<PendingVerification />} />
            <Route path="/check-status" element={<CheckStatus />} />
            <Route path="/ngo-rejected" element={<NgoRejected />} />


            <Route path="/admin/dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
            <Route path="/admin/ngo/:verificationId" element={<AdminRouteGuard><AdminNgoDetail /></AdminRouteGuard>} />

            <Route path="/ngo-dashboard" element={<ProtectedRoute allowedRole="ngo_admin"><NgoDashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<Navigate to="/ngo-dashboard" replace />} />
            <Route path="/ngo/pending-review" element={<ProtectedRoute><NGOPendingReview /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute allowedRole="ngo_admin"><AlertPanel /></ProtectedRoute>} />

            <Route path="/volunteer-dashboard" element={<ProtectedRoute allowedRole="volunteer"><VolunteerDashboard /></ProtectedRoute>} />
            <Route path="/volunteer" element={<Navigate to="/volunteer-dashboard" replace />} />
            <Route path="/volunteer-dashboard/portal" element={<ProtectedRoute allowedRole="volunteer"><VolunteerPortal /></ProtectedRoute>} />
            <Route path="/volunteer/portal" element={<Navigate to="/volunteer-dashboard/portal" replace />} />
            <Route path="/volunteer/ocr-upload" element={<ProtectedRoute allowedRole="volunteer"><OcrUploadDashboard /></ProtectedRoute>} />

            <Route path="/ngo/ocr-upload" element={<ProtectedRoute allowedRole="ngo_admin"><OcrUploadDashboard /></ProtectedRoute>} />
            <Route path="/ngo/verifications" element={<ProtectedRoute allowedRole="ngo_admin"><NGOVerifications /></ProtectedRoute>} />
            <Route path="/ngo/reports" element={<ProtectedRoute allowedRole="ngo_admin"><ImpactReports /></ProtectedRoute>} />
            <Route path="/ngo/resources" element={<ProtectedRoute allowedRole="ngo_admin"><NGOResourceDashboard /></ProtectedRoute>} />

            <Route path="/volunteer/register" element={<VolunteerRegister />} />

            <Route path="/issue/:id" element={<IssueDetail />} />

            <Route path="/report" element={<CommunityReport />} />
            <Route path="/donate" element={<DonationFlow />} />
            <Route path="/community" element={<PublicCommunityView />} />
            <Route path="/citizen-dashboard" element={<ProtectedRoute allowedRole="citizen"><CommunityDashboard /></ProtectedRoute>} />
          </Routes>
        </AppLayout>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
