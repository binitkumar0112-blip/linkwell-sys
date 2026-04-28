import React, { useEffect, useState } from 'react';
import { getAllNGOs, getNearbyNGOs, NGO } from '../services/ngoService';
import { CheckCircle, MapPin, Filter, Navigation, X, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCityName } from '../lib/geocode';

export default function NGOList() {
  const [ngos, setNGOs] = useState<(NGO & { distance?: number })[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [isNearMe, setIsNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [cityNames, setCityNames] = useState<Record<string, string>>({});
  const [selectedNGO, setSelectedNGO] = useState<NGO | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        let ngoData;
        if (isNearMe && userLocation) {
          ngoData = await getNearbyNGOs(userLocation.lat, userLocation.lng);
        } else {
          ngoData = await getAllNGOs();
        }
        
        const assignData = await supabase.from('issue_assignments').select('assigned_ngo_id').eq('assigned_type', 'ngo');
        
        setNGOs(ngoData);
        setAssignments(assignData.data || []);

        // Reverse geocode all NGO locations
        const cityMap: Record<string, string> = {};
        await Promise.all(
          ngoData.map(async (ngo) => {
            if (ngo.latitude && ngo.longitude) {
              cityMap[ngo.id] = await getCityName(ngo.latitude, ngo.longitude);
            }
          })
        );
        setCityNames(cityMap);
      } catch (err: any) {
        console.error('Failed to load NGOs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isNearMe, userLocation]);

  const handleNearMe = () => {
    if (isNearMe) {
      setIsNearMe(false);
      setUserLocation(null);
    } else {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsNearMe(true);
        },
        () => {
          alert("Location access denied or failed.");
          setLoading(false);
        }
      );
    }
  };

  const getActiveCount = (ngoId: string) => {
    return assignments.filter(a => a.assigned_ngo_id === ngoId).length;
  };

  const categories = Array.from(new Set(ngos.map(n => n.category.toLowerCase()))).filter(Boolean);
  
  const filteredNGOs = ngos.filter(ngo => 
    filterCat === 'all' || ngo.category.toLowerCase() === filterCat
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 h-[calc(100vh-72px)] overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-main pb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">NGO Directory</h1>
          <p className="text-text-muted mt-1">Verified partner organizations working in our community.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={handleNearMe}
            className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-colors text-sm font-semibold ${isNearMe ? 'bg-brand-900 text-white border-brand-900' : 'bg-surface p-2 border-border-main text-text-muted hover:text-text-main'}`}
          >
            <Navigation className="h-4 w-4" />
            {isNearMe ? 'Showing Nearby' : 'Near Me'}
          </button>
          <div className="flex items-center gap-2 bg-surface px-4 py-2.5 rounded border border-border-main">
            <Filter className="h-4 w-4 text-text-muted" />
            <select 
              value={filterCat} 
              onChange={e => setFilterCat(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-text-main capitalize text-sm font-semibold"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-12 pb-10 animate-pulse">
          <div>
            <div className="h-8 bg-border-main rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-main border border-border-main rounded-xl p-6 h-56"></div>
              ))}
            </div>
          </div>
        </div>
      ) : filteredNGOs.length === 0 ? (
        <div className="text-center py-40 border border-dashed rounded-xl border-border-main text-text-muted">No NGOs found for this category.</div>
      ) : (
        <div className="space-y-12 pb-10">
          {categories.filter(c => filterCat === 'all' || c === filterCat).map(category => {
            const orgs = filteredNGOs.filter(n => n.category.toLowerCase() === category);
            if (orgs.length === 0) return null;
            return (
              <div key={category}>
                <h2 className="text-xl font-bold uppercase tracking-widest text-brand-900 border-b-2 border-border-main/50 pb-2 mb-6">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orgs.map(ngo => (
                    <div 
                      key={ngo.id} 
                      onClick={() => setSelectedNGO(ngo)}
                      className="bg-surface-main border border-border-main rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <h3 className="text-xl font-bold text-text-main leading-tight">{ngo.name}</h3>
                        {ngo.verified && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" title="Verified NGO" />}
                      </div>
                      <div className="space-y-3 text-sm text-text-muted">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-brand-900" />
                          {cityNames[ngo.id] || (ngo.latitude && ngo.longitude ? `${ngo.latitude.toFixed(2)}, ${ngo.longitude.toFixed(2)}` : 'Location unknown')}
                        </p>
                        {ngo.distance !== undefined && (
                          <p className="text-brand-900 font-semibold bg-brand-50 inline-block px-2 py-0.5 rounded text-xs mt-1">
                            {ngo.distance.toFixed(1)} km away
                          </p>
                        )}
                        <div className="pt-4 mt-4 border-t border-border-main/60 flex justify-between items-center">
                           <span className="text-xs uppercase font-bold tracking-widest text-text-muted">Active Cases</span>
                           <span className="bg-brand-50 text-brand-900 font-bold px-3 py-1 rounded">{getActiveCount(ngo.id)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NGO Details Modal */}
      {selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedNGO(null)}>
          <div 
            className="bg-surface-main w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border-main flex justify-between items-center bg-surface-alt">
              <h2 className="font-serif font-bold text-xl">NGO Details</h2>
              <button onClick={() => setSelectedNGO(null)} className="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-surface-main transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-2xl font-bold text-text-main leading-tight">{selectedNGO.name}</h3>
                {selectedNGO.verified && <CheckCircle className="h-6 w-6 text-green-500 shrink-0" title="Verified NGO" />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-1 rounded inline-block">
                {selectedNGO.category}
              </span>
              
              <div className="space-y-3 pt-2 text-text-muted">
                <p className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-900" />
                  {cityNames[selectedNGO.id] || (selectedNGO.latitude && selectedNGO.longitude ? `${selectedNGO.latitude.toFixed(2)}, ${selectedNGO.longitude.toFixed(2)}` : 'Location unknown')}
                </p>
                
                <p className="flex items-center gap-2 text-text-main font-medium mt-4 p-3 bg-surface-alt rounded border border-border-main">
                  <Mail className="h-5 w-5 text-brand-900" />
                  {/* Handle the joined user email if available */}
                  {(selectedNGO as any).users?.email || 'Contact email not available'}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-border-main bg-surface-alt flex justify-end">
              <button onClick={() => setSelectedNGO(null)} className="bg-brand-900 text-white px-6 py-2 rounded font-bold hover:bg-brand-800 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
