import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, MapPin, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NGOQuestionnaireProps {
  userId: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export default function NGOQuestionnaire({ userId, onComplete, onCancel }: NGOQuestionnaireProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const availableCategories = ['Infrastructure', 'Health', 'Education', 'Food', 'Rescue', 'Other'];

  useEffect(() => {
    async function loadExistingNgo() {
      const { data } = await supabase
        .from('ngos')
        .select('name, category, latitude, longitude')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data) return;
      setName(data.name || '');
      const matchedCategory = availableCategories.find(cat => cat.toLowerCase() === data.category);
      setCategory(matchedCategory || data.category || '');
      if (data.latitude && data.longitude) {
        setLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    }

    loadExistingNgo();
  }, [userId]);

  const handleGetLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        alert("Could not get location. Using default.");
        setLocation({ latitude: 19.0760, longitude: 72.8777 }); // Mumbai default
        setLoading(false);
      }
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('[NGOQuestionnaire] Saving NGO application for userId:', userId);

      const ngoData = {
        name: name.trim(),
        category: category.toLowerCase() || 'general',
        latitude: location?.latitude,
        longitude: location?.longitude,
        verified: true,
        user_id: userId
      };

      const { data: existingNgo } = await supabase
        .from('ngos')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: savedNgo, error: ngoError } = existingNgo
        ? await supabase
          .from('ngos')
          .update(ngoData)
          .eq('id', existingNgo.id)
          .select()
          .single()
        : await supabase
        .from('ngos')
        .insert([ngoData])
        .select()
        .single();
        
      if (ngoError) throw ngoError;

      // Update users table to link to this NGO and set role
      const { error: userError } = await supabase
        .from('users')
        .update({ 
           assigned_ngo_id: savedNgo.id,
           role: 'ngo_admin' 
        })
        .eq('id', userId);
        
      if (userError) throw userError;

      // Update user_profiles
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const profileData = {
        user_id: userId,
        onboarding_completed: true,
      };

      if (existingProfile) {
        await supabase.from('user_profiles').update(profileData).eq('user_id', userId);
      } else {
        await supabase.from('user_profiles').insert([profileData]);
      }

      console.log('[NGOQuestionnaire] Application saved! Redirecting to dashboard...');
      // Clear signup flags
      localStorage.removeItem('signup_portal');
      localStorage.removeItem('is_new_signup');
      localStorage.removeItem('intended_role');
      // Refresh profile so questionnaire disappears
      onComplete();
      navigate('/ngo-dashboard');
    } catch (err: any) {
      console.error('[NGOQuestionnaire] Submission failed:', err);
      alert("Failed to save NGO application: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-main max-w-lg w-full p-8 rounded-2xl shadow-2xl border border-border-main relative overflow-hidden">
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded-full hover:bg-surface-alt transition-colors"
            aria-label="Close questionnaire"
          >
            ×
          </button>
        )}
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-brand-900 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 text-brand-900">
              <Building2 className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">Organization Details</h2>
            </div>
            <p className="text-text-muted">Welcome! Let's set up your NGO profile.</p>
            
            <div className="space-y-3">
              <label className="block text-[14px] font-bold text-text-main uppercase tracking-wider">
                Organization Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hope Foundation"
                className="w-full border border-border-main bg-surface-alt px-4 py-3 text-[15px] text-text-main outline-none focus:border-brand-900 focus:bg-surface-main transition-colors"
                required
              />
            </div>

            <button
              onClick={() => name.trim() ? setStep(2) : alert("Please enter a name.")}
              className="w-full bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center gap-3 text-brand-900">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">Primary Category</h2>
            </div>
            <p className="text-text-muted">What is your NGO's main area of focus?</p>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    category === cat 
                    ? 'bg-brand-900 text-white border-brand-900 shadow-md scale-105' 
                    : 'bg-surface-alt border-border-main text-text-muted hover:border-brand-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
               <button onClick={() => setStep(1)} className="flex-1 border border-border-main py-3 rounded-xl font-bold text-text-muted hover:bg-surface-alt transition-colors">Back</button>
               <button
                onClick={() => category ? setStep(3) : alert("Please select a category.")}
                className="flex-[2] bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center gap-3 text-brand-900">
              <MapPin className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">Headquarters</h2>
            </div>
            <p className="text-text-muted">Sharing your location helps us match you with nearby issues.</p>
            
            <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${location ? 'border-green-500 bg-green-50' : 'border-border-main hover:border-brand-900'}`}>
              {location ? (
                <div className="text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700 text-sm">Location Captured</p>
                  <p className="text-xs text-green-600">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                </div>
              ) : (
                <button 
                  onClick={handleGetLocation} 
                  disabled={loading}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-brand-900" /> : <MapPin className="h-6 w-6 text-brand-900" />}
                  </div>
                  <span className="text-sm font-bold text-brand-900 underline">Tap to share location</span>
                </button>
              )}
            </div>

            <div className="flex gap-4">
               <button onClick={() => setStep(2)} className="flex-1 border border-border-main py-3 rounded-xl font-bold text-text-muted hover:bg-surface-alt transition-colors">Back</button>
               <button
                onClick={handleSubmit}
                disabled={loading || !location}
                className="flex-[2] bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
