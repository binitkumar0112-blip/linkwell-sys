// @ts-nocheck
import { useNavigate } from 'react-router-dom';
import { XCircle, Search, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../services/useAuth';

export default function NgoRejected() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    adminService.getMyApplication(user.id).then(app => {
      if (app?.rejection_reason) setReason(app.rejection_reason);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Not Approved</h1>
          <p className="text-slate-500 text-sm mb-6">
            Your NGO verification application has been reviewed and was not approved at this time.
          </p>

          {reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Reason for Rejection</p>
              <p className="text-sm text-red-800">{reason}</p>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600">
              If you believe this was in error, please contact support at{' '}
              <strong className="text-indigo-600">support@linkwell.org</strong>
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/check-status')}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Check Status Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full h-11 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
