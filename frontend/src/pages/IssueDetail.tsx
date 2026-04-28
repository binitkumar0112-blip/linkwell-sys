import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIssueById, getIssueUpdates, updateIssueStatus, IssueUpdate } from '../services/issueDetails';
import { upvoteIssue } from '../services/issues';
import { processDonation } from '../services/donationService';
import { getMatchingNGOs, assignNGO, NGO } from '../services/ngoService';
import { subscribeToIssueUpdates } from '../services/realtimeService';
import { acceptIssue } from '../services/volunteerService';
import { useAuth } from '../hooks/useAuth';
import { MapPin, CheckCircle, ThumbsUp, Heart, Loader2, Package } from 'lucide-react';
import MapView from '../components/MapView';
import { getUserFriendlyError } from '../lib/errorMessages';

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, linkedProfile } = useAuth();
  
  const [issue, setIssue] = useState<any>(null);
  const [updates, setUpdates] = useState<IssueUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [ngos, setNgos] = useState<(NGO & { distance: number })[]>([]);
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [donating, setDonating] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        setLoading(true);
        const [issueData, updatesData] = await Promise.all([
          getIssueById(id),
          getIssueUpdates(id)
        ]);
        setIssue(issueData);
        setUpdates(updatesData);
        
        if (issueData) {
          const matchedNGOs = await getMatchingNGOs(issueData);
          setNgos(matchedNGOs);
        }
      } catch (err: any) {
        setError(getUserFriendlyError(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Listen for new updates in real-time
    const unsubscribe = subscribeToIssueUpdates(id || null, (payload) => {
      if (payload.eventType === 'INSERT') {
         setUpdates(prev => [payload.new, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!id || newStatus === issue?.status) return;

    try {
      setUpdating(true);
      await updateIssueStatus(id, newStatus);
      const newUpdates = await getIssueUpdates(id);
      
      setIssue({ ...issue, status: newStatus });
      setUpdates(newUpdates);
    } catch (err: any) {
      alert('Failed to update status: ' + getUserFriendlyError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignNGO = async (ngo: NGO) => {
    if (!id) return;
    try {
      setUpdating(true);
      await assignNGO(id, ngo.id, ngo.name);
      const newUpdates = await getIssueUpdates(id);
      
      setIssue({ ...issue, status: 'assigned' });
      setUpdates(newUpdates);
      alert(`Successfully assigned ${ngo.name}`);
    } catch (err: any) {
      alert('Failed to assign NGO: ' + getUserFriendlyError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleVolunteerAccept = async () => {
    if (!id || !user) return;
    try {
      setUpdating(true);
      const volName = linkedProfile?.name || user.email || 'Volunteer';
      await acceptIssue(id, user.uid, volName);
      const newUpdates = await getIssueUpdates(id);
      
      setIssue({ ...issue, status: 'in_progress' });
      setUpdates(newUpdates);
      alert('You have successfully accepted this task!');
    } catch (err: any) {
      alert('Failed to accept task: ' + getUserFriendlyError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleUpvote = async () => {
    if (!id || !user) {
      alert("Please log in to upvote.");
      return;
    }
    try {
      setUpvoting(true);
      await upvoteIssue(id, user.uid);
      setIssue((prev: any) => ({ ...prev, upvotes_count: (prev.upvotes_count || 0) + 1 }));
    } catch (err: any) {
      alert(getUserFriendlyError(err) || "Failed to upvote.");
    } finally {
      setUpvoting(false);
    }
  };

  const handleDonate = async () => {
    if (!id || !user) {
      alert("Please log in to donate.");
      return;
    }
    const amt = parseFloat(donationAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    try {
      setDonating(true);
      await processDonation(id, user.uid, amt);
      setIssue((prev: any) => ({ ...prev, amount_raised: (prev.amount_raised || 0) + amt }));
      setDonationAmount('');
      alert("Thank you for your generous donation!");
    } catch (err: any) {
      alert(getUserFriendlyError(err) || "Donation failed.");
    } finally {
      setDonating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading issue details...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!issue) return <div className="p-8 text-center text-gray-500">Issue not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <button 
          onClick={() => navigate(-1)} 
          className="text-primary hover:underline mb-4 inline-block"
        >
          &larr; Back
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">{issue.title}</h1>
            </div>
            <p className="text-text-muted mt-1">Category: {issue.category} | Created: {new Date(issue.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex flex-col md:items-end gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleUpvote}
                disabled={upvoting}
                className="flex items-center gap-2 bg-surface-main border border-border-main px-4 py-2 rounded-lg font-bold text-text-main hover:bg-brand-50 hover:text-brand-900 transition shadow-sm disabled:opacity-50"
              >
                {upvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                {issue.upvotes_count || 0} Upvotes
              </button>
              
              {issue.priority_score !== undefined && (
                <div className={`px-2 py-1 rounded text-xs font-bold ${issue.priority_score >= 50 ? 'bg-red-100 text-red-700' : issue.priority_score >= 25 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                  {issue.priority_score >= 50 ? '🔥 Critical' : issue.priority_score >= 25 ? 'Moderate' : 'Low'} priority ({issue.priority_score || 0})
                </div>
              )}
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold capitalize">
                {issue.status}
              </span>
              {(role === 'ngo_admin' || !role) && (
                <select 
                  value={issue.status} 
                  onChange={handleStatusChange} 
                  disabled={updating}
                  className="px-3 py-2 border border-border-color rounded-md bg-white shadow-sm focus:outline-none focus:ring-primary focus:border-primary capitalize disabled:opacity-50"
                >
                  <option value="reported">Reported</option>
                  <option value="verified">Verified</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              )}
            </div>
            
            {(role === 'volunteer' || user) && (issue.status === 'reported' || issue.status === 'verified') && (
               <button 
                 onClick={handleVolunteerAccept}
                 disabled={updating}
                 className="px-4 py-2 bg-brand-900 text-white rounded font-semibold text-sm hover:bg-brand-800 transition disabled:opacity-50"
               >
                 Accept as Volunteer
               </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-main p-8 rounded-xl border border-border-main shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-xl font-bold mb-4 border-b border-border-main pb-3">Description</h2>
            <p className="text-text-muted whitespace-pre-wrap leading-relaxed text-[15px]">{issue.description}</p>
          </div>

          <div className="bg-surface-main p-8 rounded-xl border border-border-main shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-xl font-bold mb-6 border-b border-border-main pb-3">Timeline Updates</h2>
            {updates.length === 0 ? (
              <p className="text-text-muted">No updates yet.</p>
            ) : (
              <div className="space-y-0">
                {updates.map((update, idx) => (
                  <div key={update.id || Math.random()} className="relative flex gap-5 items-start pb-6 last:pb-0 group">
                    {idx !== updates.length - 1 && (
                      <div className="absolute top-4 bottom-0 left-[5px] w-[2px] bg-border-main drop-shadow-sm"></div>
                    )}
                    <div className="relative z-10 w-3 h-3 mt-1.5 rounded-full bg-brand-900 flex-shrink-0 ring-4 ring-brand-900/10 shadow-sm shadow-brand-900/50"></div>
                    <div>
                      <p className="text-text-main font-medium text-[15px]">{update.message}</p>
                      <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-bold">
                        {new Date(update.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resources Used (Layered Visibility) */}
          {issue.resource_transactions && issue.resource_transactions.length > 0 && (
            <div className="bg-surface-main p-8 rounded-xl border border-border-main shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-bold mb-4 border-b border-border-main pb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Resources Deployed
              </h2>
              <div className="space-y-3">
                {issue.resource_transactions.filter((tx: any) => tx.type === 'used').map((tx: any, idx: number) => {
                  // Determine layered visibility
                  // Show full details if user is ngo_admin AND belongs to the NGO that deployed it.
                  // Otherwise, show public minimal info.
                  const isInternal = role === 'ngo_admin'; // Simplified for display, ideal would check matching assigned_ngo_id
                  
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <div>
                        <span className="font-semibold text-slate-800">{tx.resources?.name}</span>
                        <span className="ml-2 text-sm text-slate-500 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                          {tx.resources?.category}
                        </span>
                      </div>
                      
                      <div className="mt-2 sm:mt-0 flex items-center gap-4 text-sm">
                        {isInternal && tx.notes && (
                          <span className="text-slate-500 italic max-w-xs truncate" title={tx.notes}>"{tx.notes}"</span>
                        )}
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                          {tx.quantity} {tx.resources?.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Map Location */}
          <div className="bg-surface-main rounded-xl border border-border-main shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="h-48 w-full relative">
              <MapView issues={[issue]} />
            </div>
            <div className="p-4 bg-surface-alt border-t border-border-main">
              <p className="text-sm font-bold text-text-main flex items-center gap-2"><MapPin className="h-4 w-4" /> Location Confirmed</p>
            </div>
          </div>

          {/* Donation Widget */}
          {(issue.amount_needed || 0) > 0 && (
            <div className="bg-surface-main p-6 rounded-xl border border-border-main shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                <h2 className="text-lg font-bold text-text-main">Fund this Cause</h2>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm font-bold mb-1.5">
                  <span className="text-brand-900">₹{issue.amount_raised || 0} raised</span>
                  <span className="text-text-muted">Goal: ₹{issue.amount_needed}</span>
                </div>
                <div className="w-full bg-surface-alt rounded-full h-2.5">
                  <div 
                    className="bg-brand-500 h-2.5 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, Math.round(((issue.amount_raised || 0) / issue.amount_needed) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  {['50', '100', '500'].map(amt => (
                    <button 
                      key={amt}
                      onClick={() => setDonationAmount(amt)}
                      className={`flex-1 py-1.5 rounded-lg border text-sm font-bold transition-colors ${donationAmount === amt ? 'bg-brand-50 border-brand-900 text-brand-900' : 'bg-surface-alt border-border-main text-text-muted hover:border-brand-300'}`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Custom amount" 
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="flex-1 w-full border border-border-main rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-900"
                  />
                  <button 
                    onClick={handleDonate}
                    disabled={donating || !donationAmount}
                    className="bg-brand-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-800 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {donating ? 'Processing...' : 'Donate'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-main p-8 rounded-xl border border-border-main shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-8">
        <h2 className="text-xl font-bold mb-6 border-b border-border-main pb-3">Recommended NGOs</h2>
        {ngos.length === 0 ? (
          <p className="text-text-muted">No nearby NGOs match this issue.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ngos.slice(0, 4).map((ngo) => (
              <div key={ngo.id} className="border border-border-main p-4 rounded-lg bg-surface-main flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-text-primary">{ngo.name}</h3>
                    {ngo.verified && <CheckCircle className="h-5 w-5 text-green-500" title="Verified NGO" />}
                  </div>
                  <p className="text-sm text-text-muted capitalize flex items-center gap-1">
                    {ngo.category}
                  </p>
                  <p className="text-sm font-mono text-text-muted mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {ngo.distance.toFixed(2)} km away
                  </p>
                </div>
                <button 
                  onClick={() => handleAssignNGO(ngo)}
                  disabled={issue.status !== 'reported' && issue.status !== 'verified'}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-md font-semibold disabled:opacity-50 hover:bg-primary-dark transition"
                >
                  {issue.status !== 'reported' && issue.status !== 'verified' ? 'Cannot Assign' : 'Assign NGO'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
