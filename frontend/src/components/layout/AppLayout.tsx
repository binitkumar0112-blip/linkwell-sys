// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, MapPin, Users, Building2, Package } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginDropOpen, setLoginDropOpen] = useState(false);
  const [userDropOpen, setUserDropOpen] = useState(false);
  const loginRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, linkedProfile, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;
  const role = linkedProfile?.role || 'citizen';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) setLoginDropOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = [
    { text: 'Home', path: '/', show: true },
    { text: 'Map', path: '/community', show: true },
    { text: 'Report', path: '/report', show: role !== 'volunteer' && role !== 'ngo_admin' },
    { text: 'Dashboard', path: '/citizen-dashboard', show: !!user && role !== 'volunteer' && role !== 'ngo_admin' },
    { text: 'NGOs', path: '/ngos', show: role !== 'volunteer' },
    { text: 'Volunteer Hub', path: '/volunteer-dashboard', show: role === 'volunteer' },
    { text: 'NGO Dashboard', path: '/ngo-dashboard', show: role === 'ngo_admin' },
    { text: 'Proof Review', path: '/ngo/verifications', show: role === 'ngo_admin' },
    { text: 'Resources', path: '/ngo/resources', show: role === 'ngo_admin' },
  ].filter(l => l.show);

  const dashPath = role === 'ngo_admin' ? '/ngo-dashboard' : role === 'volunteer' ? '/volunteer-dashboard' : '/citizen-dashboard';
  const initials = (linkedProfile?.name || user?.displayName || user?.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[20px] font-bold tracking-tight text-slate-900">
            Link<span className="text-indigo-600">well</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={cn('relative px-3 py-2 text-[14px] font-medium rounded-lg transition-all duration-150',
                isActive(link.path) ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')}>
              {link.text}
              {isActive(link.path) && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-600 rounded-full" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 z-50">
          {user ? (
            <div ref={userRef} className="relative hidden sm:block">
              <button onClick={() => setUserDropOpen(v => !v)}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5 hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">{initials}</div>
                <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate">{linkedProfile?.name || user.displayName || user.email?.split('@')[0]}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200', userDropOpen && 'rotate-180')} />
              </button>
              {userDropOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">{role.replace('_', ' ')}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{linkedProfile?.name || user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link to={dashPath} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors" onClick={() => setUserDropOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <button onClick={() => { logout(); setUserDropOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-0.5">
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div ref={loginRef} className="relative hidden sm:block">
                <button onClick={() => setLoginDropOpen(v => !v)}
                  className="flex items-center gap-1.5 h-9 px-4 text-[13px] font-semibold text-slate-700 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all">
                  Login <ChevronDown className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-200', loginDropOpen && 'rotate-180')} />
                </button>
                {loginDropOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-1.5 space-y-0.5">
                      {[
                        { to: '/auth/citizen', icon: Users, label: 'Citizen', sub: 'Report issues', bg: 'bg-indigo-100', ic: 'text-indigo-600', hov: 'hover:bg-indigo-50 hover:text-indigo-700' },
                        { to: '/auth/volunteer', icon: Users, label: 'Volunteer', sub: 'Help resolve issues', bg: 'bg-emerald-100', ic: 'text-emerald-600', hov: 'hover:bg-emerald-50 hover:text-emerald-700' },
                        { to: '/auth/ngo', icon: Building2, label: 'NGO Admin', sub: 'Manage operations', bg: 'bg-purple-100', ic: 'text-purple-600', hov: 'hover:bg-purple-50 hover:text-purple-700' },
                      ].map(item => (
                        <Link key={item.to} to={item.to}
                          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 transition-colors', item.hov)}
                          onClick={() => setLoginDropOpen(false)}>
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                            <item.icon className={cn('h-3.5 w-3.5', item.ic)} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.label}</p>
                            <p className="text-xs text-slate-400">{item.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/auth/citizen"
                className="inline-flex h-9 items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold px-4 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                Get Started
              </Link>
            </>
          )}
          <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors',
                isActive(link.path) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100')}
              onClick={() => setMenuOpen(false)}>{link.text}</Link>
          ))}
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{linkedProfile?.name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-400 capitalize">{role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth/citizen" className="flex justify-center items-center w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl" onClick={() => setMenuOpen(false)}>Get Started</Link>
                <Link to="/auth/volunteer" className="flex justify-center items-center w-full py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl" onClick={() => setMenuOpen(false)}>Volunteer Login</Link>
                <Link to="/auth/ngo" className="flex justify-center items-center w-full py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl" onClick={() => setMenuOpen(false)}>NGO Login</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm"><MapPin className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
              <span className="text-[18px] font-bold tracking-tight text-slate-900">Link<span className="text-indigo-600">well</span></span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Civic intelligence platform connecting communities with NGOs and volunteers to resolve real issues, faster.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Platform</p>
            <div className="space-y-2.5">
              {[{ to: '/community', label: 'Community Map' }, { to: '/report', label: 'Report an Issue' }, { to: '/ngos', label: 'NGO Directory' }].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Portals</p>
            <div className="space-y-2.5">
              {[{ to: '/auth/citizen', label: 'Citizen Portal' }, { to: '/auth/volunteer', label: 'Volunteer Portal' }, { to: '/auth/ngo', label: 'NGO Portal' }].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-400">© 2025 Linkwell. Built to serve communities.</p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-400 font-medium">Live network</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 shrink-0">{children}</main>
      <Footer />
    </div>
  );
}
