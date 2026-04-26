import React, { useState, useEffect } from 'react';
import { Search, Star, ChevronLeft, ChevronRight, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchTerm, 400);

  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/skills/categories');
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        setCategories(['Programming', 'Design', 'Marketing', 'Languages']);
      }
    })();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, minRating]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '6'
        });
        if (debouncedSearch) params.append('skill', debouncedSearch);
        if (category) params.append('category', category);
        if (minRating) params.append('rating', minRating);

        const { data } = await api.get(`/users?${params.toString()}`);

        if (data && data.users) {
          setMentors(data.users);
          setTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          setMentors(data);
          setTotalPages(Math.ceil(data.length / 6) || 1);
        } else {
          setMentors([]);
          setTotalPages(1);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load mentors. Is the backend running?');
        setMentors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedSearch, category, minRating, page]);

  return (
    <div className="h-full flex flex-col gap-6 fade-in px-2 pb-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Marketplace</h2>
          <p className="text-slate-400 mt-2">Discover new skills to learn from our community.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-20">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none font-medium cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none min-w-[140px] font-medium cursor-pointer"
          >
            <option value="">Any Rating</option>
            <option value="3">3+ Stars</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/50 flex items-center gap-3 text-rose-400 mt-4">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : mentors.length === 0 ? (
        <div className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl flex flex-col items-center justify-center relative bg-slate-800/20 p-8 text-center mt-4">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-medium text-slate-300 mb-2">No mentors found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your filters or using a different search term.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pt-2 pb-4">
            {mentors.map((mentor, i) => (
              <div key={mentor.id || i} className="glass rounded-xl overflow-hidden group hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] transition-all duration-300 border border-white/10 flex flex-col relative">
                <div className="h-28 bg-slate-800 relative overflow-hidden pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 mix-blend-overlay"></div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1 shadow-lg border border-white/10 z-10">
                    <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    {mentor.rating ? Number(mentor.rating).toFixed(1) : 'New'}
                  </div>
                </div>

                <div className="absolute top-16 left-6 z-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 border-4 border-[#0f172a] shadow-xl flex items-center justify-center text-3xl font-bold text-white">
                    {(mentor.name || 'A')[0].toUpperCase()}
                  </div>
                </div>

                <div className="p-6 pt-12 flex-1 flex flex-col z-0 relative">
                  <div>
                    <h3 className="text-xl font-bold transition-colors truncate">{mentor.name || 'Anonymous'}</h3>
                    <p className="text-slate-400 text-sm line-clamp-1 mt-0.5">{mentor.headline || 'Passionate about teaching'}</p>
                  </div>

                  <div className="mt-5 mb-5">
                    <div className="flex flex-wrap gap-2">
                      {(mentor.skills || []).slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white/5 text-slate-300 rounded-full text-xs font-medium border border-white/10 hover:border-white/20 hover:bg-white/10 transition-colors shadow-sm">
                          {typeof skill === 'string' ? skill : skill.name}
                        </span>
                      ))}
                      {(mentor.skills && mentor.skills.length > 3) && (
                        <span className="px-3 py-1 bg-white/5 text-slate-400 rounded-full text-xs font-medium border border-white/10">+{mentor.skills.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-700/50 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">Session</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1.5 text-lg">
                        {mentor.hourlyRate || 10} <Zap className="h-4 w-4" />
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/app/book/${mentor.id}`)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:scale-105"
                    >
                      Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-auto pt-6 pb-2">
              <div className="glass flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 shadow-xl">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-300 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2 px-4 shadow-inner bg-black/20 rounded-xl py-1.5">
                  <span className="text-sm font-medium text-slate-300">
                    Page <strong className="text-white">{page}</strong> of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-300 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Marketplace;
