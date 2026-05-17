// @ts-nocheck
import { useLocation, useNavigate } from 'react-router-dom';
import { Clock, Copy, CheckCircle, Search } from 'lucide-react';
import { useState } from 'react';

export default function PendingVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const verificationId = location.state?.verificationId || 'N/A';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-10 text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Under Review</h1>
          <p className="text-slate-500 text-sm mb-8">
            Your NGO application has been submitted successfully. Our team will review it shortly.
          </p>

          {/* Verification ID Box */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your Verification ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold text-purple-700 tracking-widest">{verificationId}</span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-500" />}
              </button>
            </div>
          </div>

          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium mb-8">
            ⚠️ Save this ID — you'll need it to check your verification status.
          </p>

          {/* Actions */}
          <button
            onClick={() => navigate('/check-status', { state: { prefill: verificationId } })}
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 mb-3"
          >
            <Search className="h-4 w-4" />
            Check My Status
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full h-11 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
