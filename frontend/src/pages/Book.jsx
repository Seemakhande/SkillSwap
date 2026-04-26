import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle, Zap, Loader2, Star, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Book = () => {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [timeslots, setTimeslots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, mentorRes, slotsRes] = await Promise.all([
          api.get('/user/profile'),
          api.get(`/user/${mentorId}`),
          api.get(`/timeslots/${mentorId}`)
        ]);
        setProfile(profileRes.data);
        setMentor(mentorRes.data);
        setTimeslots(slotsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load booking info.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mentorId]);

  const handleBookSession = async () => {
    if (!selectedSlot) return;
    const cost = mentor?.hourlyRate || 10;
    if ((profile?.credits ?? 0) < cost) {
      setError(`You need ${cost} credits to book this session.`);
      return;
    }

    setBookingLoading(true);
    setError('');
    try {
      await api.post('/sessions/book', { mentorId, timeslotId: selectedSlot.id });
      toast.success('Session booked successfully!');
      setShowModal(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to book session.';
      setError(msg);
      toast.error(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/app/bookings');
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center fade-in">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  const cost = mentor?.hourlyRate || 10;
  const mentorName = mentor?.name || 'Mentor';
  const mentorInitial = mentorName.charAt(0).toUpperCase();

  const groupedSlots = timeslots.reduce((acc, slot) => {
    const d = new Date(`${slot.date}T${slot.startTime}:00`);
    const dateString = isNaN(d) ? 'Available' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[dateString]) acc[dateString] = [];
    acc[dateString].push(slot);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col fade-in max-w-5xl mx-auto w-full p-2 relative">
      <div className="mb-6">
        <button onClick={() => navigate('/app/marketplace')} className="text-slate-400 hover:text-slate-200 text-sm font-medium mb-4 transition-colors">
          &larr; Back to Marketplace
        </button>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Book a Session</h2>
        <p className="text-slate-400 mt-2">Select a time to learn from your mentor.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/50 flex items-center gap-3 text-rose-400 mb-6">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass p-6 rounded-2xl shadow-xl border border-white/10 sticky top-4 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                {mentorInitial}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{mentorName}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm text-slate-300 font-medium">{mentor?.rating ? Number(mentor.rating).toFixed(1) : 'New'}</span>
                </div>
              </div>
            </div>

            {mentor?.bio && (
              <p className="text-sm text-slate-300 leading-relaxed">{mentor.bio}</p>
            )}

            {mentor?.skills?.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> Teaches
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.skills.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded-md text-xs font-medium border border-emerald-500/20">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Session Cost</span>
                <span className="font-bold flex items-center gap-1.5 text-amber-400">{cost} <Zap className="h-4 w-4" /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Your Balance</span>
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">{profile?.credits ?? 0} <Zap className="h-4 w-4" /></span>
              </div>
            </div>

            <button
              onClick={handleBookSession}
              disabled={!selectedSlot || bookingLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {bookingLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Booking'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/10 shadow-xl overflow-hidden flex flex-col">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" /> Available Times
          </h3>

          {timeslots.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700/50">
              <p className="text-slate-300 font-medium">No available slots</p>
              <p className="text-slate-500 text-sm mt-1">This mentor hasn't opened any upcoming slots yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              {Object.keys(groupedSlots).map((dateKey) => (
                <div key={dateKey}>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 border-b border-white/5 pb-2">{dateKey}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {groupedSlots[dateKey].map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => { setError(''); setSelectedSlot(slot); }}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border focus:outline-none transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                              : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-500 hover:bg-slate-700/50 text-slate-300'
                          }`}
                        >
                          <Clock className={`h-4 w-4 mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span className="font-semibold">{slot.startTime}</span>
                          <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">to {slot.endTime}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm fade-in">
          <div className="glass w-full max-w-sm p-8 rounded-2xl shadow-2xl relative border border-white/10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white">Booking Confirmed!</h3>
            <p className="text-slate-400 text-sm mb-6">Your session with {mentorName} is scheduled.</p>

            <div className="w-full bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Deducted</p>
              <p className="text-amber-400 font-bold flex items-center justify-center gap-1.5"><Zap className="h-4 w-4" /> -{cost} credits</p>
            </div>

            <button
              onClick={handleModalClose}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              View My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Book;
