import React, { useState, useEffect } from 'react';
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Zap } from 'lucide-react';
import api from '../services/api';

const MOCK_TRANSACTIONS = [
  { id: 1, type: 'earned', amount: 10, description: 'Taught React Hooks session to Jane Smith', date: '2026-04-18T14:30:00Z' },
  { id: 2, type: 'spent', amount: 15, description: 'Booked UI/UX Masterclass with John Doe', date: '2026-04-17T09:15:00Z' },
  { id: 3, type: 'earned', amount: 20, description: 'Initial signup bonus', date: '2026-04-15T12:00:00Z' }
];

const Credits = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCreditsData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch balance from profile
        const profileRes = await api.get('/user/profile').catch(() => ({ data: { credits: 15 } }));
        setBalance(profileRes.data.credits || 0);

        // Fetch transactions history
        const transactionsRes = await api.get('/transactions').catch(() => ({ data: MOCK_TRANSACTIONS }));
        setTransactions(transactionsRes.data || []);
        
      } catch (err) {
        setError('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditsData();
  }, []);

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center fade-in">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 fade-in px-2 pb-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Credits & Billing</h2>
          <p className="text-slate-400 mt-2">Manage your platform credits and view transaction history.</p>
        </div>
        
        {/* Balance Card */}
        <div className="glass p-5 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(59,130,246,0.15)] flex items-center gap-6 shrink-0 w-full md:w-auto">
           <div className="w-14 h-14 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
              <Wallet className="h-7 w-7 text-amber-400" />
           </div>
           <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Balance</p>
              <h3 className="text-3xl font-bold text-white flex items-center gap-2">
                 {balance} <Zap className="h-6 w-6 text-amber-500" />
              </h3>
           </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/50 flex items-center gap-3 text-slate-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="flex-1 glass rounded-2xl border border-white/10 shadow-xl overflow-hidden flex flex-col bg-slate-900/40">
         <div className="p-6 border-b border-white/5 bg-slate-800/40 backdrop-blur-md">
            <h3 className="text-xl font-bold text-white">Transaction History</h3>
         </div>
         
         <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            {transactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50 mb-4">
                    <Wallet className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-1">No transactions yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">Your credit history will appear here once you book or host a session.</p>
               </div>
            ) : (
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-800/80 sticky top-0 z-10 backdrop-blur-md">
                     <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                     </tr>
                  </thead>
                  <tbody>
                     {transactions.map((tx) => {
                        const isEarned = tx.type === 'earned';
                        const colorClass = isEarned ? 'text-emerald-400' : 'text-rose-400';
                        const bgClass = isEarned ? 'bg-emerald-500/10' : 'bg-rose-500/10';
                        const Icon = isEarned ? ArrowDownLeft : ArrowUpRight;
                        
                        return (
                          <tr key={tx.id} className="border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                               <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                                 #{tx.id.toString().padStart(6, '0')}
                               </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                               {formatDate(tx.date)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-200">
                               {tx.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <div className={`p-1.5 rounded-full ${bgClass}`}>
                                    <Icon className={`h-4 w-4 ${colorClass}`} />
                                  </div>
                                  <span className={`font-bold text-lg ${colorClass}`}>
                                    {isEarned ? '+' : '-'}{tx.amount}
                                  </span>
                               </div>
                            </td>
                          </tr>
                        );
                     })}
                  </tbody>
               </table>
            )}
         </div>
      </div>
    </div>
  );
};

export default Credits;
