import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/*********************************
 * Decorative background (unchanged)
 *********************************/
/* -------------------------------------------
 * Floating background bits (unchanged)
 * -----------------------------------------*/
function FloatingDots({ className = "", count = 26, dots = [] }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${className}`}>
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-slate-400/25"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            filter: "blur(0.4px)",
          }}
          animate={{ y: [-8, 8, -8], opacity: [0.18, 0.45, 0.18] }}
          transition={{ duration: d.duration, repeat: Infinity, delay: d.delay }}
        />
      ))}
    </div>
  );
}

function GradientBlobs({ colors, className = "" }) {
  return (
    <div aria-hidden className={`absolute inset-0 pointer-events-none -z-20 ${className}`}>
      <motion.div
        className="absolute w-56 h-56 rounded-full -top-16 -left-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(216,180,254,0.35), transparent)" }}
        animate={{ x: [-15, 8, -8], y: [0, 16, -12], rotate: [0, 18, -12] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute right-0 w-64 h-64 rounded-full top-1/2 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(148,163,184,0.25), transparent)" }}
        animate={{ x: [10, -10, 10], y: [-8, 8, -8], rotate: [0, -12, 10] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-0 rounded-full left-1/3 h-52 w-52 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(186,230,253,0.30), transparent)" }}
        animate={{ x: [0, 8, -8], y: [0, -10, 10] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <div
        className="absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,6,23,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(2,6,23,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px, 28px 28px",
        }}
      />
    </div>
  );
}

/* -------------------------------------------
 * Small helpers (unchanged)
 * -----------------------------------------*/
const Section = ({ children, className = '' }) => (
  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={className}>
    {children}
  </motion.div>
);

const TypingDots = () => (
  <div className="flex items-center gap-1">
    <span className="text-xs text-slate-300">typing</span>
    <span className="flex gap-0.5">
      <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
      <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
      <span className="inline-block w-1 h-1 rounded-full animate-bounce bg-slate-300" />
    </span>
  </div>
);

const DayDivider = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-slate-200/70" />
    <span className="rounded-full border border-slate-200/70 bg-white/80 px-2 py-0.5 text-xs text-slate-600 backdrop-blur">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-200/70" />
  </div>
);

/* -------------------------------------------
 * WhatsApp-style conversation header
 * -----------------------------------------*/
export function ConversationHeader({
  title,
  subtitle = 'online',
  onVoiceCall,
  onVideoCall,
  onBack,
  avatarLetter = 'U',
  callDisabled = false
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b bg-slate-900/70 backdrop-blur border-white/10 rounded-t-2xl">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-slate-300 rounded-xl hover:bg-white/10">
            ←
          </button>
        )}
        <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
          {String(avatarLetter).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight text-white">{title || 'Chat'}</div>
          <div className="text-xs text-slate-300">{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onVoiceCall}
          disabled={callDisabled}
          className={`inline-flex items-center gap-2 px-3 py-2 transition border rounded-xl text-slate-100 ${
            callDisabled
              ? 'bg-white/5 border-white/10 opacity-50 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/15 border-white/10'
          }`}
          title="Voice call"
        >
          <span>📞</span><span className="hidden sm:inline">Voice</span>
        </button>
        <button
          onClick={onVideoCall}
          disabled={callDisabled}
          className={`inline-flex items-center gap-2 px-3 py-2 text-white transition border shadow rounded-xl ${
            callDisabled
              ? 'bg-slate-500/40 border-white/10 opacity-50 cursor-not-allowed'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 border-white/10'
          }`}
          title="Video call"
        >
          <span>🎥</span><span className="hidden sm:inline">Video</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------
 * Incoming call modal (minor style tidy)
 * -----------------------------------------*/
const IncomingCallModal = ({ call, onAccept, onReject }) => (
  <AnimatePresence>
    {call && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="mx-4 w-full max-w-sm rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-[0_20px_50px_rgba(2,6,23,0.12)] backdrop-blur-xl"
        >
          <div className="mb-5">
            <div
              className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-white ${
                call?.type === "video"
                  ? "bg-gradient-to-br from-indigo-500 to-sky-500"
                  : "bg-gradient-to-br from-emerald-500 to-teal-500"
              }`}
            >
              {call?.type === "video" ? <span className="text-2xl">🎥</span> : <span className="text-2xl">📞</span>}
            </div>
            <h3 className="text-xl font-semibold text-slate-800">
              Incoming {call?.type === "video" ? "Video" : "Voice"} Call
            </h3>
            <p className="mt-1 text-slate-600">
              <span className="font-semibold">{call.fromUsername}</span> is calling you
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={onReject} className="px-6 py-3 font-medium text-white transition shadow-md rounded-2xl bg-rose-500 hover:bg-rose-600 hover:shadow-lg">
              Decline
            </button>
            <button onClick={onAccept} className="px-6 py-3 font-medium text-white transition shadow-md rounded-2xl bg-emerald-500 hover:bg-emerald-600 hover:shadow-lg">
              Accept
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* -------------------------------------------
 * Full-screen Call Screen (kept; adds top chips)
 * -----------------------------------------*/
function CallScreen({
  visible,
  type,                 // 'audio' | 'video'
  localStream,
  remoteStream,
  partnerName,
  callStatus,           // '', 'initiating', 'ringing', 'connecting', 'connected'
  muted,
  videoMuted,
  onToggleMute,
  onToggleVideo,
  onFlipCamera,
  onEnd,
  onAddVideoToCall
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [remoteVideoReady, setRemoteVideoReady] = useState(false);

  useEffect(() => {
    const el = localVideoRef.current;
    if (!el) return;
    el.srcObject = localStream || null;
    if (localStream) el.play().catch(() => {});
  }, [localStream]);

  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;

    setRemoteVideoReady(false);
    el.srcObject = remoteStream || null;

    if (!remoteStream) return;

    const markReady = () => {
      if (el.videoWidth > 0 && el.videoHeight > 0) setRemoteVideoReady(true);
    };
    const tryPlay = () => el.play().catch(() => setTimeout(() => el.play().catch(() => {}), 50));

    el.addEventListener("loadedmetadata", markReady);
    el.addEventListener("resize", markReady);
    tryPlay();

    return () => {
      el.removeEventListener("loadedmetadata", markReady);
      el.removeEventListener("resize", markReady);
    };
  }, [remoteStream]);

  if (!visible) return null;

  const isVideo = type === "video";
  const hasLocalVideo =
    !!localStream && localStream.getVideoTracks().length > 0 && !videoMuted;

  const statusLabel =
    callStatus === "connected"
      ? isVideo ? "On video call" : "On voice call"
      : callStatus === "connecting" ? "Connecting…"
      : callStatus === "ringing" ? "Ringing…"
      : callStatus === "initiating" ? "Calling…"
      : callStatus || "";

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-white" />
          <div
            className="absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(2,6,23,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(2,6,23,0.06) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        {/* Remote layer */}
        <div className="relative flex-1">
          <video ref={remoteVideoRef} autoPlay playsInline disablePictureInPicture controls={false} className="absolute inset-0 object-cover w-full h-full" />

          {/* Overlay placeholder until frames render */}
          {!remoteVideoReady && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-3xl border border-white/70 bg-white/70 p-8 text-center text-slate-700 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur-xl">
                <div className="flex items-center justify-center mx-auto mb-6 border border-indigo-200 rounded-full h-28 w-28 bg-indigo-50">
                  <span className="text-4xl">{isVideo ? "📹" : "🎧"}</span>
                </div>
                <div className="text-slate-700">{statusLabel}</div>
                <div className="mt-1 text-slate-500">{partnerName}</div>
              </div>
            </div>
          )}

          {/* Top chips */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 p-4 pointer-events-none">
            <div className="px-3 py-1 text-xs border rounded-full pointer-events-auto border-white/70 bg-white/70 text-slate-700 backdrop-blur">
              {partnerName}
            </div>
            <div className="px-3 py-1 text-xs border rounded-full pointer-events-auto border-white/70 bg-white/70 text-slate-700 backdrop-blur">
              {statusLabel}
            </div>
          </div>

          {/* Local PIP */}
          {hasLocalVideo && (
            <div className="absolute h-56 overflow-hidden border shadow-lg bottom-24 right-4 w-36 rounded-2xl border-white/70 bg-white/50 backdrop-blur-xl">
              <div className="relative w-full h-full">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  data-local="true" 
                  className="object-cover w-full h-full" 
                />
                
                {/* Local name always "You" */}
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1">
                  <div className="px-2 py-1 text-xs font-medium text-white rounded-md bg-slate-900/70 backdrop-blur-sm">
                    You
                  </div>
                </div>
                
                {/* Video muted overlay */}
                {videoMuted && (
                  <div className="absolute inset-0 grid text-white place-items-center rounded-2xl bg-slate-900/40">
                    <div className="text-center">
                      <span className="text-sm">📷 Off</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-white/70 bg-white/70 backdrop-blur-xl">
          <div className="flex items-center justify-center gap-3 mx-auto">
            <button onClick={onToggleMute} className={`rounded-full border px-4 py-3 text-sm transition ${
              muted ? "border-rose-300 bg-rose-100 text-rose-900 hover:bg-rose-200"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
              {muted ? "🔇 Unmute" : "🔊 Mute"}
            </button>

            {isVideo ? (
              <>
                <button onClick={onToggleVideo} className={`rounded-full border px-4 py-3 text-sm transition ${
                  videoMuted ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                             : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                  {videoMuted ? "📷 Camera On" : "📹 Camera Off"}
                </button>
                <button onClick={onFlipCamera} className="px-4 py-3 text-sm transition bg-white border rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                  🔄 Flip
                </button>
              </>
            ) : (
              <button onClick={onAddVideoToCall} className="px-4 py-3 text-sm font-medium text-white transition border border-indigo-300 rounded-full shadow-md bg-gradient-to-r from-indigo-500 to-sky-500 hover:brightness-110">
                📹 Enable Video
              </button>
            )}

            <button onClick={onEnd} className="px-4 py-3 text-sm font-medium text-white transition border rounded-full shadow-md border-rose-300 bg-rose-500 hover:bg-rose-600">
              📞 End
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
/*********************************
 * Main Chats Component
 *********************************/
function Chats({ socket }) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // holds CHAT ID
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pendingTimers = useRef([]);

  // WebRTC state
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { fromUserId, fromUsername, callId, type }
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callStatus, setCallStatus] = useState(''); // 'initiating' | 'ringing' | 'connecting' | 'connected'
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [muted, setMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const localStreamRef = useRef(null);
  const createdTracksRef = useRef(new Set());

  const audioTransceiverRef = useRef(null);
  const videoTransceiverRef = useRef(null);

  const pcRef = useRef(null);
  const iceCandidatesQueue = useRef([]); // Queue for ICE candidates

  // Perfect negotiation flags
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const polite = useRef(true); // treat this side as polite to reduce failures

  /** Load chats (once) */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => { if (!cancelled) setChats(res.data); })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load chats'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [user]);
  
  /** Attach socket listeners (once) */
  useEffect(() => {
    if (!socket || !user) return;

    if (!socket.connected) {
      socket.auth = { token: localStorage.getItem('token') };
      socket.connect();
    }
    socket.emit('join', `user:${user.id}`);

    // Chat events
    const handleNewMessage = (msg) => {
      if (msg.chat === selectedChat) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const handleTyping = () => {
      if (selectedChat) {
        setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        const t = setTimeout(() => setTyping(false), 2500);
        typingTimeoutRef.current = t;
        pendingTimers.current.push(t);
      }
    };
    const handleStopTyping = () => setTyping(false);

    // WebRTC events (perfect negotiation)
    const handleCallRequest = ({ fromUserId, fromUsername, callId, type }) => {
      // 🚫 reject self-call defensively
      if (String(fromUserId) === String(user.id)) {
        socket.emit('webrtc:call-rejected', { toUserId: fromUserId, callId, reason: 'self-call' });
        return;
      }
    
      // Already busy?
      if (callActive || callStatus || incomingCall || currentPartner) {
        socket.emit('webrtc:call-rejected', { toUserId: fromUserId, callId, reason: 'busy' });
        return;
      }
    
      setIncomingCall({ fromUserId, fromUsername, callId, type });
    
      // auto-reject after 30s
      const timeoutId = setTimeout(() => {
        setIncomingCall((current) => {
          if (current?.callId === callId) {
            socket.emit('webrtc:call-rejected', { toUserId: fromUserId, callId });
            setError('Call timed out');
            setTimeout(() => setError(''), 3000);
            return null;
          }
          return current;
        });
      }, 30000);
      pendingTimers.current.push(timeoutId);
    };
    
    const handleCallInitiated = () => setCallStatus('ringing');

    const handleCallAccepted = async ({ fromUserId, fromUsername, callId, type }) => {
      try {
        setCallStatus('connecting');
        setCurrentCallId(callId);
        setCurrentPartner({ id: fromUserId, name: fromUsername });
        setCallType(type || 'audio');
        await startWebRTC(true, fromUserId, type || 'audio');
      } catch (error) {
        console.error('Error in handleCallAccepted:', error);
        setError('Failed to start call');
        endCall();
      }
    };

    const handleCallRejected = ({ fromUsername }) => {
      cleanupCall();
      endCall();
      setError(`Call was rejected by ${fromUsername}`);
      const t = setTimeout(() => setError(''), 3000);
      pendingTimers.current.push(t);
    };

    const handleCallFailed = ({ reason }) => {
      cleanupCall();
      endCall();
      setError(`Call failed: ${reason}`);
      const t = setTimeout(() => setError(''), 3000);
      pendingTimers.current.push(t);
    };

    const handleWebRTCOffer = async ({ fromUserId, offer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      
      try {
        const offerCollision = makingOffer.current || pc.signalingState !== 'stable';
        ignoreOffer.current = !polite.current && offerCollision;
        if (ignoreOffer.current) return;
        if (offerCollision) await pc.setLocalDescription({ type: 'rollback' });
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { toUserId: fromUserId, answer });
        setCallStatus('connected');
        setCallActive(true);
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          try { await pc.addIceCandidate(candidate); } catch (e) { console.warn('Failed to add queued ICE candidate:', e); }
        }
      } catch (error) {
        console.error('Error handling offer:', error);
        setError('Failed to establish connection');
        endCall();
      }
    };

    const handleWebRTCAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(answer);
          setCallStatus('connected');
          setCallActive(true);
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            try { await pc.addIceCandidate(candidate); } catch (e) { console.warn('Failed to add ICE candidate:', e); }
          }
        }
      } catch (error) {
        console.error('Error handling answer:', error);
        endCall();
      }
    };

    const handleICECandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!candidate || !pc) return;
      try {
        if (!pc.remoteDescription) {
          if (iceCandidatesQueue.current.length > 50) iceCandidatesQueue.current.shift();
          iceCandidatesQueue.current.push(candidate);
        } else {
          await pc.addIceCandidate(candidate);
        }
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    };

    const handleCallEnded = () => {
      setError('Call ended by other party');
      const t = setTimeout(() => setError(''), 3000);
      pendingTimers.current.push(t);
      endCall();
    };
    
    socket.on('newMessage', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('webrtc:call-request', handleCallRequest);
    socket.on('webrtc:call-initiated', handleCallInitiated);
    socket.on('webrtc:call-accepted', handleCallAccepted);
    socket.on('webrtc:call-rejected', handleCallRejected);
    socket.on('webrtc:call-failed', handleCallFailed);
    socket.on('webrtc:offer', handleWebRTCOffer);
    socket.on('webrtc:answer', handleWebRTCAnswer);
    socket.on('webrtc:ice-candidate', handleICECandidate);
    socket.on('webrtc:call-ended', handleCallEnded);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('webrtc:call-request', handleCallRequest);
      socket.off('webrtc:call-initiated', handleCallInitiated);
      socket.off('webrtc:call-accepted', handleCallAccepted);
      socket.off('webrtc:call-rejected', handleCallRejected);
      socket.off('webrtc:call-failed', handleCallFailed);
      socket.off('webrtc:offer', handleWebRTCOffer);
      socket.off('webrtc:answer', handleWebRTCAnswer);
      socket.off('webrtc:ice-candidate', handleICECandidate);
      socket.off('webrtc:call-ended', handleCallEnded);
    };
  }, [socket, user, selectedChat]);

  /** Join/leave chat rooms when selection changes */
  useEffect(() => {
    if (!socket || !selectedChat) return;
    socket.emit('joinChat', selectedChat);
    return () => { socket.emit('leaveChat', selectedChat); };
  }, [socket, selectedChat]);

  /** Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  /** Unmount cleanup */
  useEffect(() => {
    return () => {
      if (pcRef.current) pcRef.current.close();
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      pendingTimers.current.forEach(clearTimeout);
      pendingTimers.current = [];
      clearTimeout(typingTimeoutRef.current);
    };
  }, []); // eslint-disable-line

  /** API helpers */
  const fetchMessages = async (chatId) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMessages(res.data);
      setSelectedChat(chatId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    setError('');
    try {
      socket?.emit('typing', { chatId: selectedChat });
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/messages/${selectedChat}`,
        { content: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
      socket?.emit('stopTyping', { chatId: selectedChat });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ---------- Robust "other participant" helpers ----------
  // ---------- Robust "other participant" helpers ----------
const otherParticipant = (chat, me) =>
chat?.participants?.find((p) => String(p._id) !== String(me?.id)) || null;

const otherUserName = (chat) => otherParticipant(chat, user)?.username || 'Unknown User';
const otherUserId   = (chat) => otherParticipant(chat, user)?._id || null;

  const filteredChats = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => otherUserName(c).toLowerCase().includes(q));
  }, [chats, filter]);

  const messagesWithDividers = useMemo(() => {
    const groups = [];
    let lastDay = '';
    messages.forEach((m) => {
      const d = new Date(m.createdAt || Date.now());
      const dayLabel = d.toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
      });
      if (dayLabel !== lastDay) {
        groups.push({ type: 'divider', id: `div-${d.getTime()}`, label: dayLabel });
        lastDay = dayLabel;
      }
      groups.push({ type: 'msg', data: m });
    });
    return groups;
  }, [messages]);

  const activeChat = useMemo(
    () => chats.find((c) => c._id === selectedChat) || null,
    [chats, selectedChat]
  );
  const activePartner = useMemo(
    () => otherParticipant(activeChat, user),
    [activeChat, user]
  );

  /*********************************
   * WebRTC helpers (perfect negotiation)
   *********************************/
  const cleanupCall = () => {
    setCallStatus('');
    setCallActive(false);
    setCurrentPartner(null);
    setCurrentCallId(null);
    setIncomingCall(null);
    setMuted(false);
    setVideoMuted(false);
    setCallType('audio');
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
    makingOffer.current = false;
    ignoreOffer.current = false;
    iceCandidatesQueue.current = [];
  };

  const startCall = (partnerId, partnerName, type = 'audio') => {
    if (!socket || !socket.connected) {
      setError('Connection not available. Please refresh.');
      return;
    }
    if (!partnerId) {
      setError('Cannot start call: partner not found');
      return;
    }
    // 🚫 guard: do not call yourself
    if (String(partnerId) === String(user?.id)) {
      setError("You can't call yourself");
      return;
    }
    if (callStatus || callActive || incomingCall || currentPartner) {
      setError('Another call is already in progress.');
      return;
    }
  
    // Clean slate before starting
    cleanupCall();
  
    setCurrentPartner({ id: partnerId, name: partnerName });
    setCallType(type);
    setCallStatus('initiating');
    socket.emit('webrtc:call-request', { toUserId: partnerId, type });
  };
  
  const acceptCall = async () => {
    if (!incomingCall) return;
    const { fromUserId, fromUsername, callId, type } = incomingCall;
  
    if (String(fromUserId) === String(user.id)) {
      socket.emit('webrtc:call-rejected', { toUserId: fromUserId, callId, reason: 'self-call' });
      setIncomingCall(null);
      return;
    }
  
    setCurrentPartner({ id: fromUserId, name: fromUsername });
    setCurrentCallId(callId);
    setIncomingCall(null);
    setCallStatus('connecting');
    setCallType(type || 'audio');
    socket.emit('webrtc:call-accepted', { toUserId: fromUserId, callId, type: type || 'audio' });
    await startWebRTC(false, fromUserId, type || 'audio');
  };
  
  const rejectCall = () => {
    if (!incomingCall) return;
    const { fromUserId, callId } = incomingCall;
    socket.emit('webrtc:call-rejected', { toUserId: fromUserId, callId });
    setIncomingCall(null);
  };

  const startWebRTC = async (initiator, partnerId, type = 'audio') => {
    console.log('🚀 STARTING WEBRTC:', { initiator, partnerId, type });
    try {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
      });
      pcRef.current = pc;

      const sortedIds = [user.id, partnerId].sort();
      polite.current = user.id === sortedIds[0];

      makingOffer.current = false;
      ignoreOffer.current = false;

      const constraints = {
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: type === 'video' ? { width: { ideal: 640, max: 1280 }, height: { ideal: 360, max: 720 }, frameRate: { ideal: 30 } } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(t => createdTracksRef.current.add(t));
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const remoteStreamLocal = new MediaStream();
      setRemoteStream(remoteStreamLocal);

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(new MediaStream(event.streams[0].getTracks()));
        } else {
          setRemoteStream(currentRemoteStream => {
            const newStream = new MediaStream();
            if (currentRemoteStream) {
              currentRemoteStream.getTracks().forEach(track => {
                if (track.kind !== event.track.kind) newStream.addTrack(track);
              });
            }
            newStream.addTrack(event.track);
            return newStream;
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          if (makingOffer.current || pc.signalingState !== 'stable') return;
          makingOffer.current = true;
          const offer = await pc.createOffer();
          if (pc.signalingState !== 'stable') return;
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:offer', { toUserId: partnerId, offer });
        } catch (err) {
          console.error('Negotiation error:', err);
        } finally {
          makingOffer.current = false;
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:ice-candidate', { toUserId: partnerId, candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === 'connected') {
          setCallStatus('connected');
          setCallActive(true);
        } else if (['failed', 'disconnected', 'closed'].includes(state)) {
          setError(`Call ${state}`);
          setTimeout(() => setError(''), 3000);
          endCall();
        }
      };

      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(iceState)) {
          endCall();
        }
      };
    } catch (error) {
      console.error('Error starting WebRTC:', error);
      let errorMessage = 'Failed to start call';
      if (error.name === 'NotAllowedError') errorMessage = 'Camera/microphone permission denied';
      else if (error.name === 'NotFoundError') errorMessage = 'No camera/microphone found';
      setError(errorMessage);
      endCall();
    }
  };

  const addVideoToCall = async () => {
    if (!pcRef.current || !localStream) return;
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 30 }, facingMode: 'user' },
        audio: false
      });
      const videoTrack = videoStream.getVideoTracks()[0];
      if (!videoTrack) throw new Error('No video track obtained');
      createdTracksRef.current.add(videoTrack);
      pcRef.current.addTrack(videoTrack, localStream);
      localStream.addTrack(videoTrack);
      setLocalStream(new MediaStream(localStream.getTracks()));
      setCallType('video');
      setVideoMuted(false);
    } catch (error) {
      console.error('Error adding video:', error);
      setError('Could not enable video');
      setTimeout(() => setError(''), 3000);
    }
  };

  const endCall = () => {
    if (socket && currentPartner?.id && (callActive || callStatus)) {
      socket.emit('webrtc:call-ended', { toUserId: currentPartner.id, callId: currentCallId });
    }
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      setLocalStream(null);
    }
    createdTracksRef.current.forEach(track => { try { track.stop(); } catch {} });
    createdTracksRef.current.clear();
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (!localStream) return;
    const newMuted = !muted;
    setMuted(newMuted);
    localStream.getAudioTracks().forEach((t) => { t.enabled = !newMuted; });
  };

  const toggleVideo = async () => {
    if (!localStream || !pcRef.current) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      const newVideoMuted = !videoMuted;
      setVideoMuted(newVideoMuted);
      videoTracks.forEach((track) => { track.enabled = !newVideoMuted; });
      setCallType(newVideoMuted ? 'audio' : 'video');
    } else {
      await addVideoToCall();
    }
  };

  const flipCamera = async () => {
    if (!localStream || !pcRef.current) return;
    const currentVideoTrack = localStream.getVideoTracks()[0];
    if (!currentVideoTrack) return;
    try {
      const currentSettings = currentVideoTrack.getSettings();
      const currentFacingMode = currentSettings.facingMode || 'user';
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: currentSettings.width || { ideal: 640 },
          height: currentSettings.height || { ideal: 360 },
          frameRate: currentSettings.frameRate || { ideal: 30 }
        },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) throw new Error('Failed to get new video track');
      createdTracksRef.current.add(newVideoTrack);
      const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (!videoSender) throw new Error('No video sender found');
      const old = videoSender.track;
      await videoSender.replaceTrack(newVideoTrack);
      if (old && old !== newVideoTrack) { try { old.stop(); } catch {} }
      try { currentVideoTrack.stop(); } catch {}
      try { localStream.removeTrack(currentVideoTrack); } catch {}
      localStream.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStream.getTracks()));
    } catch (e) {
      console.error('Error flipping camera:', e);
      let errorMessage = 'Could not flip camera';
      if (e.name === 'OverconstrainedError') errorMessage = 'Requested camera not available';
      else if (e.name === 'NotFoundError') errorMessage = 'No other camera found';
      setError(errorMessage);
      const t = setTimeout(() => setError(''), 3000);
      pendingTimers.current.push(t);
    }
  };

  const upgradeToVideo = async () => {
    if (callType === 'video') return;
    await addVideoToCall();
  };

  /*********************************
   * JSX
   *********************************/
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen text-slate-800"
      >
        {/* Background: soft white with subtle texture */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white via-slate-50 to-white" />
        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] mix-blend-multiply"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Pastel gradient blobs & floating dots */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <GradientBlobs
            colors={["#c7d2fe", "#d8b4fe", "#99f6e4", "#bae6fd"]}
            className="opacity-60 blur-3xl"
          />
          <FloatingDots className="opacity-40" />
          <motion.div
            aria-hidden
            className="absolute -top-12 -left-12 size-64 rounded-3xl bg-gradient-to-br from-white/60 to-slate-100/60 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)]"
            animate={{ y: [0, 12, 0], rotate: [0, 6, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-10 right-8 size-40 rounded-full bg-gradient-to-br from-sky-100/70 to-indigo-100/70 backdrop-blur-xl border border-white/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)]"
            animate={{ y: [0, -10, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Page container */}
        <div className="container h-screen px-4 pt-20 pb-6 mx-auto">
          {/* Header */}
          <Section className="flex items-center justify-between mb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 border rounded-full border-emerald-300/50 bg-emerald-200/40 backdrop-blur">
                <span className="relative inline-flex">
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-500" />
                  <span className="absolute -right-0.5 -top-0.5 size-2 animate-ping rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-semibold text-emerald-900">Live</span>
              </div>
              <h2 className="mt-2 text-3xl font-bold leading-tight text-transparent bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-700 bg-clip-text">
                Messages
              </h2>
              {user?.name && (
                <p className="mt-1 text-sm text-slate-600">
                  Welcome back, <span className="font-semibold">{user.name}</span>.
                </p>
              )}
            </div>

            {callStatus && (
              <div className="px-3 py-1 text-xs border rounded-full border-sky-300/60 bg-sky-100/70 text-sky-800 backdrop-blur">
                {callStatus === "initiating" && "Calling…"}
                {callStatus === "ringing" && "Ringing…"}
                {callStatus === "connecting" && "Connecting…"}
                {callStatus === "connected" && "Connected"}
              </div>
            )}
          </Section>

          {/* Error toast */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 border shadow-sm rounded-2xl border-rose-300/60 bg-rose-100/70 text-rose-900 backdrop-blur"
            >
              {error}
            </motion.div>
          )}

          {/* Main grid */}
          <div className="grid h-[calc(100vh-9.5rem)] grid-cols-1 gap-5 md:grid-cols-3">
            {/* Chat List */}
            <Section className="flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur-xl md:col-span-1">
              {/* Search */}
              <div className="p-3 border-b border-slate-200/70">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-3 py-2 transition border outline-none rounded-2xl border-slate-200/70 bg-white/80 pr-9 text-slate-800 placeholder-slate-400 ring-0 focus:border-indigo-300 focus:bg-white"
                  />
                  <span className="absolute -translate-y-1/2 pointer-events-none right-3 top-1/2 text-slate-400">⌘K</span>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 px-3 pb-3 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin border-slate-300 border-t-indigo-400" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="py-8 text-center text-slate-400">No chats found</div>
              ) : (
                filteredChats.map((chat) => {
                  const isActive = selectedChat === chat._id;
                  const partnerName = otherUserName(chat);

                  return (
                    <motion.div
                      key={chat._id}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.15 }}
                      className={[
                        "mb-2 w-full rounded-2xl border p-3 text-left shadow-sm transition-colors backdrop-blur",
                        isActive
                          ? "border-indigo-300/70 bg-indigo-50/80"
                          : "border-slate-200/70 bg-white/70 hover:bg-slate-50/80",
                      ].join(" ")}
                      onClick={() => fetchMessages(chat._id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                          {partnerName?.[0]?.toUpperCase()}
                        </div>
                        <button className="flex-1 font-medium text-left text-slate-800 line-clamp-1">
                          {partnerName}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </Section>

          {/* Chat Messages */}
          <Section className="flex flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur-xl md:col-span-2">
            {selectedChat ? (
              <>
                {/* Header uses partner derived from activeChat */}
                {(() => {
                  const partner = activePartner;
                  const callDisabled = !partner || String(partner._id) === String(user?.id);
                  return (
                    <ConversationHeader
                      title={partner?.username || "Chat"}
                      subtitle=""
                      avatarLetter={(partner?.username || "U")[0]}
                      callDisabled={callDisabled}
                      onVoiceCall={() => {
                        if (!callDisabled) startCall(partner._id, partner.username, "audio");
                      }}
                      onVideoCall={() => {
                        if (!callDisabled) startCall(partner._id, partner.username, "video");
                      }}
                    />
                  );
                })()}

                {/* Messages */}
                <div className="flex-1 px-4 py-3 overflow-y-auto">
                  {messagesWithDividers.map((item) =>
                    item.type === "divider" ? (
                      <DayDivider key={item.id} label={item.label} />
                    ) : (
                      <div
                        key={item.data._id}
                        className={`mb-2 ${item.data.sender === user.id ? "text-right" : "text-left"}`}
                      >
                        <span
                          className={[
                            "inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                            item.data.sender === user.id
                              ? "border border-indigo-200 bg-indigo-50 text-slate-800"
                              : "border border-slate-200 bg-white text-slate-800",
                          ].join(" ")}
                        >
                          {item.data.content}
                        </span>
                      </div>
                    )
                  )}
                  {typing && <TypingDots />}
                  <div ref={bottomRef} />
                </div>

                {/* Composer */}
                <div className="p-3 border-t border-slate-200/70">
                  <div className="flex items-end gap-2">
                    <textarea
                      className="flex-1 p-3 transition border outline-none resize-none rounded-2xl border-slate-200/70 bg-white/90 text-slate-800 placeholder-slate-400 focus:border-indigo-300 focus:bg-white"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message…"
                      rows={1}
                    />
                    <button
                      onClick={sendMessage}
                      className="rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-2 font-medium text-white shadow-md transition hover:shadow-lg hover:brightness-110 active:translate-y-[1px]"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Select a chat to start messaging
              </div>
            )}
          </Section>
        </div>
      </div>
    </motion.div>

    {/* Incoming call & Call screen */}
    <IncomingCallModal call={incomingCall} onAccept={acceptCall} onReject={rejectCall} />
    <CallScreen
      visible={callActive || ["initiating", "ringing", "connecting"].includes(callStatus)}
      type={callType}
      localStream={localStream}
      remoteStream={remoteStream}
      partnerName={currentPartner?.name || ""}
      callStatus={callStatus}
      muted={muted}
      videoMuted={videoMuted}
      onToggleMute={toggleMute}
      onToggleVideo={toggleVideo}
      onFlipCamera={flipCamera}
      onEnd={endCall}
      onAddVideoToCall={addVideoToCall}
    />
  </>
  );
}

export default Chats;
