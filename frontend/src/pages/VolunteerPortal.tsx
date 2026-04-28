// @ts-nocheck
import { useState, useEffect } from "react";
import { CheckCircle2, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react";
import { SeverityBadge } from "../components/ui/badges";
import { useAuth } from "../hooks/useAuth";
import { ProblemService } from "../services/api";
import { getUserFriendlyError } from "../lib/errorMessages";

// haversine-ish distance calc
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
            c(lat1 * p) * c(lat2 * p) * 
            (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export default function VolunteerPortal() {
  const { user, linkedProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const MY_LAT = 19.0403;
  const MY_LNG = 72.8617;

  useEffect(() => {
    setLoading(true);
    ProblemService.getLatestProblems(50)
      .then((data) => setProblems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCommit = async (taskId: string) => {
    if (!user) return;
    setActionLoading(taskId);
    try {
      const updated = await ProblemService.updateStatus(taskId, 'assigned', user.uid);
      setProblems((prev) => prev.map((p) => (p.id === taskId ? { ...p, ...updated } : p)));
    } catch (e) { console.error(getUserFriendlyError(e)); }
    finally { setActionLoading(null); }
  };

  const handleDone = async (taskId: string) => {
    setActionLoading(taskId);
    try {
      const updated = await ProblemService.updateStatus(taskId, 'resolved');
      setProblems((prev) => prev.map((p) => (p.id === taskId ? { ...p, ...updated } : p)));
    } catch (e) { console.error(getUserFriendlyError(e)); }
    finally { setActionLoading(null); }
  };

  let filteredProblems = [];
  if (activeTab === 'opportunities') {
    filteredProblems = problems
      .filter(p => (p.status === 'open' || p.status === 'assigned') && !p.assigned_volunteer_id)
      .map(p => ({ ...p, dist: getDistance(MY_LAT, MY_LNG, p.lat, p.lng || MY_LNG) }))
      .sort((a,b) => a.dist - b.dist)
      .slice(0, 15);
  } else if (activeTab === 'my committments') {
    filteredProblems = problems.filter(p => p.assigned_volunteer_id === linkedProfile?.id && p.status !== 'resolved');
  } else {
    filteredProblems = problems.filter(p => p.assigned_volunteer_id === linkedProfile?.id && p.status === 'resolved');
  }

  let displayProblems = [];
  if (activeTab === 'opportunities') {
    const clusterMap: Record<string, any> = {};
    filteredProblems.forEach(p => {
      if (p.cluster_id) {
        if (!clusterMap[p.cluster_id]) {
          clusterMap[p.cluster_id] = { 
            ...p, 
            isCluster: true, 
            count: 1, 
            title: `📍 Batch: ${p.locality} Tasks (${p.category})` 
          };
          displayProblems.push(clusterMap[p.cluster_id]);
        } else {
          clusterMap[p.cluster_id].count++;
          if (p.severity === 'critical') clusterMap[p.cluster_id].severity = 'critical';
        }
      } else {
        displayProblems.push(p);
      }
    });
  } else {
    displayProblems = filteredProblems;
  }

  const initials = linkedProfile?.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || 'V';

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-12 sm:px-6 lg:px-8">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-border-main pb-8">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 bg-surface-alt border border-border-main flex items-center justify-center text-2xl font-serif text-brand-900">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-serif text-text-main">{linkedProfile?.name || 'Volunteer Portal'}</h1>
            <div className="mt-2 flex items-center gap-4 text-[13px] text-text-muted font-medium tracking-wide">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-text-main" /> Anywhere / Local</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Verified Background</span>
            </div>
          </div>
        </div>
        
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            <span>Trust Level: {linkedProfile?.trust_level || 5}/10</span>
            <span className="text-brand-900">Level {Math.floor((linkedProfile?.trust_level || 5)/3) + 1}</span>
          </div>
          <div className="h-1.5 w-full bg-border-main overflow-hidden rounded-full">
            <div className="h-full bg-brand-900 transition-all duration-1000" style={{ width: `${(linkedProfile?.trust_level || 5) * 10}%` }} />
          </div>
        </div>
      </div>

      <div className="flex border-b border-border-main mb-8 overflow-x-auto hide-scrollbar">
        {['Opportunities', 'My Committments', 'Impact Log'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`h-12 px-6 text-[14px] font-bold tracking-wide uppercase border-b-2 transition-colors -mb-px whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'border-brand-900 text-brand-900' : 'border-transparent text-text-muted hover:text-text-main'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-0 min-h-[400px]">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-main border border-border-main rounded-xl h-[120px] p-5 w-full"></div>
            ))}
          </div>
        ) : displayProblems.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center border border-dashed border-border-main bg-surface-alt">
            <div className="w-12 h-12 rounded-full border border-border-main bg-surface-main flex items-center justify-center mb-4 text-text-muted">
              <MapPin className="h-5 w-5" />
            </div>
            <p className="text-[16px] font-medium text-text-main mb-1">No tasks found</p>
            <p className="text-[14px] text-text-muted">Check back later for new opportunities in your area.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center text-[11px] font-bold uppercase tracking-widest text-text-muted pb-4 border-b border-border-main hidden sm:flex">
              <div className="w-[15%] px-4">Severity</div>
              <div className="w-[35%] px-4">Task Requirement</div>
              <div className="w-[20%] px-4">Location</div>
              <div className="w-[15%] px-4">Est. Time</div>
              <div className="w-[15%] px-4 text-right">Action</div>
            </div>
            
            {displayProblems.map((task: any) => (
              <div key={task.id} className="group flex flex-col sm:flex-row sm:items-center py-5 border-b border-border-main hover:bg-surface-main transition-colors relative">
                <div className="sm:w-[15%] mb-2 sm:mb-0 px-4">
                  <SeverityBadge severity={task.severity as any} />
                </div>
                <div className="sm:w-[35%] mb-2 sm:mb-0 px-4">
                  <h3 className="font-semibold text-[15px] text-text-main group-hover:text-brand-900 transition-colors">
                    {task.isCluster && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold mr-2 uppercase">{task.count} Tasks</span>}
                    {task.title}
                  </h3>
                  <p className="text-[13px] text-text-muted mt-1 truncate max-w-full" title={task.description}>{task.description}</p>
                </div>
                <div className="sm:w-[20%] mb-2 sm:mb-0 px-4 flex items-center gap-2 text-[14px] text-text-muted font-medium">
                  <MapPin className="h-[14px] w-[14px] shrink-0" /> 
                  <span className="truncate">{task.locality}</span>
                  {task.dist !== undefined && (
                     <span className="text-[11px] bg-surface-alt px-1.5 py-0.5 rounded border border-border-main ml-1 whitespace-nowrap">{(task.dist).toFixed(1)}km away</span>
                  )}
                </div>
                <div className="sm:w-[15%] px-4 flex items-center gap-2 text-[14px] text-text-muted font-medium">
                  <Clock className="h-[14px] w-[14px]" /> {task.severity === 'critical' ? 'ASAP' : '1-3 hrs'}
                </div>
                <div className="sm:w-[15%] px-4 sm:text-right mt-4 sm:mt-0 flex justify-end">
                  {activeTab === 'opportunities' && (
                    <button 
                      disabled={actionLoading === task.id}
                      onClick={() => handleCommit(task.id)}
                      className="h-9 px-4 text-[13px] font-bold text-surface-alt bg-brand-900 hover:bg-brand-800 flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Commit'}
                    </button>
                  )}
                  {activeTab === 'my committments' && (
                    <button 
                      disabled={actionLoading === task.id}
                      onClick={() => handleDone(task.id)}
                      className="h-9 px-4 text-[13px] font-bold text-text-main border border-border-main bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {actionLoading === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Mark Done</>}
                    </button>
                  )}
                  {activeTab === 'impact log' && (
                    <span className="text-[13px] font-bold text-green-600 flex items-center gap-1.5 justify-end">
                      <CheckCircle2 className="h-4 w-4" /> Resolved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
