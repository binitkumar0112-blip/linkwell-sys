import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, MapPin, Sparkles, Globe, ChevronDown, X } from 'lucide-react';

interface QuestionnaireProps {
  userId: string;
  onComplete: () => void;
}

// Searchable dropdown component
function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 50);

  const handleSelect = (val: string) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-[13px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{label}</label>
      <div className={`flex items-center border rounded-xl px-3 py-2.5 bg-surface-alt transition-colors ${open ? 'border-brand-900' : 'border-border-main'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={disabled ? 'Select previous first' : placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent outline-none text-sm text-text-main placeholder:text-text-muted"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted shrink-0" />}
        {!loading && value && <button onClick={handleClear} className="text-text-muted hover:text-text-main"><X className="h-4 w-4" /></button>}
        {!loading && !value && <ChevronDown className={`h-4 w-4 text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-surface-main border border-border-main rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.map(opt => (
            <li
              key={opt}
              onClick={() => handleSelect(opt)}
              className="px-4 py-2.5 text-sm text-text-main hover:bg-brand-50 hover:text-brand-900 cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-surface-main border border-border-main rounded-xl shadow-xl px-4 py-3 text-sm text-text-muted">
          No results found
        </div>
      )}
    </div>
  );
}

export default function Questionnaire({ userId, onComplete }: QuestionnaireProps) {
  const TOTAL_STEPS = 4;
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Step 3: Location (country/state/city)
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Step 4: GPS coords
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const availableSkills = ['First Aid', 'Cooking', 'Teaching', 'Carpentry', 'Plumbing', 'IT Support', 'Driving'];
  const availableInterests = ['Healthcare', 'Education', 'Environment', 'Infrastructure', 'Disaster Relief', 'Animal Welfare'];

  // Fetch countries on mount
  useEffect(() => {
    fetch('https://countriesnow.space/api/v0.1/countries/positions')
      .then(r => r.json())
      .then(d => {
        const names = (d.data as any[]).map(c => c.name).sort();
        setCountries(names);
      })
      .catch(() => {
        // Fallback list of most common countries
        setCountries(['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Brazil', 'China', 'Japan', 'Russia', 'South Africa', 'Nigeria', 'Mexico', 'Indonesia']);
      });
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (!selectedCountry) { setStates([]); setSelectedState(''); setCities([]); setSelectedCity(''); return; }
    setStatesLoading(true);
    setSelectedState('');
    setSelectedCity('');
    setCities([]);
    fetch('https://countriesnow.space/api/v0.1/countries/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: selectedCountry }),
    })
      .then(r => r.json())
      .then(d => {
        const stateNames = (d.data?.states as any[] || []).map((s: any) => s.name).sort();
        setStates(stateNames);
      })
      .catch(() => setStates([]))
      .finally(() => setStatesLoading(false));
  }, [selectedCountry]);

  // Fetch cities when state changes
  useEffect(() => {
    if (!selectedState || !selectedCountry) { setCities([]); setSelectedCity(''); return; }
    setCitiesLoading(true);
    setSelectedCity('');
    fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: selectedCountry, state: selectedState }),
    })
      .then(r => r.json())
      .then(d => {
        const cityNames = ((d.data as string[]) || []).sort();
        setCities(cityNames);
      })
      .catch(() => setCities([]))
      .finally(() => setCitiesLoading(false));
  }, [selectedState, selectedCountry]);

  const handleToggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleToggleInterest = (interest: string) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleGetGps = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        alert("Could not get GPS location. Using default (Mumbai).");
        setGpsLocation({ latitude: 19.0760, longitude: 72.8777 });
        setLoading(false);
      }
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const locationText = [selectedCity, selectedState, selectedCountry].filter(Boolean).join(', ');

      const profileData = {
        user_id: userId,
        skills,
        interests,
        latitude: gpsLocation?.latitude,
        longitude: gpsLocation?.longitude,
        onboarding_completed: true,
      };

      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      let profileError;
      if (existingProfile) {
        const { error } = await supabase.from('user_profiles').update(profileData).eq('user_id', userId);
        profileError = error;
      } else {
        const { error } = await supabase.from('user_profiles').insert([profileData]);
        profileError = error;
      }
      if (profileError) throw profileError;

      // Upsert volunteers table
      const { data: existingVolunteer } = await supabase
        .from('volunteers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingVolunteer) {
        const { error: volError } = await supabase.from('volunteers').insert([{
          user_id: userId,
          availability_status: 'available',
          skills,
          interests,
          latitude: gpsLocation?.latitude,
          longitude: gpsLocation?.longitude,
        }]);
        if (volError) throw volError;
      }

      if (typeof onComplete === 'function') {
        onComplete();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert("Failed to save profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-main max-w-lg w-full p-8 rounded-2xl shadow-2xl border border-border-main relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-brand-900 transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />

        {/* Step indicator */}
        <p className="absolute top-3 right-4 text-[11px] text-text-muted font-bold tracking-wider uppercase">Step {step} of {TOTAL_STEPS}</p>

        {/* STEP 1: Skills */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 pt-4">
            <div className="flex items-center gap-3 text-brand-900">
              <Sparkles className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">What are your skills?</h2>
            </div>
            <p className="text-text-muted">Select the skills you can contribute to the community.</p>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <button key={skill} onClick={() => handleToggleSkill(skill)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${skills.includes(skill) ? 'bg-brand-900 text-white border-brand-900 shadow-md scale-105' : 'bg-surface-alt border-border-main text-text-muted hover:border-brand-900'}`}>
                  {skill}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)}
              className="w-full bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg">
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: Interests */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pt-4">
            <div className="flex items-center gap-3 text-brand-900">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">Your Interests</h2>
            </div>
            <p className="text-text-muted">What causes do you care about most?</p>
            <div className="flex flex-wrap gap-2">
              {availableInterests.map(interest => (
                <button key={interest} onClick={() => handleToggleInterest(interest)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${interests.includes(interest) ? 'bg-brand-900 text-white border-brand-900 shadow-md scale-105' : 'bg-surface-alt border-border-main text-text-muted hover:border-brand-900'}`}>
                  {interest}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-border-main py-3 rounded-xl font-bold text-text-muted hover:bg-surface-alt">Back</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg">Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3: Country / State / City */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 pt-4">
            <div className="flex items-center gap-3 text-brand-900">
              <Globe className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">Where are you based?</h2>
            </div>
            <p className="text-text-muted">Select your location — you can type to search.</p>

            <SearchableSelect
              label="Country"
              placeholder="Search country..."
              options={countries}
              value={selectedCountry}
              onChange={val => setSelectedCountry(val)}
            />
            <SearchableSelect
              label="State / Province"
              placeholder="Search state..."
              options={states}
              value={selectedState}
              onChange={val => setSelectedState(val)}
              disabled={!selectedCountry}
              loading={statesLoading}
            />
            <SearchableSelect
              label="City"
              placeholder="Search city..."
              options={cities}
              value={selectedCity}
              onChange={val => setSelectedCity(val)}
              disabled={!selectedState}
              loading={citiesLoading}
            />

            {/* Summary pill */}
            {selectedCountry && (
              <div className="flex items-center gap-2 bg-brand-50 text-brand-900 px-3 py-2 rounded-lg text-sm font-medium">
                <MapPin className="h-4 w-4 shrink-0" />
                {[selectedCity, selectedState, selectedCountry].filter(Boolean).join(', ')}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-border-main py-3 rounded-xl font-bold text-text-muted hover:bg-surface-alt">Back</button>
              <button
                onClick={() => selectedCountry ? setStep(4) : alert('Please select at least a country.')}
                className="flex-[2] bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: GPS Location */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 pt-4">
            <div className="flex items-center gap-3 text-brand-900">
              <MapPin className="h-6 w-6" />
              <h2 className="text-2xl font-serif font-bold">Share your GPS</h2>
            </div>
            <p className="text-text-muted">This helps match you with nearby issues. You can skip if you prefer.</p>

            <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${gpsLocation ? 'border-green-500 bg-green-50' : 'border-border-main hover:border-brand-900'}`}>
              {gpsLocation ? (
                <div className="text-center">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-green-700 text-sm">GPS Captured</p>
                  <p className="text-xs text-green-600">{gpsLocation.latitude.toFixed(4)}, {gpsLocation.longitude.toFixed(4)}</p>
                </div>
              ) : (
                <button onClick={handleGetGps} disabled={loading} className="flex flex-col items-center gap-2 group">
                  <div className="h-12 w-12 rounded-full bg-brand-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-brand-900" /> : <MapPin className="h-6 w-6 text-brand-900" />}
                  </div>
                  <span className="text-sm font-bold text-brand-900 underline">Tap to share GPS location</span>
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-border-main py-3 rounded-xl font-bold text-text-muted hover:bg-surface-alt">Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-brand-900 text-white py-3 rounded-xl font-bold hover:bg-brand-800 transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Complete Setup ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
