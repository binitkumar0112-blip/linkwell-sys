// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapView from '../components/MapView';
import { getIssues, upvoteIssue } from '../services/issues';
import { subscribeToIssues } from '../services/realtimeService';
import { useAuth } from '../hooks/useAuth';
import { MapPin, Plus, ThumbsUp, Clock, ChevronRight, Filter, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SeverityBadge, StatusBadge, CategoryBadge } from '../components/ui/badges';
import { IssueCardSkeleton } from '../components/ui/Skeleton';

const PRIORITY_BORDERS: Record<string, string> = {
  critical: 'border-l-red-500',
  high:     'border-l-orange-500',
  medium:   'border-l-amber-400',
  low:      'border-l-emerald-500',
};

const CATEGORIES = ['all', 'infrastructure', 'health', 'rescue', 'food', 'water', 'sanitation', 'environment'];
const SORT_OPTIONS = [
  { value: 'priority', label: 'Highest Priority' },
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'newest', label: 'Newest First' },
];

export default function PublicCommunityView() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true);
        const data = await getIssues();
        setIssues(data || []);
      } catch (err: any) {
        console.error('Error fetching community issues:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchIssues();

    const unsubscribe = subscribeToIssues((payload) => {
      setIssues(curr => {
        if (payload.eventType === 'INSERT') return [payload.new, ...curr];
        if (payload.eventType === 'UPDATE') return curr.map(i => i.id === payload.new.id ? payload.new : i);
        if (payload.eventType === 'DELETE') return curr.filter(i => i.id !== payload.old.id);
        return curr;
      });
    });
    return () => unsubscribe();
  }, []);

  const handleUpvote = async (issueId: string) => {
    if (!user) { alert('Please log in to upvote issues.'); return; }
    setIssues(curr => curr.map(i => i.id === issueId ? { ...i, upvotes_count: (i.upvotes_count || 0) + 1 } : i));
    setUpvoting(issueId);
    try {
      await upvoteIssue(issueId, user.uid);
    } catch (e: any) {
      alert(e.message || 'Could not upvote.');
      setIssues(curr => curr.map(i => i.id === issueId ? { ...i, upvotes_count: (i.upvotes_count || 0) - 1 } : i));
    } finally {
      setUpvoting(null);
    }
  };

  const filteredIssues = issues
    .filter(i => filterCategory === 'all' || (i.category || 'other').toLowerCase() === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'priority') return (b.priority_score || 0) - (a.priority_score || 0);
      if (sortBy === 'upvotes') return (b.upvotes_count || 0) - (a.upvotes_count || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50">

      {/* ── Map Section ─────────────────────────────── */}
      <div className="h-[50vh] w-full relative shadow-sm z-10 shrink-0">
        <MapView issues={filteredIssues} />

        {/* Floating Report FAB */}
        <Link to="/report" className="fab absolute bottom-4 right-4 z-[400]">
          <Plus className="h-4 w-4" /> Report Issue
        </Link>

        {/* Map legend */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-md hidden sm:flex items-center gap-3">
          {[['#EF4444','Reported'], ['#F97316','In Progress'], ['#22C55E','Resolved']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 z-20 shadow-sm shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Title + count */}
          <div className="flex items-center gap-2 shrink-0">
            <MapPin className="h-5 w-5 text-indigo-600" />
            <h2 className="text-[17px] font-bold text-slate-900">Community Feed</h2>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{filteredIssues.length}</span>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 flex-1 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-150 ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs font-semibold text-slate-600 bg-slate-100 border-0 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Issue List ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-3">

          {/* Loading skeletons */}
          {loading && [1, 2, 3].map(i => <IssueCardSkeleton key={i} />)}

          {/* Empty state */}
          {!loading && filteredIssues.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">No issues found</h3>
              <p className="text-sm text-slate-500 mb-6">Be the first to report a problem in this area.</p>
              <Link to="/report"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all">
                <Plus className="h-4 w-4" /> Report an Issue
              </Link>
            </div>
          )}

          {/* Issue cards */}
          {filteredIssues.map(issue => {
            const borderColor = PRIORITY_BORDERS[issue.urgency?.toLowerCase()] || PRIORITY_BORDERS.medium;
            const needed = issue.amount_needed || 0;
            const raised = issue.amount_raised || 0;
            const pct = needed > 0 ? Math.min(100, Math.round((raised / needed) * 100)) : 0;

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${borderColor} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Left content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <SeverityBadge severity={issue.urgency || 'medium'} />
                      <StatusBadge status={issue.status || 'reported'} />
                      {issue.category && <CategoryBadge category={issue.category} />}
                    </div>

                    {/* Title */}
                    <h3 className="text-[16px] font-bold text-slate-900 leading-snug mb-1.5 line-clamp-1">
                      {issue.title}
                    </h3>

                    {/* Meta: time + priority */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                      </span>
                      {issue.priority_score > 0 && (
                        <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                          Priority Score: {issue.priority_score}
                        </span>
                      )}
                    </div>

                    {/* Donation bar */}
                    {needed > 0 && (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-2">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-indigo-600">₹{raised} raised</span>
                          <span className="text-slate-400">Goal: ₹{needed}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: upvote + CTA */}
                  <div className="flex flex-col items-end gap-2.5 shrink-0">
                    <button
                      onClick={() => handleUpvote(issue.id)}
                      disabled={upvoting === issue.id}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all group min-w-[54px]"
                    >
                      <ThumbsUp className={`h-4 w-4 mb-1 transition-colors ${upvoting === issue.id ? 'text-indigo-600 animate-bounce' : 'text-slate-400 group-hover:text-indigo-600'}`} />
                      <span className="text-xs font-bold text-slate-700">{issue.upvotes_count || 0}</span>
                    </button>

                    <Link
                      to={`/issue/${issue.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
