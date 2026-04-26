import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle, Video, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const VideoCall = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/sessions/my');
        const found = (data || []).find(s => String(s.id) === String(id));
        if (!found) {
          setError('Session not found or you do not have access to it.');
        } else if (!found.meetingUrl) {
          setError('This session does not have a meeting link.');
        } else if (found.status !== 'upcoming') {
          setError(`This session is ${found.status}. You can only join upcoming sessions.`);
        } else {
          setSession(found);
        }
      } catch (err) {
        setError('Failed to load session.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(session.meetingUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Could not copy link');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center fade-in">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 fade-in">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/50 flex items-center gap-3 text-rose-400 max-w-md">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/app/bookings')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Bookings
        </button>
      </div>
    );
  }

  const displayName = encodeURIComponent(user?.name || 'Guest');
  const roomPath = session.meetingUrl.replace(/^https?:\/\/[^/]+\//, '');
  const iframeSrc = `https://meet.jit.si/${roomPath}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;

  return (
    <div className="h-full flex flex-col gap-4 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-400" /> Session with {session.partnerName}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {session.skillName} &bull; {session.date} &bull; {session.startTime} - {session.endTime}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button
            onClick={() => navigate('/app/bookings')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black min-h-[500px]">
        <iframe
          src={iframeSrc}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          allowFullScreen
          title="SkillSwap Video Call"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

export default VideoCall;
