import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { NavLink, useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = () =>
    password.length >= 6 &&
    confirm.length >= 6 &&
    password === confirm;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    if (!valid()) {
      setErr('Passwords must match and be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await axios.post(`${base}/api/auth/reset-password/${token}`, { password });
      setMsg(res.data?.message || 'Password updated! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setErr(e.response?.data?.message || 'Link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800">
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
          <h1 className="mb-2 text-3xl font-bold text-center text-white">Reset password</h1>
          <p className="mb-8 text-center text-white/80">
            Choose a new password for your account.
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

          {/* New password */}
          <label className="block mb-2 text-sm font-medium text-white/90">New password</label>
          <div className="relative mb-5">
            <input
              type={showPass ? 'text' : 'password'}
              className="w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none pr-11 bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder-white/60"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute -translate-y-1/2 text-white/80 hover:text-white right-3 top-1/2"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18M10.58 10.58A2 2 0 1113.42 13.4M9.88 9.88C8.77 10.36 8 11.58 8 13a5 5 0 007.12 4.47" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Confirm password */}
          <label className="block mb-2 text-sm font-medium text-white/90">Confirm password</label>
          <div className="relative mb-6">
            <input
              type={showConfirm ? 'text' : 'password'}
              className="w-full p-4 text-white transition-all duration-300 border rounded-lg outline-none pr-11 bg-white/10 backdrop-blur-sm border-white/20 focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 placeholder-white/60"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute -translate-y-1/2 text-white/80 hover:text-white right-3 top-1/2"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18M10.58 10.58A2 2 0 1113.42 13.4M9.88 9.88C8.77 10.36 8 11.58 8 13a5 5 0 007.12 4.47" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Hint */}
          <p className="mb-4 text-xs text-white/70">
            Use at least 6 characters. For stronger security, include numbers and symbols.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 font-semibold text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Reset password'}
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

export default ResetPassword;
