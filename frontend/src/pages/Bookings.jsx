import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star, X, Loader2, AlertCircle, CheckCircle, XCircle, Ban, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ReviewModal = ({ session, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async () => {
    if (rating === 0) { setError('Please select a rating.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', {
        sessionId: session.id,
        mentorId: session.mentorId,
        rating,
        comment
      });
      toast.success('Review submitted successfully!');
      onSuccess(session.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div className="glass w-full max-w-md p-6 rounded-2xl shadow-2xl relative border border-white/10 flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold mb-1 text-white">Leave a Review</h3>
        <p className="text-sm text-slate-400 mb-6">How was your session with {session.partnerName}?</p>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/50 flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(rating)}
            >
              <Star className={`h-10 w-10 transition-colors ${star <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-700/50'}`} />
            </button>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-300">Written Review (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200 resize-none"
            placeholder="Share details of your experience..."
          />
        </div>

        <button
          onClick={submitReview}
          disabled={loading || rating === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};

const Bookings = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewModalSession, setReviewModalSession] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sessions/my');
      setSessions(data || []);
    } catch (err) {
      setError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleReviewSuccess = (sessionId) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, hasReviewed: true, status: 'completed' } : s));
    setReviewModalSession(null);
  };

  const handleCancel = async (sessionId) => {
    if (!confirm('Cancel this session? Your credits will be refunded.')) return;
    setCancellingId(sessionId);
    try {
      await api.post(`/sessions/${sessionId}/cancel`);
      toast.success('Session cancelled. Credits refunded.');
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'cancelled' } : s));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel session.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center fade-in">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const upcoming = sessions.filter(s => s.status === 'upcoming');
  const past = sessions.filter(s => s.status === 'completed');
  const cancelled = sessions.filter(s => s.status === 'cancelled');

  return (
    <div className="h-full flex flex-col gap-6 fade-in p-2 max-w-6xl mx-auto w-full overflow-y-auto custom-scrollbar pb-10">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Your Bookings</h2>
        <p className="text-slate-400 mt-2">Manage your schedules and review completed sessions.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/50 flex items-center gap-3 text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl mt-4">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Calendar className="h-5 w-5 text-blue-400" /> Upcoming Sessions
        </h3>

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700/50">
            <p className="text-slate-300 font-medium">No active bookings</p>
            <p className="text-slate-500 text-sm mt-1">Check out the marketplace to schedule your next session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(session => (
              <div key={session.id} className="p-5 rounded-xl border border-white/5 bg-slate-800/50 hover:bg-slate-800/80 transition-colors flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110 blur-xl"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-1">{session.role}</p>
                    <h4 className="font-bold text-lg text-slate-100">{session.role === 'Mentor' ? 'Student' : 'Mentor'}: {session.partnerName}</h4>
                    {session.skillName && <p className="text-xs text-slate-400 mt-1">Skill: {session.skillName}</p>}
                  </div>
                </div>
                <div className="space-y-2 relative z-10 flex-1">
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-slate-500" /> {session.date}
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <Clock className="h-4 w-4 text-slate-500" /> {session.startTime} - {session.endTime}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 relative z-10 flex-wrap">
                  {session.meetingUrl && (
                    <Link
                      to={`/app/session/${session.id}/call`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 transition-colors text-xs font-semibold"
                    >
                      <Video className="h-3.5 w-3.5" /> Join Video Call
                    </Link>
                  )}
                  <button
                    onClick={() => handleCancel(session.id)}
                    disabled={cancellingId === session.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                  >
                    {cancellingId === session.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl opacity-90 mt-2">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <CheckCircle className="h-5 w-5 text-emerald-400" /> Past Sessions
        </h3>

        {past.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="text-slate-400 font-medium text-sm">No past sessions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {past.map(session => (
              <div key={session.id} className="p-5 rounded-xl border border-slate-700/50 bg-slate-900/60 flex flex-col relative justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Completed</p>
                      <h4 className="font-bold text-slate-300">Session with {session.partnerName}</h4>
                      {session.skillName && <p className="text-xs text-slate-500 mt-1">Skill: {session.skillName}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mb-4">{session.date} &bull; {session.startTime} - {session.endTime}</p>
                </div>

                <div>
                  {session.role === 'Mentor' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold">
                      Taught Session
                    </div>
                  ) : session.hasReviewed ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                      <CheckCircle className="h-3.5 w-3.5" /> Reviewed
                    </div>
                  ) : (
                    <button
                      onClick={() => setReviewModalSession(session)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/[0.15] hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-colors text-sm font-bold w-fit shadow-md"
                    >
                      <Star className="h-4 w-4" /> Leave Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelled.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/10 shadow-xl opacity-70 mt-2">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-300">
            <XCircle className="h-5 w-5 text-rose-400" /> Cancelled
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cancelled.map(session => (
              <div key={session.id} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
                <p className="text-xs uppercase tracking-wider text-rose-400 font-bold mb-1">Cancelled</p>
                <h4 className="font-bold text-slate-300 text-sm">{session.partnerName}</h4>
                <p className="text-xs text-slate-500 mt-1">{session.date} • {session.startTime}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewModalSession && (
        <ReviewModal session={reviewModalSession} onClose={() => setReviewModalSession(null)} onSuccess={handleReviewSuccess} />
      )}
    </div>
  );
};

export default Bookings;
