import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle, Phone, Video, MoreVertical, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';

const roomFor = (a, b) => [parseInt(a, 10), parseInt(b, 10)].sort((x, y) => x - y).join('_');

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [myId, setMyId] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const messagesEndRef = useRef(null);
  const activeContactRef = useRef(null);

  useEffect(() => { activeContactRef.current = activeContact; }, [activeContact]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    (async () => {
      try {
        const [meRes, contactsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/chat/contacts')
        ]);
        setMyId(meRes.data.id.toString());
        setContacts(contactsRes.data || []);
        if (contactsRes.data && contactsRes.data.length > 0) {
          setActiveContact(contactsRes.data[0]);
        }
      } catch (err) {
        setError('Failed to load contacts.');
      } finally {
        setLoadingContacts(false);
      }
    })();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const backendURL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const newSocket = io(backendURL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('receive_message', (message) => {
      const current = activeContactRef.current;
      if (!current) return;
      const pairMatch =
        (message.senderId?.toString() === current.id && message.receiverId?.toString() === myId) ||
        (message.receiverId?.toString() === current.id && message.senderId?.toString() === myId);
      if (!pairMatch) return;

      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, {
          id: message.id,
          text: message.text,
          sender: message.senderId?.toString() === myId ? 'me' : 'them',
          timestamp: message.timestamp
        }];
      });
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('receive_message');
      newSocket.disconnect();
    };
  }, [myId]);

  useEffect(() => {
    if (!activeContact || !myId) return;

    (async () => {
      setLoadingHistory(true);
      setError('');
      try {
        const { data } = await api.get('/chat/history', { params: { contactId: activeContact.id } });
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load chat history.');
        setMessages([]);
      } finally {
        setLoadingHistory(false);
      }
    })();

    if (socket && isConnected) {
      const roomId = roomFor(myId, activeContact.id);
      socket.emit('join_room', roomId);
    }
  }, [activeContact, socket, isConnected, myId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !myId || !activeContact || !socket || !isConnected) return;

    socket.emit('send_message', {
      receiverId: activeContact.id,
      text
    });

    setInputMessage('');
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex gap-6 fade-in overflow-hidden -m-2 p-2">
      {/* Contacts */}
      <div className="hidden lg:flex w-1/3 max-w-sm glass rounded-2xl flex-col border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 bg-slate-800/40 backdrop-blur-md">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent mb-1">Messages</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`}></div>
            <span className="text-xs text-slate-400">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loadingContacts ? (
            <div className="flex justify-center p-4 mt-10"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
          ) : contacts.length === 0 ? (
            <div className="text-center p-4 mt-10 text-slate-500 text-sm">No contacts yet. Book a session!</div>
          ) : contacts.map((contact) => {
            const active = activeContact && activeContact.id === contact.id;
            return (
              <div
                key={contact.id}
                onClick={() => setActiveContact(contact)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex gap-4 items-center mb-1 group ${active ? 'bg-blue-500/20 border border-blue-500/30 shadow-md' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white border-2 border-[#0f172a] shadow-inner">
                    {contact.avatar}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#0f172a] rounded-full bg-emerald-400"></div>
                </div>
                <div className="overflow-hidden flex-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={`font-semibold truncate ${active ? 'text-white' : 'text-slate-200'}`}>{contact.name}</h4>
                    <span className="text-[10px] text-slate-500 shrink-0">{contact.time}</span>
                  </div>
                  <p className={`text-xs truncate ${active ? 'text-blue-200' : 'text-slate-400'}`}>{contact.lastMessage}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 glass rounded-2xl flex flex-col border border-white/10 overflow-hidden shadow-xl relative bg-slate-900/60 backdrop-blur-2xl">
        {!activeContact ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <MessageSquare className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-lg font-medium text-slate-300">Select a Contact</p>
            <p className="text-sm text-slate-500">Book a session to unlock real-time messaging.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                  {activeContact.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100 leading-tight">{activeContact.name}</h4>
                  <p className={`text-[11px] font-medium ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>{isConnected ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Phone className="h-4 w-4" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Video className="h-4 w-4" /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><MoreVertical className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-5">
              {loadingHistory ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center text-rose-400 flex-col gap-2">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-2">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                    <MessageSquare className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <div key={msg.id || index} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'} group`}>
                      <div className={`px-5 py-3 rounded-2xl shadow-md ${isMe ? 'bg-blue-600 rounded-tr-sm text-slate-50 border border-blue-500/50' : 'bg-slate-800 rounded-tl-sm text-slate-200 border border-slate-700/50'}`}>
                        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium mt-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.timestamp)}</span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-md">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
                  disabled={!isConnected}
                  className="w-full bg-slate-800/70 border border-slate-700/70 rounded-full py-3.5 pl-5 pr-14 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all text-slate-200 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || !isConnected}
                  className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
