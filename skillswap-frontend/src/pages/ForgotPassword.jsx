import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { NavLink } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErr('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await axios.post(`${base}/api/auth/forgot-password`, { email });
      setMsg(res.data?.message || 'If this email exists, a reset link has been sent.');
    } catch (e) {
      setErr(e.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
      {/* Top nav (simple) */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b lg:p-6 bg-white/10 backdrop-blur-lg border-white/20"
      >
        <NavLink to="/" className="text-2xl font-bold text-white">SkillSwap</NavLink>
        <NavLink to="/login" className="px-4 py-2 text-white transition-all duration-300 border rounded-lg border-white/30 hover:bg-white/10">
          Back to Login
        </NavLink>
      </motion.nav>

      <div className="flex items-center justify-center min-h-screen px-4 pt-24">
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 border shadow-2xl bg-white/10 backdrop-blur-xl rounded-2xl border-white/20"
        >
          <h1 className="mb-2 text-3xl font-bold text-center text-white">Forgot password</h1>
          <p className="mb-8 text-center text-white/80">
            Enter your email. We’ll send you a reset link if an account exists.
          </p>

          {msg && (
            <div className="p-3 mb-4 text-sm border text-emerald-100 rounded-xl bg-emerald-500/20 border-emerald-400/30">
              {msg}
            </div>
          )}
          {err && (
            <div className="p-3 mb-4 text-sm text-red-100 border rounded-xl bg-red-500/20 border-red-400/30">
              {err}
            </div>
          )}

          <label className="block mb-2 text-sm font-medium text-white/90">Email</label>
          <input
            type="email"
            className="w-full p-4 mb-5 text-white transition-all duration-300 border rounded-lg outline-none bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder-white/60"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>

          <div className="mt-4 text-center">
            <NavLink to="/login" className="text-sm text-indigo-200 hover:text-white">
              Back to sign in
            </NavLink>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

export default ForgotPassword;
