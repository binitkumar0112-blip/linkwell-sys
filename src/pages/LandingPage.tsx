// @ts-nocheck
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, CheckCircle2, MapPin, Zap, TrendingUp } from 'lucide-react';
import MapView from '../components/MapView';
import { getAppStats, AppStats } from '../services/statsService';
import { getIssues } from '../services/issues';

export default function LandingPage() {
  const [stats, setStats] = useState<AppStats>({ totalIssues: 0, resolvedIssues: 0, volunteers: 0, ngos: 0 });
  const [issues, setIssues] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [s, i] = await Promise.all([getAppStats(), getIssues().catch(() => [])]);
      setStats(s);
      setIssues(i || []);
    }
    load();
  }, []);

  return (
    <div className="relative overflow-x-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 h-[700px] bg-gradient-to-br from-indigo-50 via-white to-purple-50 pointer-events-none" />
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-40 left-0 -z-10 w-[400px] h-[400px] rounded-full bg-purple-100/30 blur-3xl pointer-events-none" />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-16 pb-24">

        {/* ── Hero Row ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center mb-20">

          {/* Left: Headline + CTA */}
          <section className="flex flex-col">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Live Civic Network · {stats.totalIssues} Issues Tracked
            </div>

            <h1 className="text-[42px] sm:text-[52px] lg:text-[58px] font-bold text-slate-900 leading-[1.05] tracking-tight mb-6">
              Report & Resolve
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Community Issues
              </span>
              <br />
              in Real-Time
            </h1>

            <p className="text-[17px] text-slate-500 leading-relaxed max-w-[480px] mb-8">
              A unified civic network bridging local challenges with verifiable resolutions. Report hazards, volunteer your skills, or deploy NGO resources — instantly.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Link to="/auth/citizen"
                className="inline-flex items-center gap-2 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/report"
                className="inline-flex items-center gap-2 h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                Report an Issue
              </Link>
              <Link to="/community"
                className="inline-flex items-center gap-2 h-12 text-slate-500 hover:text-indigo-600 font-semibold px-4 transition-colors duration-200">
                View Map <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, value: stats.totalIssues, label: 'Issues Reported', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { icon: CheckCircle2, value: stats.resolvedIssues, label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { icon: Users, value: stats.volunteers, label: 'Volunteers', color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: Shield, value: stats.ngos, label: 'NGO Partners', color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-bold ${s.color} leading-none mb-0.5`}>{s.value}</p>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Map Preview */}
          <section className="relative">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white">
              {/* Map header bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex items-center gap-1.5 bg-white rounded-lg px-3 py-1 border border-slate-200 text-xs text-slate-400 font-medium flex-1 ml-2">
                  <MapPin className="h-3 w-3 text-indigo-500" /> linkwell.app/community
                </div>
              </div>
              {/* Map */}
              <div className="h-[400px] relative">
                <MapView issues={issues} />
                {/* Floating report button on preview */}
                <Link to="/community"
                  className="fab absolute bottom-4 right-4 z-[400] text-sm">
                  <MapPin className="h-4 w-4" /> Explore Map
                </Link>
              </div>
            </div>

            {/* Floating info card */}
            <div className="absolute -bottom-5 -left-5 hidden lg:block bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 w-52">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Real-time updates</p>
                <p className="text-[11px] text-slate-400">Live issue tracking</p>
              </div>
            </div>
          </section>
        </div>

        {/* ── Feature Strip ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: MapPin, title: 'Geo-Tagged Reports', desc: 'Every issue is pinned to an exact location for precise resolution.', color: 'from-indigo-500 to-indigo-600' },
            { icon: Users, title: 'Volunteer Network', desc: 'Skilled volunteers ready to act on verified civic issues near you.', color: 'from-emerald-500 to-emerald-600' },
            { icon: Shield, title: 'NGO Coordination', desc: 'Verified NGOs claim, manage, and resolve issues with full accountability.', color: 'from-purple-500 to-purple-600' },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
