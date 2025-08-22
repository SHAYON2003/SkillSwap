import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/* ---------- helpers for avatars ---------- */
const getAvatarUrl = (avatar, API) => {
  if (!avatar) return '';
  const raw = (
    typeof avatar === 'string'
      ? avatar
      : (avatar.url || avatar.path || avatar.avatarUrl || avatar.photo || '')
  )
    .toString()
    .trim();
  if (!raw) return '';
 
  if (/^https?:\/\//i.test(raw)) return `${raw}${raw.includes('?') ? '&' : '?'}v=${Date.now()}`;
  const base = (API || 'http://localhost:4000').replace(/\/$/, '');
  const slashPrefixed = raw.startsWith('/') ? raw : `/${raw}`;
  const absolute = `${base}${slashPrefixed}`;
  return `${absolute}${absolute.includes('?') ? '&' : '?'}v=${Date.now()}`;
};

function Avatar({ user, size = 36, className = '', API }) {
  const url = getAvatarUrl(user?.avatar || user?.avatarUrl || user?.photo, API);
  const letter = (user?.username || user?.name || 'U').charAt(0).toUpperCase();
  return (
    <div
      className={`relative overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ${className}`}
      style={{ width: size, height: size }}
      title={user?.username || user?.name || 'User'}
    >
      {url ? (
        <img src={url} alt="avatar" className="object-cover w-full h-full" />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-sm font-semibold text-white">
          {letter}
        </div>
      )}
    </div>
  );
}

function useCounter(target = 0, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function FloatingDots({ count = 28 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
      })),
    [count]
  );
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-white/20"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, filter: 'blur(0.3px)' }}
          animate={{ y: [-10, 10, -10], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: d.duration, repeat: Infinity, delay: d.delay }}
        />
      ))}
    </div>
  );
}

function GradientBlobs() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
      <motion.div
        className="absolute rounded-full -top-24 -left-24 h-72 w-72 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(168,85,247,0.35), transparent)' }}
        animate={{ x: [-20, 10, -10], y: [0, 20, -20], rotate: [0, 20, -10] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute rounded-full top-1/3 -right-16 h-80 w-80 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.35), transparent)' }}
        animate={{ x: [10, -10, 10], y: [-10, 10, -10], rotate: [0, -15, 10] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-0 rounded-full left-1/4 h-72 w-72 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(34,197,94,0.30), transparent)' }}
        animate={{ x: [0, 10, -10], y: [0, -15, 10], rotate: [0, 10, -10] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute border rounded-lg top-24 left-1/3 size-16 border-white/20 backdrop-blur-sm bg-white/10"
        animate={{ rotate: [0, 15, -10, 0], y: [0, -6, 6, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
      />
      <motion.div
        className="absolute border rounded-full bottom-24 right-1/3 size-12 border-white/20 backdrop-blur-sm bg-white/10"
        animate={{ scale: [1, 1.1, 1], x: [0, 6, -6, 0] }}
        transition={{ duration: 12, repeat: Infinity }}
      />

      <div
        className="absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px, 32px 32px',
          backgroundPosition: '0 0, 0 0',
        }}
      />
    </div>
  );
}

function ScrollTopFab() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
          transition={{ duration: 0.3 }}
          className="fixed z-50 p-3 rounded-full shadow-lg bottom-6 right-6 bg-white/80 backdrop-blur-md border border-white/40 hover:shadow-xl hover:-translate-y-0.5 transition-transform"
        >
          ⬆️
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function Requests() {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [publicOpen, setPublicOpen] = useState([]);
  const [users, setUsers] = useState([]);

  const [newRequest, setNewRequest] = useState({
    to: '',
    skillOffered: '',
    skillRequested: '',
    type: 'offer', // 'offer' | 'learn' | 'direct'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [success, setSuccess] = useState('');

  const API = process.env.REACT_APP_API_URL;

  // central refetch
  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const [incomingRes, outgoingRes, usersRes, publicRes] = await Promise.all([
      axios.get(`${API}/api/requests/incoming`, { headers }),
      axios.get(`${API}/api/requests/outgoing`, { headers }),
      axios.get(`${API}/users`, { headers }),
      axios.get(`${API}/api/requests/public`, { headers }),
    ]);
    setIncoming(incomingRes.data.requests || incomingRes.data);
    setOutgoing(outgoingRes.data.requests || outgoingRes.data);
    setUsers(usersRes.data);
    setPublicOpen(publicRes.data.requests || publicRes.data);
  };

  // Fetch data on mount
  useEffect(() => {
    setLoading(true);
    fetchAll()
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load requests');
        console.error('Load requests error:', err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id, action) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.patch(
        `${API}/api/requests/${id}`,
        { action },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (res.data.request?.status !== 'pending') {
        setIncoming((prev) => prev.filter((r) => r._id !== id));
        setOutgoing((prev) => prev.filter((r) => r._id !== id));
      }
      setError(`Request ${action}ed successfully`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request');
      console.error('Update request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimPublic = async (id) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/requests/${id}/claim`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setPublicOpen((prev) => prev.filter((p) => p._id !== id));
      if (res.data?.request) setIncoming((prev) => [res.data.request, ...prev]);
      setError('Claimed successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim post');
      console.error('Claim post error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (id) => {
    setError('');
    setLoading(true);
    try {
      await axios.patch(
        `${API}/api/requests/${id}/complete`,
        { },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSuccess('Marked as completed ✅');
      await fetchAll(); // refresh lists so Progress can reflect next time
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError(e.response?.data?.message || 'Error marking complete');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (e) => {
    e.preventDefault();
    setError('');

    const offered = newRequest.skillOffered.trim();
    const requested = newRequest.skillRequested.trim();

    if (newRequest.type === 'offer' && !offered) {
      setError('Please enter the skill you want to offer.');
      return;
    }
    if (newRequest.type === 'learn' && !requested) {
      setError('Please enter the skill you want to learn.');
      return;
    }
    if (newRequest.type === 'direct') {
      const hasSomeSkill = offered || requested;
      if (!newRequest.to || !hasSomeSkill) {
        setError('Select a user and specify at least one skill.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        type: newRequest.type,
        ...(newRequest.type === 'direct' && newRequest.to ? { to: newRequest.to } : {}),
        ...(offered ? { skillOffered: { name: offered } } : {}),
        ...(requested ? { skillRequested: { name: requested } } : {}),
      };

      await axios.post(`${API}/api/requests/create`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      await fetchAll();

      setNewRequest({ to: '', skillOffered: '', skillRequested: '', type: 'offer' });
      setSuccess('Request posted successfully ✅');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
      console.error('Create request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      totalUsers: users?.length || 0,
      incomingPending: incoming.filter((r) => r.status === 'pending').length,
      accepted: [...incoming, ...outgoing].filter((r) => r.status === 'accepted').length,
      openPublic: publicOpen.length,
    }),
    [users, incoming, outgoing, publicOpen]
  );

  const totalUsers = useCounter(stats.totalUsers, 900);
  const pending = useCounter(stats.incomingPending, 1100);
  const accepted = useCounter(stats.accepted, 1300);
  const openPublic = useCounter(stats.openPublic, 1000);

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const Badge = ({ children, color = 'sky' }) => (
    <span
      className={`ml-2 rounded-full bg-${color}-50 border border-${color}-200 px-2 py-0.5 text-xs text-${color}-700`}
    >
      {children}
    </span>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-slate-100 text-slate-900">
      <GradientBlobs />
      <FloatingDots />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container max-w-6xl px-4 pt-24 pb-16 mx-auto"
      >
        {/* Welcome */}
        <div className="flex items-center gap-3 mb-6">
          <span className="relative inline-flex items-center gap-2 px-3 py-1 text-sm font-medium border rounded-full border-emerald-400/50 bg-emerald-50/60 text-emerald-700 backdrop-blur-md">
            <span className="relative inline-block size-2.5 rounded-full bg-emerald-500">
              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400"></span>
            </span>
            👋 Welcome
          </span>
          {user?.username && (
            <span className="text-sm text-slate-600">
              Hi, <span className="font-semibold">{user.username}</span> — let’s trade some skills.
            </span>
          )}
        </div>

        <header className="mb-10">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            <span className="bg-gradient-to-r from-fuchsia-600 via-sky-600 to-teal-600 bg-clip-text text-transparent [background-size:200%_auto] [animation:gradientText_6s_linear_infinite]">
              Skill Requests
            </span>
            <br />
            <span className="text-slate-700">Find • Share • Grow</span>
          </h1>
          <p className="max-w-2xl mt-3 text-slate-600">
            Barter your strengths, borrow someone’s superpower. Clean UI, clean vibes, no chaos.
          </p>

        {/* Quick CTA */}
          <div className="flex flex-wrap gap-3 mt-6">
            <motion.button
              whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(59,130,246,0.35)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-2xl text-white bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg border border-white/20"
            >
              🔎 Find Skills
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => document.getElementById('create-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-2xl border border-slate-200/70 bg-white/50 text-slate-800 backdrop-blur-md hover:shadow-md"
            >
              🤝 Share Your Skill
            </motion.button>
          </div>
        </header>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`mb-6 rounded-2xl px-3 py-2 text-sm shadow-sm backdrop-blur-md border ${
                error.includes('success')
                  ? 'text-emerald-700 bg-emerald-50/70 border-emerald-200/70'
                  : 'text-rose-700 bg-rose-50/70 border-rose-200/70'
              }`}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {success && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2 px-3 py-2 mb-6 text-sm font-medium border shadow-sm rounded-2xl backdrop-blur-md text-emerald-700 bg-emerald-50/70 border-emerald-200/70"
            >
              ✅ {success}
            </motion.p>
          )}
        </AnimatePresence>

        {loading && <p className="mb-6 animate-pulse text-sky-600">Loading…</p>}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-4">
          {[
            { label: 'Total Users', value: totalUsers },
            { label: 'Incoming Pending', value: pending },
            { label: 'Total Accepted', value: accepted },
            { label: 'Open Public', value: openPublic },
          ].map((s) => (
            <motion.div
              key={s.label}
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="p-4 transition-shadow border shadow-sm rounded-3xl border-white/30 bg-white/50 backdrop-blur-xl hover:shadow-md"
            >
              <p className="text-sm text-slate-600">{s.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Create Request */}
        <motion.section
          id="create-form"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="p-6 mb-12 border shadow-xl rounded-3xl border-white/30 bg-white/60 backdrop-blur-2xl"
        >
          <h3 className="mb-2 text-2xl font-semibold text-slate-900">Create New Request</h3>

          {/* Post Type switch */}
          <div className="inline-flex items-center gap-2 p-1 mb-4 border rounded-2xl border-slate-200 bg-white/60">
            {[
              { key: 'offer', label: 'Offer a skill' },
              { key: 'learn', label: 'Want to learn' },
              { key: 'direct', label: 'Direct swap' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setNewRequest((r) => ({ ...r, type: opt.key }))}
                className={`px-3 py-1.5 rounded-xl text-sm transition ${
                  newRequest.type === opt.key ? 'bg-sky-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={createRequest} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* "To" only for direct */}
            {newRequest.type === 'direct' && (
              <select
                value={newRequest.to}
                onChange={(e) => setNewRequest({ ...newRequest, to: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-white/70 p-2.5 text-slate-900 backdrop-blur placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                disabled={loading}
              >
                <option value="">Select User</option>
                {users.filter((u) => u._id !== user?.id).map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                  </option>
                ))}
              </select>
            )}

            <input
              type="text"
              value={newRequest.skillOffered}
              onChange={(e) => setNewRequest({ ...newRequest, skillOffered: e.target.value })}
              placeholder={
                newRequest.type === 'learn' ? 'Optional: Skill you can offer' : 'Skill Offered (e.g., React)'
              }
              className={`w-full rounded-2xl border border-slate-200 bg-white/70 p-2.5 text-slate-900 backdrop-blur placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                newRequest.type === 'offer' ? 'ring-1 ring-sky-200' : ''
              }`}
              disabled={loading}
            />
            <input
              type="text"
              value={newRequest.skillRequested}
              onChange={(e) => setNewRequest({ ...newRequest, skillRequested: e.target.value })}
              placeholder={
                newRequest.type === 'offer' ? 'Optional: Skill you want to learn' : 'Skill Requested (e.g., Node.js)'
              }
              className={`w-full rounded-2xl border border-slate-200 bg-white/70 p-2.5 text-slate-900 backdrop-blur placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                newRequest.type === 'learn' ? 'ring-1 ring-sky-200' : ''
              }`}
              disabled={loading}
            />

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 font-medium text-white shadow-lg disabled:opacity-60"
              >
                {newRequest.type === 'direct' ? 'Send Request' : 'Post'}
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setNewRequest({ to: '', skillOffered: '', skillRequested: '', type: 'offer' })}
                className="rounded-2xl border border-slate-200 bg-white/50 px-5 py-2.5 text-slate-800 backdrop-blur hover:shadow"
              >
                Reset
              </motion.button>
            </div>

            <p className="text-xs md:col-span-2 text-slate-500">
              Tip: Choose <span className="font-medium">Offer a skill</span> or <span className="font-medium">Want to
              learn</span> to post publicly. Pick <span className="font-medium">Direct swap</span> to target a user.
            </p>
          </form>
        </motion.section>

        {/* Feature highlights */}
        <section className="grid grid-cols-1 gap-4 mb-12 md:grid-cols-3">
          {[
            { title: 'Smart Matching', desc: 'We surface users with complementary skills to speed up your swap.' },
            { title: 'Zero Awkwardness', desc: 'Clear status + tidy threads. No ghosting energy here.' },
            { title: 'Built for Momentum', desc: 'Light animations, fast flows, and just enough dopamine.' },
          ].map((f) => (
            <motion.div
              key={f.title}
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="p-5 transition-shadow border shadow-sm rounded-3xl border-white/30 bg-white/60 backdrop-blur-2xl hover:shadow-md"
            >
              <h4 className="text-lg font-semibold text-slate-900">{f.title}</h4>
              <p className="mt-1 text-slate-600">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Public Board */}
        <section>
          <h3 className="mb-3 text-2xl font-semibold text-slate-900">
            Public Board
            <span className="ml-2 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs text-sky-700">
              Open
            </span>
          </h3>
          <div className="space-y-3">
            {publicOpen.length === 0 && !loading && <p className="text-slate-500">No open posts</p>}
            {publicOpen.map((req) => (
              <motion.div
                key={req._id}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="p-4 border shadow-md rounded-3xl border-white/30 bg-white/70 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={req.from} API={API} size={36} className="ring-2 ring-white/70" />
                    <div className="text-slate-900">
                      <p className="font-semibold">
                        By: {req.from?.username || 'Unknown'}
                        <span className="ml-2 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-xs text-violet-700">
                          {req.type === 'offer' ? 'Offering' : 'Wants to learn'}
                        </span>
                      </p>
                      <p><strong>Offer:</strong> {req.skillOffered?.name || '—'}</p>
                      <p><strong>Request:</strong> {req.skillRequested?.name || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => claimPublic(req._id)}
                      className="px-4 py-2 text-white bg-indigo-600 shadow rounded-xl hover:bg-indigo-700"
                      disabled={loading}
                    >
                      Claim
                    </motion.button>
                    <span className="ml-2 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs text-sky-700">
                      Public
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Requests lists */}
        <div className="grid grid-cols-1 gap-8 mt-10 lg:grid-cols-2">
          {/* Incoming */}
          <section>
            <h3 className="mb-3 text-2xl font-semibold text-slate-900">Incoming Requests</h3>
            <div className="space-y-3">
              {incoming.length === 0 && !loading && <p className="text-slate-500">No incoming requests</p>}
              {incoming.map((req) => (
                <motion.div
                  key={req._id}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="p-4 border shadow-md rounded-3xl border-white/30 bg-white/70 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={req.from} API={API} size={36} className="ring-2 ring-white/70" />
                      <div className="text-slate-900">
                        <p className="font-semibold">
                          From: {req.from?.username || 'Unknown'}
                          {!req.to && <Badge>Public</Badge>}
                        </p>
                        <p><strong>Offer:</strong> {req.skillOffered?.name || 'None'}</p>
                        <p><strong>Request:</strong> {req.skillRequested?.name || 'None'}</p>
                      </div>
                    </div>

                    {req.status === 'pending' ? (
                      <div className="flex gap-2 mt-1">
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus(req._id, 'accept')}
                          className="px-4 py-2 text-white shadow rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          disabled={loading}
                        >
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateStatus(req._id, 'reject')}
                          className="px-4 py-2 text-white shadow rounded-xl bg-rose-600 hover:bg-rose-700"
                          disabled={loading}
                        >
                          Reject
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end gap-2 mt-1">
                        <p
                          className={`font-semibold ${
                            req.status === 'accepted'
                              ? 'text-emerald-600'
                              : req.status === 'rejected'
                              ? 'text-rose-600'
                              : req.status === 'completed'
                              ? 'text-sky-700'
                              : 'text-slate-500'
                          }`}
                        >
                          <strong>Status:</strong> {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                        </p>

                        {/* Mark Completed button when accepted */}
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => markAsCompleted(req._id)}
                            className="px-3 py-1 text-sm text-white bg-green-600 rounded-xl hover:bg-green-700"
                            disabled={loading}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Outgoing */}
          <section>
            <h3 className="mb-3 text-2xl font-semibold text-slate-900">Outgoing Requests</h3>
            <div className="space-y-3">
              {outgoing.length === 0 && !loading && <p className="text-slate-500">No outgoing requests</p>}
              {outgoing.map((req) => (
                <motion.div
                  key={req._id}
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="p-4 border shadow-md rounded-3xl border-white/30 bg-white/70 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {req.to ? (
                        <Avatar user={req.to} API={API} size={36} className="ring-2 ring-white/70" />
                      ) : (
                        <div className="w-9" />
                      )}
                      <div className="text-slate-900">
                        <p className="font-semibold">
                          <strong>{req.to ? 'To' : 'Post'}:</strong> {req.to?.username || 'Public'}
                          {req.visibility === 'public' && <Badge>Public</Badge>}
                          {req.status === 'open' && <Badge color="emerald">Open</Badge>}
                        </p>
                        <p><strong>Offer:</strong> {req.skillOffered?.name || 'None'}</p>
                        <p><strong>Request:</strong> {req.skillRequested?.name || 'None'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p
                            className={`font-semibold ${
                              req.status === 'accepted'
                                ? 'text-emerald-600'
                                : req.status === 'rejected'
                                ? 'text-rose-600'
                                : req.status === 'completed'
                                ? 'text-sky-700'
                                : req.status === 'pending'
                                ? 'text-amber-600'
                                : req.status === 'open'
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            <strong>Status:</strong> {req.status?.charAt(0).toUpperCase() + req.status?.slice(1)}
                          </p>

                          {/* Mark Completed button when accepted */}
                          {req.status === 'accepted' && (
                            <button
                              onClick={() => markAsCompleted(req._id)}
                              className="px-3 py-1 text-sm text-white bg-green-600 rounded-xl hover:bg-green-700"
                              disabled={loading}
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>

      <ScrollTopFab />

      <style>{`@keyframes gradientText { to { background-position: 200% center; } }`}</style>
    </div>
  );
}
