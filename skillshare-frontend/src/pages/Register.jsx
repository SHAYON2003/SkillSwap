// src/pages/Register.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ------------------ Decorative Background Helpers ------------------ */
function GradientBlobs() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-20">
      <motion.div
        className="absolute rounded-full w-72 h-72 -top-24 -left-16 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.18), transparent)" }}
        animate={{ x: [-12, 10, -8], y: [0, 14, -10], rotate: [0, 8, -6] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute rounded-full w-80 h-80 right-6 top-28 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.14), transparent)" }}
        animate={{ x: [6, -18, 8], y: [-10, 12, -6], rotate: [0, -8, 10] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-56 h-56 rounded-full left-1/3 bottom-8 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(20,184,166,0.12), transparent)" }}
        animate={{ x: [0, 8, -6], y: [2, -10, 8] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      />
      {/* faint grid overlay */}
      <div
        className="absolute inset-0 opacity-10 [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "26px 26px, 26px 26px",
        }}
      />
    </div>
  );
}

function FloatingDots({ count = 24 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 4,
      })),
    [count]
  );
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-black/6"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, filter: "blur(0.4px)" }}
          animate={{ y: [-8, 8, -8], opacity: [0.12, 0.45, 0.12] }}
          transition={{ duration: d.duration, repeat: Infinity, delay: d.delay }}
        />
      ))}
    </div>
  );
}

function GeometricShapes() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none -z-10">
      <motion.div
        className="absolute w-12 h-12 border rounded-xl right-16 top-40 border-black/6 bg-white/6"
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ repeat: Infinity, duration: 14 }}
      />
      <motion.div
        className="absolute w-10 h-10 border rounded-full left-10 bottom-32 border-black/6 bg-white/6"
        animate={{ y: [0, -6, 6, 0], scale: [1, 1.04, 0.96, 1] }}
        transition={{ repeat: Infinity, duration: 12 }}
      />
    </div>
  );
}

/* ------------------ Animated Counter ------------------ */
function Counter({ to = 0, className = "" }) {
  const mv = useMotionValue(0);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(mv, to, {
      duration: 0.8,
      onUpdate(v) {
        setValue(Math.round(v));
      },
    });
    return controls.stop;
  }, [to]);
  return <span className={className}>{value}</span>;
}

/* ------------------ Main Register Component ------------------ */
export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { register, user } = useAuth(); // user used for personalized greeting if already logged in
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      // ✅ mark fresh signup for WelcomeClouds
      localStorage.setItem("justSignedUp", "1");
      setSuccess("Registration successful 🎉 Redirecting to your Home...");
      setTimeout(() => navigate("/home?new=1"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-gray-900 bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50">
      <GradientBlobs />
      <FloatingDots />
      <GeometricShapes />

      <header className="relative z-20">
        <nav className="container flex items-center justify-between px-6 py-4 mx-auto">
          <NavLink to="/" className="inline-flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">S</div>
            <div className="text-lg font-bold">SkillSwap</div>
          </NavLink>

          <div className="items-center hidden gap-6 md:flex">
            <NavLink to="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">Home</NavLink>
            <NavLink to="/about" className="text-sm font-medium text-gray-700 hover:text-gray-900">About</NavLink>
            <NavLink to="/contact" className="text-sm font-medium text-gray-700 hover:text-gray-900">Contact</NavLink>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-white/70 backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">{`Welcome, ${user.name || user.email.split("@")[0]}`}</span>
              </div>
            ) : (
              <>
                <NavLink to="/login" className="px-3 py-1 text-sm rounded-md bg-white/80">Login</NavLink>
                <NavLink to="/register" className="px-3 py-1 text-sm text-white bg-indigo-600 rounded-md">Sign up</NavLink>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="container relative z-10 px-6 py-10 mx-auto">
        <section className="grid items-center gap-8 lg:grid-cols-2">
          {/* Left: Hero/Tagline */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-white/80 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold">Welcome 👋 — Join the swap</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-extrabold leading-tight md:text-5xl"
            >
              <span className="block text-gray-900">SkillSwap</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-teal-400 text-3xl md:text-4xl font-extrabold animate-[gradientShift_6s_linear_infinite]">
                swap skills — level up together
              </span>
            </motion.h1>

            <p className="max-w-xl text-gray-700">
              Create a profile, list what you can teach, and request what you want to learn. Quick sessions, real results — zero gatekeeping.
            </p>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-3 text-white shadow rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600"
                onClick={() => (window.location.href = "/search")}
              >
                Find Skills
              </motion.button>

              <motion.button
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-3 text-gray-800 border border-gray-200 rounded-2xl bg-white/80 backdrop-blur"
                onClick={() => (window.location.href = "/share")}
              >
                Share Skills
              </motion.button>
            </div>

            {/* Feature cards */}
            <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <motion.div whileHover={{ y: -6 }} className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur">
                <h4 className="font-semibold">Quick Matches</h4>
                <p className="mt-1 text-sm text-gray-700">Get paired with a complementary skill in minutes.</p>
              </motion.div>
              <motion.div whileHover={{ y: -6 }} className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-white/80 backdrop-blur">
                <h4 className="font-semibold">Transparent Ratings</h4>
                <p className="mt-1 text-sm text-gray-700">Real feedback keeps swaps trustworthy and helpful.</p>
              </motion.div>
            </div>
          </div>

          {/* Right: Register Form (glass) */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md p-8 mx-auto border border-gray-200 shadow-lg rounded-3xl bg-white/80 backdrop-blur-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-1 text-sm text-gray-700">Join thousands swapping skills right now.</p>
              </div>
              {/* small badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-800">Live</span>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 mt-4 border rounded-lg bg-rose-50 border-rose-100 text-rose-700">
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 mt-4 border rounded-lg bg-emerald-50 border-emerald-100 text-emerald-700">
                {success}
              </motion.div>
            )}

            <div className="mt-6 space-y-4">
              <label className="block text-sm text-gray-700">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none"
                disabled={loading}
              />

              <label className="block text-sm text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none"
                disabled={loading}
              />

              <label className="block text-sm text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none"
                disabled={loading}
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full px-4 py-3 mt-6 font-semibold text-white shadow rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {loading ? "Creating account..." : "Register"}
            </motion.button>

            <p className="mt-4 text-sm text-center text-gray-700">
              Already have an account?{" "}
              <NavLink to="/login" className="font-semibold text-indigo-600 hover:underline">
                Login
              </NavLink>
            </p>
          </motion.form>
        </section>
      </main>

      <footer className="relative z-10 py-8 text-center">
        <small className="text-sm text-gray-600">© {new Date().getFullYear()} SkillSwap — Built for creators & learners</small>
      </footer>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .animate-[gradientShift_6s_linear_infinite] {
          background-size: 200% 200%;
          animation: gradientShift 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
