import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Calendar, BookOpen, AlertCircle, Loader2, Clock, Star, ArrowRight, Users } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, sessionsRes] = await Promise.allSettled([
          api.get('/user/profile'),
          api.get('/sessions/my'),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data);
        } else {
          setError(profileRes.reason?.response?.data?.message || 'Failed to load profile.');
        }

        if (sessionsRes.status === 'fulfilled') {
          const all = sessionsRes.value.data || [];
          setUpcomingSessions(all.filter(s => s.status === 'upcoming'));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const credits = profile?.credits ?? 0;
  const sessionsCount = upcomingSessions.length;
  const skillsCount = profile?.skillsOffered?.length ?? 0;
  const userName = profile?.name ?? 'User';
  const rating = profile?.rating ?? 0;

  const stats = [
    { title: 'Credits', value: credits, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'Upcoming Sessions', value: sessionsCount, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Skills Offered', value: skillsCount, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Rating', value: rating ? Number(rating).toFixed(1) : '—', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="w-full text-slate-100 flex flex-col gap-8 h-full fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
            Welcome back, {userName}!
          </h2>
          <p className="text-slate-400 mt-2">
            You have <span className="font-bold text-amber-400">{credits} credits</span> available.
          </p>
        </div>
        <Link
          to="/app/marketplace"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/30 transition-all w-fit"
        >
          <Users className="h-4 w-4" /> Browse Mentors <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/50 flex items-center gap-3 text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="glass p-5 rounded-xl hover:-translate-y-1 transition-transform duration-300 shadow-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0 pb-6">
        <div className="glass rounded-xl p-6 flex flex-col shadow-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-blue-400" /> Upcoming Sessions
            </h3>
            <Link to="/app/bookings" className="text-xs text-blue-400 hover:text-blue-300 font-medium">View all</Link>
          </div>
          <div className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl flex flex-col relative overflow-hidden bg-slate-800/20 p-4 min-h-[200px]">
            {sessionsCount > 0 ? (
              <ul className="w-full text-left space-y-3 z-10 overflow-y-auto custom-scrollbar">
                {upcomingSessions.slice(0, 4).map(session => (
                  <li key={session.id} className="flex flex-col gap-1 p-3 rounded-lg bg-slate-800/60 border border-white/5">
                    <p className="font-semibold text-slate-100 text-sm">
                      {session.role === 'Mentor' ? 'Student' : 'Mentor'}: {session.partnerName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{session.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.startTime} – {session.endTime}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-slate-400 font-medium">No upcoming sessions.</p>
                <p className="text-sm text-slate-500 mt-1">Book a session from the marketplace!</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-xl p-6 flex flex-col shadow-xl border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <BookOpen className="h-5 w-5 text-emerald-400" /> Skills You Offer
            </h3>
            <Link to="/app/profile" className="text-xs text-blue-400 hover:text-blue-300 font-medium">Edit</Link>
          </div>
          <div className="flex-1 border-2 border-dashed border-slate-700/50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden bg-slate-800/20 p-8 text-center min-h-[200px]">
            {skillsCount > 0 ? (
              <div className="w-full flex-wrap flex gap-2 z-10">
                {profile.skillsOffered.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-medium border border-emerald-500/20">
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <p className="text-slate-400 font-medium">No active skills listed.</p>
                <p className="text-sm text-slate-500 mt-1">Add skills to your profile to start earning credits.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
