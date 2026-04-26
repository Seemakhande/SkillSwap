import React, { useState, useEffect, useMemo } from 'react';
import { User, Mail, Star, Edit2, Loader2, AlertCircle, Save, X, BookOpen, PenTool, Zap, Award, GraduationCap, Calendar, Clock, Trash2, Plus, CheckCircle2, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import SkillPicker from '../components/SkillPicker';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="glass p-4 rounded-xl border border-white/10 flex items-center gap-3 shadow-lg">
    <div className={`p-2.5 rounded-xl ${bg}`}>
      <Icon className={`h-5 w-5 ${color}`} />
    </div>
    <div>
      <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [skillsCatalogue, setSkillsCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skillsOffered: [],
    skillsLearning: [],
    availabilitySlots: []
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, skillsRes] = await Promise.all([
          api.get('/user/profile'),
          api.get('/skills').catch(() => ({ data: [] }))
        ]);
        setProfile(profileRes.data);
        syncForm(profileRes.data);
        setSkillsCatalogue(skillsRes.data || []);

        if (profileRes.data?.id) {
          try {
            const reviewsRes = await api.get(`/reviews/${profileRes.data.id}`);
            setReviews(reviewsRes.data || []);
          } catch { /* ignore */ }
        }
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const syncForm = (data) => {
    setFormData({
      name: data.name || '',
      email: data.email || '',
      bio: data.bio || '',
      skillsOffered: Array.isArray(data.skillsOffered) ? [...data.skillsOffered] : [],
      skillsLearning: Array.isArray(data.skillsLearning) ? [...data.skillsLearning] : [],
      availabilitySlots: (data.availabilitySlots || []).map(slot => ({
        date: slot.date || '',
        startTime: slot.startTime || '',
        endTime: slot.endTime || ''
      }))
    });
  };

  const addSlot = () => {
    setFormData(prev => ({ ...prev, availabilitySlots: [...prev.availabilitySlots, { date: '', startTime: '', endTime: '' }] }));
  };
  const removeSlot = (i) => {
    setFormData(prev => ({ ...prev, availabilitySlots: prev.availabilitySlots.filter((_, idx) => idx !== i) }));
  };
  const updateSlot = (i, field, value) => {
    setFormData(prev => ({
      ...prev,
      availabilitySlots: prev.availabilitySlots.map((slot, idx) => idx === i ? { ...slot, [field]: value } : slot)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        availabilitySlots: formData.availabilitySlots.filter(s => s.date && s.startTime && s.endTime)
      };
      await api.put('/user/update', payload);
      setProfile({ ...profile, ...payload });
      setIsEditing(false);
      toast.success('Profile saved.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    syncForm(profile);
    setIsEditing(false);
    setError('');
  };

  const copyEmail = () => {
    if (!profile?.email) return;
    navigator.clipboard.writeText(profile.email);
    setEmailCopied(true);
    toast.success('Email copied!');
    setTimeout(() => setEmailCopied(false), 1800);
  };

  const completion = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 15;
    if (profile.email) score += 15;
    if (profile.bio && profile.bio.length > 10) score += 20;
    if (profile.skillsOffered?.length > 0) score += 20;
    if (profile.skillsLearning?.length > 0) score += 15;
    if (profile.availabilitySlots?.length > 0) score += 15;
    return score;
  }, [profile]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center fade-in">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const initial = (profile.name || 'U').charAt(0).toUpperCase();
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : '—';
  const stats = profile.stats || { sessionsTaught: 0, sessionsLearned: 0, totalEarned: 0, totalSpent: 0 };

  return (
    <div className="h-full flex flex-col gap-6 fade-in overflow-y-auto custom-scrollbar pb-10">

      {/* Banner */}
      <div className="relative mb-16 rounded-2xl border border-white/10 shadow-lg shrink-0">
        <div className="h-40 w-full rounded-t-2xl overflow-hidden bg-slate-800 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.3),transparent_45%)]"></div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md h-20 rounded-b-2xl relative"></div>

        <div className="absolute top-24 left-8 flex items-end gap-6 z-10 w-full pr-16 max-w-full">
          <div className="w-28 h-28 rounded-full border-4 border-[#0f172a] bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center text-4xl font-bold text-white shrink-0">
            {initial}
          </div>
          <div className="mb-3 flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold bg-slate-800/80 border border-slate-600 rounded px-2 py-1 mb-1 focus:outline-none focus:border-blue-500 text-white w-full sm:w-auto"
                />
              ) : (
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-100 to-white bg-clip-text text-transparent drop-shadow-md">
                  {profile.name}
                </h2>
              )}
              <div className="mt-1 flex items-center gap-2 text-blue-300 text-sm">
                <Mail className="h-4 w-4" />
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-800/80 border border-slate-600 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-blue-500 text-white w-full sm:w-auto"
                  />
                ) : (
                  <>
                    <span>{profile.email}</span>
                    <button
                      onClick={copyEmail}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Copy email"
                    >
                      {emailCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-400"><Calendar className="h-3 w-3" /> Member since {memberSince}</span>
                <span className="flex items-center gap-1 text-amber-300 font-semibold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {profile.rating ? Number(profile.rating).toFixed(1) : 'New'}
                </span>
              </div>
            </div>

            <div className="shrink-0 mb-1 lg:pr-8">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="glass px-5 py-2 hover:bg-white/10 transition-colors font-medium rounded-xl flex items-center gap-2 text-sm border-white/20 shadow-md"
                >
                  <Edit2 className="h-4 w-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleCancel} disabled={saving} className="px-4 py-2 bg-slate-700/80 hover:bg-slate-600 transition-colors font-medium rounded-xl flex items-center gap-2 text-sm text-slate-200">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 transition-colors font-medium rounded-xl flex items-center gap-2 text-sm text-white shadow-lg shadow-blue-500/30">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${isEditing ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' : 'bg-slate-500/10 border-slate-500/50 text-slate-400'}`}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <StatCard icon={GraduationCap} label="Sessions Taught" value={stats.sessionsTaught} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatCard icon={BookOpen} label="Sessions Learned" value={stats.sessionsLearned} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard icon={Zap} label="Credits Earned" value={stats.totalEarned} color="text-amber-400" bg="bg-amber-500/10" />
        <StatCard icon={Award} label="Credits Spent" value={stats.totalSpent} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Completion */}
      <div className="glass mx-2 p-5 rounded-xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-slate-200">Profile Completion</h4>
          </div>
          <span className="text-sm font-bold text-blue-300">{completion}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="mt-2 text-xs text-slate-500">Complete your profile — add a bio, skills, and availability to attract more learners.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 px-2">

        {/* Info + Skills column */}
        <div className="glass p-6 rounded-2xl space-y-8 border border-white/10 shadow-xl h-fit">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> About
            </h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows="4"
                className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-slate-200 resize-none custom-scrollbar"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{profile.bio || 'No bio provided yet.'}</p>
            )}
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-emerald-400" /> Skills I Can Teach
            </h3>
            {isEditing ? (
              <SkillPicker
                selected={formData.skillsOffered}
                onChange={(next) => setFormData(prev => ({ ...prev, skillsOffered: next }))}
                available={skillsCatalogue}
                accent="emerald"
                placeholder="Pick a skill to teach..."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skillsOffered?.length > 0 ? profile.skillsOffered.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/20 shadow-sm">
                    {skill}
                  </span>
                )) : <span className="text-sm text-slate-500 italic">No skills listed</span>}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-400" /> Skills I Want To Learn
            </h3>
            {isEditing ? (
              <SkillPicker
                selected={formData.skillsLearning}
                onChange={(next) => setFormData(prev => ({ ...prev, skillsLearning: next }))}
                available={skillsCatalogue}
                accent="blue"
                placeholder="Pick a skill to learn..."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.skillsLearning?.length > 0 ? profile.skillsLearning.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-300 rounded-full text-xs font-semibold border border-blue-500/20 shadow-sm">
                    {skill}
                  </span>
                )) : <span className="text-sm text-slate-500 italic">No skills listed</span>}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" /> Availability
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={addSlot}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add slot
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                {formData.availabilitySlots.length === 0 && (
                  <p className="text-xs text-slate-500 italic">No slots added yet.</p>
                )}
                {formData.availabilitySlots.map((slot, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateSlot(idx, 'date', e.target.value)}
                      className="bg-slate-800/80 border border-slate-600 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-200"
                    />
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                      className="bg-slate-800/80 border border-slate-600 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-200"
                    />
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                      className="bg-slate-800/80 border border-slate-600 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-500 text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
                      aria-label="Remove slot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {profile.availabilitySlots?.length > 0 ? (
                  profile.availabilitySlots.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-300">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      <span className="font-medium">{slot.date}</span>
                      <span className="text-slate-500">•</span>
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>{slot.startTime} – {slot.endTime}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 italic">No availability slots added.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews column */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-xl font-bold flex items-center gap-2">Ratings & Reviews</h3>
            <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              <span className="font-bold text-lg text-amber-50">
                {profile.rating ? Number(profile.rating).toFixed(1) : 'New'}
              </span>
              {reviews.length > 0 && (
                <span className="text-xs text-amber-200/80">({reviews.length})</span>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {reviews.length > 0 ? reviews.map((review, i) => (
              <div key={review.id || i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{review.author || 'Anonymous'}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{review.date || ''}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`h-3 w-3 ${idx < (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-700'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">"{review.comment || review.text}"</p>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/10 p-8">
                <Star className="h-8 w-8 text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium text-center">No reviews yet.</p>
                <p className="text-slate-500 text-sm text-center mt-1">Complete sessions to earn ratings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
