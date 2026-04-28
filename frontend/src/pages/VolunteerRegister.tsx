import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Phone, CheckCircle2, Heart } from 'lucide-react';

export default function VolunteerRegister() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  
  const skillOptions = ['Medical / First Aid', 'Teaching / Mentoring', 'Logistics / Transport', 'Rescue / Operations', 'Food Distribution', 'IT / Tech Support'];

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => navigate('/'), 3000);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-sm text-center border border-gray-100">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="font-serif text-2xl text-gray-900 mb-2">Registration Complete!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for signing up. We'll review your profile and connect you with a local NGO shortly.
        </p>
        <p className="text-sm text-gray-400">Redirecting to home...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto my-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Heart className="w-5 h-5 text-primary-600" />
          </div>
          <h1 className="font-serif text-3xl text-gray-900">Volunteer Sign Up</h1>
        </div>
        <p className="text-gray-600 mb-8">Join the community network. Offer your skills and connect with local NGOs to resolve pressing issues nearby.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input required type="text" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="Rahul Sharma" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input required type="tel" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Primary Locality / Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input required type="text" className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Andheri West, Dharavi..." />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Skills & Interests (Select all that apply)</label>
            <div className="grid grid-cols-2 gap-3">
              {skillOptions.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`p-3 text-sm rounded-lg border text-left transition-all ${
                    skills.includes(skill) 
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium' 
                      : 'border-gray-200 hover:border-primary-300 text-gray-600'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors mt-4"
          >
            Register as Volunteer
          </button>
        </form>
      </div>
    </div>
  );
}
