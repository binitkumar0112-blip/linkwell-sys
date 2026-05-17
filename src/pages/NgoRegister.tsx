// @ts-nocheck
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateVerificationId } from '../utils/generateVerificationId';
import { Loader2, Building2, CheckCircle } from 'lucide-react';

export default function NgoRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [orgName, setOrgName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');


  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setContactEmail(data.user.email);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // don't let them submit twice
      const { data: existing } = await supabase
        .from('ngo_applications')
        .select('verification_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        navigate('/pending', { state: { verificationId: existing.verification_id } });
        return;
      }

      const verificationId = await generateVerificationId();

      const { error: insertError } = await supabase
        .from('ngo_applications')
        .insert([{
          user_id: user.id,
          verification_id: verificationId,
          org_name: orgName.trim(),
          registration_number: regNumber.trim() || null,
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim() || null,
          address: address.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
          status: 'pending',
        }]);

      if (insertError) throw insertError;

      navigate('/pending', { state: { verificationId } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 md:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">NGO Registration</h1>
              <p className="text-slate-500 text-sm">Complete your organization details for verification</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Note:</strong> After submission, your application will be reviewed by our team.
            You'll receive a unique Verification ID to track your status.
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Org Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Organization Name *</label>
              <input
                type="text" value={orgName} onChange={e => setOrgName(e.target.value)} required
                placeholder="e.g. Hope Foundation India"
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Registration Number</label>
              <input
                type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)}
                placeholder="NGO registration / charity number"
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Email *</label>
                <input
                  type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} required
                  placeholder="contact@ngo.org"
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                <input
                  type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
              <input
                type="text" value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Full office address"
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Website</label>
              <input
                type="url" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://www.yourngo.org"
                className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Brief Description</label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Tell us about your NGO's mission, areas of work, and community impact..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
