// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, Heart, X, Loader2, QrCode } from "lucide-react";
import { mockProblems } from "../lib/mock-data";

export default function DonationFlow() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number>(1000);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pan, setPan] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const publicProblems = mockProblems.filter(p => p.is_public && p.amount_needed > 0).sort((a,b) => b.priority_score - a.priority_score);
      setProblems(publicProblems);
      setLoading(false);
    }, 400);
  }, []);

  const handleDonate = async () => {
    if (!selectedCase || !email || !amount) return;
    setIsProcessing(true);

    try {
      setTimeout(() => {
        const newRaised = (selectedCase.amount_raised || 0) + amount;
        setProblems(prev => prev.map(p => p.id === selectedCase.id ? { ...p, amount_raised: newRaised } : p));
        setStep(4);
        setIsProcessing(false);
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("Donation failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.locality.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-72px)] w-full">
      
      <main className="flex-1 overflow-y-auto px-4 py-12 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-serif text-text-main mb-2">Fund Civic Action</h1>
        <p className="text-[14px] text-text-muted mb-8 max-w-2xl">
          Support verified local NGOs responding to immediate community needs. 100% of your donation goes directly to the executing organization.
        </p>

        <div className="mb-6 flex gap-4">
          <input 
            type="text" 
            placeholder="Search by area or problem..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md border border-border-main p-3 text-[14px] bg-surface-main focus:border-brand-900 focus:outline-none"
          />
        </div>

        <div className="bg-surface-main border text-left border-border-main min-h-[400px]">
           <table className="w-full text-left text-[14px]">
             <thead className="bg-surface-alt/50 border-b border-border-main text-text-muted font-bold text-[11px] uppercase tracking-widest">
               <tr>
                 <th className="px-6 py-4">Initiative</th>
                 <th className="px-6 py-4">Goal</th>
                 <th className="px-6 py-4">Progress</th>
                 <th className="px-6 py-4 text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border-main">
               {loading ? (
                 <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-brand-900" /></td></tr>
               ) : filteredProblems.length === 0 ? (
                 <tr><td colSpan={4} className="py-20 text-center text-text-muted">No fundable initiatives found.</td></tr>
               ) : filteredProblems.map(problem => {
                 const raised = problem.amount_raised || 0;
                 const needed = problem.amount_needed || 1;
                 const pct = Math.min(100, Math.round((raised / needed) * 100));
                 
                 return (
                   <tr key={problem.id} className="hover:bg-surface-alt transition-colors">
                     <td className="px-6 py-4">
                       <h3 className="font-bold text-text-main text-[15px] mb-1">{problem.title}</h3>
                       <p className="text-[13px] text-text-muted line-clamp-1 max-w-sm">{problem.description}</p>
                     </td>
                     <td className="px-6 py-4 font-mono text-text-main font-semibold">
                       ₹{needed.toLocaleString('en-IN')}
                     </td>
                     <td className="px-6 py-4">
                       <div className="w-full max-w-[140px]">
                         <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest mb-1.5 text-text-muted">
                           <span>₹{raised.toLocaleString('en-IN')}</span>
                           <span className="text-brand-900">{pct}%</span>
                         </div>
                         <div className="h-1.5 w-full bg-border-main overflow-hidden rounded-full">
                           <div className="h-full bg-brand-900" style={{ width: `${pct}%` }} />
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => { setSelectedCase(problem); setStep(1); }}
                         className="inline-flex h-10 items-center justify-center bg-brand-900 text-surface-alt px-6 hover:bg-brand-800 transition-colors font-bold text-[12px] uppercase tracking-widest"
                       >
                         Donate
                       </button>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
        </div>
      </main>

      {selectedCase && (
        <aside className="w-full sm:w-[480px] bg-surface-main border-l border-border-main flex flex-col shrink-0 relative shadow-2xl sm:shadow-none animate-in slide-in-from-right-10 absolute sm:static right-0 h-full z-10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-main bg-surface-alt">
             <div className="flex items-center gap-4">
               {[1, 2, 3].map(s => (
                 <div key={s} className="flex items-center text-[12px] font-bold">
                   <div className={`h-[28px] w-[28px] rounded-full flex items-center justify-center border-2 ${step >= s ? 'border-brand-900 text-brand-900 bg-brand-100/50' : 'border-border-main text-text-muted'}`}>
                     {s}
                   </div>
                 </div>
               ))}
             </div>
             <button onClick={() => setSelectedCase(null)} className="text-text-muted hover:text-text-main p-1">
               <X className="h-5 w-5" />
             </button>
          </div>

          <div className="p-8 flex-1 overflow-y-auto">
            <div className="mb-10 pb-6 border-b border-border-main">
              <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2 block font-mono">CASE: {selectedCase.id.slice(0,8)}</span>
              <h2 className="text-[28px] font-serif text-text-main leading-tight mb-3">{selectedCase.title}</h2>
              <p className="text-[14px] text-text-muted leading-relaxed">{selectedCase.description}</p>
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-[14px] uppercase tracking-wider text-text-main">Choose an amount</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[500, 1000, 2500, 5000].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setAmount(amt)}
                      className={`h-12 border font-mono transition-colors font-bold text-[15px] ${amount === amt ? 'border-brand-900 bg-brand-900/5 text-brand-900' : 'border-border-main hover:border-brand-900 text-text-main'}`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <div className="relative pt-2">
                   <span className="absolute left-4 top-1/2 translate-y-[2px] text-text-muted font-mono font-bold">₹</span>
                   <input 
                     type="number" 
                     value={amount}
                     onChange={(e) => setAmount(Number(e.target.value))}
                     className="w-full h-[52px] pl-10 pr-4 border border-border-main focus:border-brand-900 focus:outline-none transition-colors font-mono text-[16px] font-bold" 
                   />
                </div>
                <button 
                  disabled={!amount || amount <= 0}
                  onClick={() => setStep(2)} 
                  className="w-full h-[52px] bg-brand-900 text-surface-alt font-bold text-[14px] uppercase tracking-widest hover:bg-brand-800 transition-colors mt-8 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-[14px] uppercase tracking-wider text-text-main">Your Details</h3>
                <div className="space-y-5">
                   <div>
                     <label className="block text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2">Full Name</label>
                     <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full h-12 border border-border-main bg-surface-alt px-4 text-[14px] text-text-main focus:border-brand-900 focus:bg-surface-main focus:outline-none transition-colors" />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2">Email</label>
                     <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full h-12 border border-border-main bg-surface-alt px-4 text-[14px] text-text-main focus:border-brand-900 focus:bg-surface-main focus:outline-none transition-colors" />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2">PAN (For 80G Receipt)</label>
                     <input type="text" value={pan} onChange={e=>setPan(e.target.value)} className="w-full h-12 border border-border-main bg-surface-alt px-4 text-[14px] text-text-main focus:border-brand-900 focus:bg-surface-main focus:outline-none transition-colors font-mono uppercase" />
                   </div>
                </div>
                <button 
                  disabled={!name || !email}
                  onClick={() => setStep(3)} 
                  className="w-full h-[52px] bg-brand-900 text-surface-alt font-bold text-[14px] uppercase tracking-widest hover:bg-brand-800 transition-colors mt-8 disabled:opacity-50"
                >
                  Proceed to Payment
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="font-bold text-[14px] uppercase tracking-wider text-text-main">Complete Payment</h3>
                
                <div className="border border-border-main p-6 text-center space-y-4">
                  <div className="mx-auto w-32 h-32 bg-surface-alt border border-border-main flex items-center justify-center p-4">
                    <QrCode className="w-full h-full text-text-muted/50" strokeWidth={1} />
                  </div>
                  <p className="text-[14px] text-text-muted">Scan using any UPI app</p>
                  <p className="font-mono font-bold text-2xl text-brand-900">₹{amount.toLocaleString()}</p>
                </div>

                <a 
                  href={`upi://pay?pa=linkwell@upi&pn=LinkwellNGO&am=${amount}&cu=INR`}
                  className="block text-center w-full h-[52px] leading-[52px] border border-brand-900 text-brand-900 font-bold text-[14px] uppercase tracking-widest hover:bg-brand-50 transition-colors"
                >
                  Open UPI App
                </a>

                <button 
                  disabled={isProcessing}
                  onClick={handleDonate} 
                  className="w-full h-[52px] bg-brand-900 text-surface-alt font-bold text-[14px] uppercase tracking-widest hover:bg-brand-800 transition-colors flex justify-center items-center gap-2"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                  I have completed payment
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 flex flex-col items-center justify-center py-16 animate-in slide-in-from-bottom-4">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <Heart className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <h3 className="text-[28px] font-serif text-text-main mb-3">Thank you!</h3>
                  <p className="text-text-muted text-[15px] max-w-sm mx-auto leading-relaxed">Your generous donation of <strong className="text-text-main">₹{amount}</strong> has been received. Your 80G receipt will be emailed shortly.</p>
                </div>
                <button onClick={() => setSelectedCase(null)} className="h-[44px] border border-border-main bg-white px-8 font-bold text-[13px] uppercase tracking-widest hover:bg-surface-alt transition-colors mt-4">
                  Close Dashboard
                </button>
              </div>
            )}
          </div>
        </aside>
      )}

    </div>
  );
}
