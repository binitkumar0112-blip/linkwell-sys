import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertCircle, RefreshCw, Archive, TrendingUp, TrendingDown, ClipboardList } from 'lucide-react';
import { 
  fetchResources, 
  fetchResourceAnalytics, 
  createResource, 
  addStock, 
  useStock, 
  fetchActiveNgoIssues,
  Resource,
  ResourceAnalytics
} from '../services/resourceService';
import { getUserFriendlyError } from '../lib/errorMessages';

export default function NGOResourceDashboard() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [analytics, setAnalytics] = useState<ResourceAnalytics | null>(null);
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showUseStock, setShowUseStock] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, statData, issuesData] = await Promise.all([
        fetchResources(),
        fetchResourceAnalytics(),
        fetchActiveNgoIssues()
      ]);
      setResources(resData);
      setAnalytics(statData);
      setActiveIssues(issuesData);
    } catch (err: any) {
      setError(getUserFriendlyError(err));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Forms State
  const [newResource, setNewResource] = useState({ name: '', category: 'medicine', unit: 'units' });
  const [stockOp, setStockOp] = useState({ resource_id: '', quantity: 0, notes: '', issue_id: '' });

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createResource(newResource);
      setShowAddResource(false);
      setNewResource({ name: '', category: 'medicine', unit: 'units' });
      loadData();
    } catch (err: any) {
      alert(getUserFriendlyError(err));
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOp.resource_id || stockOp.quantity <= 0) return alert('Select resource and valid quantity');
    try {
      await addStock({ 
        resource_id: stockOp.resource_id, 
        quantity: stockOp.quantity, 
        notes: stockOp.notes 
      });
      setShowAddStock(false);
      setStockOp({ resource_id: '', quantity: 0, notes: '', issue_id: '' });
      loadData();
    } catch (err: any) {
      alert(getUserFriendlyError(err));
    }
  };

  const handleUseStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockOp.resource_id || stockOp.quantity <= 0 || !stockOp.issue_id) {
      return alert('Select resource, valid quantity, and an issue.');
    }
    
    // Client-side validation for stock
    const resource = resources.find(r => r.id === stockOp.resource_id);
    if (resource && (resource.total_added - resource.total_used < stockOp.quantity)) {
      return alert('Insufficient stock!');
    }

    try {
      await useStock({ 
        resource_id: stockOp.resource_id, 
        quantity: stockOp.quantity, 
        issue_id: stockOp.issue_id,
        notes: stockOp.notes 
      });
      setShowUseStock(false);
      setStockOp({ resource_id: '', quantity: 0, notes: '', issue_id: '' });
      loadData();
    } catch (err: any) {
      alert(getUserFriendlyError(err));
    }
  };

  if (loading && !resources.length) {
    return (
      <div className="flex justify-center items-center h-96 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-3 text-lg">Loading Resource Data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Resource Management</h1>
          <p className="text-slate-500 mt-1">Track inventory, add stock, and log usage per issue.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddResource(true)}
            className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            <Plus className="w-4 h-4 mr-2" /> New Category
          </button>
          <button 
            onClick={() => setShowAddStock(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <TrendingUp className="w-4 h-4 mr-2" /> Receive Stock
          </button>
          <button 
            onClick={() => setShowUseStock(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <TrendingDown className="w-4 h-4 mr-2" /> Use Stock
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}

      {/* Analytics KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Asset Types</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.summary.total_resource_types}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><Archive className="w-5 h-5" /></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Units Received</p>
                <p className="text-2xl font-bold text-emerald-600">{analytics.summary.total_units_added}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Units Deployed</p>
                <p className="text-2xl font-bold text-indigo-600">{analytics.summary.total_units_used}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><TrendingDown className="w-5 h-5" /></div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Remaining</p>
                <p className="text-2xl font-bold text-slate-900">{analytics.summary.total_units_remaining}</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600"><Package className="w-5 h-5" /></div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warnings */}
      {analytics?.low_stock_warnings && analytics.low_stock_warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center text-orange-800 mb-2 font-medium">
            <AlertCircle className="w-5 h-5 mr-2" /> Low Stock Alerts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {analytics.low_stock_warnings.map(w => (
              <div key={w.id} className="bg-white px-3 py-2 rounded-lg border border-orange-100 flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">{w.name}</span>
                <span className="text-orange-600 font-bold">{w.remaining} {w.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-indigo-600" /> Current Inventory
          </h2>
          <button onClick={loadData} className="text-slate-500 hover:text-indigo-600 transition p-1">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {resources.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg">No resources tracked yet.</p>
            <p className="text-sm mt-1">Click "New Category" to start building your inventory.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 border-b border-slate-200 font-medium">Resource Name</th>
                  <th className="p-4 border-b border-slate-200 font-medium">Category</th>
                  <th className="p-4 border-b border-slate-200 font-medium text-right">Added</th>
                  <th className="p-4 border-b border-slate-200 font-medium text-right">Used</th>
                  <th className="p-4 border-b border-slate-200 font-medium text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.map((r) => {
                  const remaining = r.total_added - r.total_used;
                  const isLow = remaining < 10 || (r.total_added > 0 && remaining/r.total_added < 0.1);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-900">{r.name}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium capitalize">
                          {r.category}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-600">{r.total_added} {r.unit}</td>
                      <td className="p-4 text-right text-slate-600">{r.total_used} {r.unit}</td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-emerald-600'}`}>
                          {remaining} {r.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* ─── MODALS ────────────────────────────────────────────── */}
      
      {/* 1. Add Resource Type */}
      {showAddResource && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">New Resource Category</h3>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name (e.g. Paracetamol, Rice)</label>
                <input required type="text" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input 
                    list="resource-categories"
                    required 
                    value={newResource.category} 
                    onChange={e => setNewResource({...newResource, category: e.target.value})} 
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500" 
                    placeholder="Select or type..."
                  />
                  <datalist id="resource-categories">
                    <option value="medicine">Medicine</option>
                    <option value="food">Food</option>
                    <option value="clothes">Clothes</option>
                    <option value="funds">Funds</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <select value={newResource.unit} onChange={e => setNewResource({...newResource, unit: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                    <option value="units">Units</option>
                    <option value="tablets">Tablets</option>
                    <option value="kg">Kg</option>
                    <option value="liters">Liters</option>
                    <option value="packets">Packets</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddResource(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Receive Stock */}
      {showAddStock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-emerald-600"/> Receive Stock</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resource</label>
                <select required value={stockOp.resource_id} onChange={e => setStockOp({...stockOp, resource_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">Select a resource...</option>
                  {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.unit})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input required type="number" step="0.1" min="0.1" value={stockOp.quantity || ''} onChange={e => setStockOp({...stockOp, quantity: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes / Source (Optional)</label>
                <input type="text" placeholder="e.g. Donation from WHO" value={stockOp.notes} onChange={e => setStockOp({...stockOp, notes: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddStock(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Receive Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Use Stock */}
      {showUseStock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-indigo-600"/> Deploy Stock to Issue</h3>
            <form onSubmit={handleUseStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Issue</label>
                <select required value={stockOp.issue_id} onChange={e => setStockOp({...stockOp, issue_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">Select an active issue...</option>
                  {activeIssues.map(i => <option key={i.id} value={i.id}>{i.title} ({i.status})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Resource</label>
                <select required value={stockOp.resource_id} onChange={e => setStockOp({...stockOp, resource_id: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">Select a resource...</option>
                  {resources.filter(r => (r.total_added - r.total_used) > 0).map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.total_added - r.total_used} {r.unit} avail)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input required type="number" step="0.1" min="0.1" value={stockOp.quantity || ''} onChange={e => setStockOp({...stockOp, quantity: parseFloat(e.target.value)})} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <input type="text" placeholder="e.g. Distributed to 5 families" value={stockOp.notes} onChange={e => setStockOp({...stockOp, notes: e.target.value})} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowUseStock(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Deploy Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
