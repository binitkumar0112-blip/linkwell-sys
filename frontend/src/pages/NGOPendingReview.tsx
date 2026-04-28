import React from 'react';
import { Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NGOPendingReview() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 max-w-lg w-full text-center space-y-8">
        
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center">
          <Clock className="h-12 w-12 text-amber-600 animate-pulse" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">
          <Clock className="h-4 w-4" /> Pending Review
        </div>

        {/* Main Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">Your NGO request is under review</h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Thank you for registering as an NGO.<br />
            Our team is reviewing your details.<br />
            You will get access once approved.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-left space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-900 text-sm">What happens next?</p>
              <p className="text-xs text-indigo-700 mt-1">Our verification team will review your NGO details and typically respond within 24-48 hours.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-900 text-sm">You'll receive an email</p>
              <p className="text-xs text-indigo-700 mt-1">Once approved, you'll get full access to the NGO dashboard and tools.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
          <p className="text-xs text-slate-400">
            Need help? Contact us at support@linkwell.org
          </p>
        </div>
      </div>
    </div>
  );
}
