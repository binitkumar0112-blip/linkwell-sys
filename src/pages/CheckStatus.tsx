// @ts-nocheck
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { Loader2, Search, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

type StatusResult = 'idle' | 'loading' | 'pending' | 'approved' | 'rejected' | 'not_found';

export default function CheckStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [verificationId, setVerificationId] = useState(location.state?.prefill || '');
  const [status, setStatus] = useState<StatusResult>('idle');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationId.trim()) return;

    setStatus('loading');
    try {
      const result = await adminService.checkStatus(verificationId.trim().toUpperCase());
      if (!result) {
        setStatus('not_found');
        return;
      }
      setStatus(result.status as StatusResult);
      if (result.rejection_reason) setRejectionReason(result.rejection_reason);
    } catch {
      setStatus('not_found');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Check Verification Status</h1>
            <p className="text-slate-500 text-sm">Enter your NGO Verification ID below</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleCheck} className="mb-6">
            <input
              type="text"
              value={verificationId}
              onChange={e => setVerificationId(e.target.value)}
              placeholder="e.g. NGO-2026-A1B2C"
              className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent tracking-wider text-center uppercase mb-3"
            />
            <button
              type="submit"
              disabled={status === 'loading' || !verificationId.trim()}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {status === 'loading' ? 'Checking...' : 'Check Status'}
            </button>
          </form>

          {/* Results */}
          {status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-bold text-amber-800 mb-1">Under Review</h3>
              <p className="text-amber-700 text-sm">Your application is currently being reviewed by our team. Please check back later.</p>
            </div>
          )}

          {status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-green-800 mb-1">Verified! ✅</h3>
              <p className="text-green-700 text-sm mb-4">Your NGO has been verified. You can now log in and access your dashboard.</p>
              <button
                onClick={() => navigate('/auth/ngo')}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
              >
                Log In <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
              <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-red-800 mb-1">Not Approved ❌</h3>
              <p className="text-red-700 text-sm mb-2">Unfortunately, your application was not approved.</p>
              {rejectionReason && (
                <div className="bg-white border border-red-200 rounded-lg p-3 mt-3 text-left">
                  <p className="text-xs font-semibold text-red-400 uppercase mb-1">Reason</p>
                  <p className="text-sm text-red-800">{rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          {status === 'not_found' && (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 text-center">
              <Search className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 mb-1">Not Found</h3>
              <p className="text-slate-500 text-sm">No application found with this Verification ID. Please double-check and try again.</p>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
