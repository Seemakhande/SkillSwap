import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const featureCards = [
  {
    title: 'Instant mentorship',
    description: 'Book guided sessions with top mentors in just a few clicks.',
    icon: CalendarDays,
  },
  {
    title: 'Secure credit system',
    description: 'Earn and spend credits safely while you learn or teach.',
    icon: ShieldCheck,
  },
  {
    title: 'Community-driven growth',
    description: 'Join a trusted network of learners, teachers, and creators.',
    icon: Users,
  },
];

const stats = [
  { value: '250+', label: 'Trusted mentors' },
  { value: '500+', label: 'Hands-on sessions' },
  { value: '4.9', label: 'Average rating' },
  { value: '100%', label: 'Secure feedback' },
];

const Welcome = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
        <p className="mt-4 text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.14),_transparent_22%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(15,23,42,1)_100%)] pointer-events-none" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 shadow-xl shadow-sky-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">SkillSwap</p>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Learn • Teach • Earn</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <Link to="/" className="welcome__nav-item">Home</Link>
            <Link to="/login" className="welcome__nav-item">Mentors</Link>
            <Link to="/signup" className="welcome__nav-item">Teach</Link>
            <Link to="/" className="welcome__nav-item">Resources</Link>
            <Link to="/" className="welcome__nav-item">Community</Link>
          </nav>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <Link
              to="/login"
              className="hidden rounded-full border border-slate-700 bg-slate-900/80 px-5 py-2 text-sm text-slate-100 transition hover:bg-slate-800 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-xl shadow-sky-500/20 transition duration-300 hover:-translate-y-0.5"
            >
              Sign up
            </Link>
          </div>
        </header>

        <main className="grid gap-12 overflow-hidden py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-sky-500/20 bg-slate-900/70 px-4 py-2 text-sm text-sky-300 shadow-sm shadow-sky-500/10 welcome__hero-badge">
              <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs uppercase tracking-[0.4em] text-sky-200">New</span>
              Fully redesigned onboarding and session booking experience.
            </div>

            <div className="space-y-6 max-w-2xl">
              <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl welcome__headline">
                Learn skills. Teach passion. Earn together.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300 sm:text-xl welcome__copy">
                SkillSwap connects curious learners with expert mentors in real time. Book sessions, chat instantly, and grow your skills with a beautiful, secure experience.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center welcome__cta">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-2xl shadow-sky-500/25 transition duration-300 hover:-translate-y-1"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/85 px-8 py-4 text-base font-semibold text-slate-100 transition duration-300 hover:bg-slate-800"
              >
                Explore mentors
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              {stats.map((item, idx) => (
                <div key={idx} className="welcome__stats-card rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-center shadow-lg shadow-slate-950/20 backdrop-blur-sm">
                  <p className="text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl animate-float" />
            <div className="absolute -bottom-6 left-8 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl animate-float delay-2000" />
            <div className="absolute -top-12 left-10 h-24 w-24 rounded-full bg-slate-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/90 p-8 shadow-2xl shadow-slate-950/40 ring-1 ring-white/10 welcome__spotlight-card">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/15 to-transparent" />
              <div className="relative space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Mentor Spotlight</p>
                    <h2 className="text-3xl font-semibold text-white">Aisha, UI/UX Expert</h2>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                    <Users className="h-4 w-4 text-sky-400" /> 4.9
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { icon: Sparkles, label: 'Design mentorship' },
                    { icon: MessageCircle, label: 'Instant chat access' },
                    { icon: Zap, label: 'Credit-based booking' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 rounded-3xl bg-slate-950/80 p-4 border border-white/10 text-slate-200 transition hover:bg-slate-900/95">
                      <item.icon className="h-5 w-5 text-sky-400" />
                      <p className="text-sm text-slate-300">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-300">
                    <p className="text-3xl font-semibold text-white">20+</p>
                    <p className="mt-2 text-sm text-slate-400">Expert mentors ready</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-300">
                    <p className="text-3xl font-semibold text-white">150+</p>
                    <p className="mt-2 text-sm text-slate-400">Active sessions this week</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <section className="grid gap-8 lg:grid-cols-3 lg:gap-6 py-10">
          {featureCards.map((item, index) => (
            <div key={index} className="welcome__feature-card glass rounded-[28px] border border-white/10 p-6 shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1 hover:shadow-sky-500/20">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/80 text-sky-300 shadow-lg shadow-sky-500/10">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-slate-300 leading-7">{item.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
                Learn more <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Welcome;
