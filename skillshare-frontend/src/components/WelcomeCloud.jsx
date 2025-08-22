// components/WelcomeClouds.jsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WelcomeClouds({
  username = "there",
  show,                // boolean
  onDone,              // callback when animation ends or skipped
  duration = 2800,
}) {
  const [visible, setVisible] = useState(show);
  const prefersReduced = useMemo(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
    []
  );

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, prefersReduced ? 800 : duration);
    return () => clearTimeout(t);
  }, [show, duration, prefersReduced, onDone]);

  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        top: 8 + i * 13 + Math.random() * 6,     // %
        scale: 0.8 + Math.random() * 0.8,
        delay: Math.random() * 1.2,
        duration: 14 + Math.random() * 8,
      })),
    []
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] overflow-hidden bg-gradient-to-b from-sky-200 via-sky-100 to-white"
          role="dialog"
          aria-label="Welcome"
        >
          {/* sun glow */}
          <motion.div
            className="absolute -translate-x-1/2 rounded-full -top-24 left-1/2 h-96 w-96"
            style={{ background: "radial-gradient(closest-side, rgba(255,200,0,0.55), transparent)" }}
            animate={prefersReduced ? {} : { scale: [1, 1.06, 1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          {/* drifting clouds (svg) */}
          {clouds.map((c, idx) => (
            <motion.div
              key={c.id}
              className="absolute -left-1/3 opacity-80"
              style={{ top: `${c.top}%`, scale: c.scale }}
              initial={{ x: "-20%", opacity: 0 }}
              animate={
                prefersReduced
                  ? { opacity: 1 }
                  : { x: ["-20%", "120%"], opacity: [0, 1, 1, 0] }
              }
              transition={{
                duration: c.duration,
                delay: c.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <CloudSvg variant={idx % 3} />
            </motion.div>
          ))}

          {/* welcome card */}
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
            className="absolute left-1/2 top-1/2 w-[min(90vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-xl backdrop-blur-xl"
          >
            <p className="text-sm text-slate-600">all set!</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-800">
              Welcome, <span className="text-transparent bg-gradient-to-r from-sky-600 to-teal-600 bg-clip-text">{username}</span> 🙂
            </h2>
            <p className="mt-2 text-slate-600">let’s find you a perfect skill match.</p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setVisible(false); onDone?.(); }}
                className="px-4 py-2 text-sm border shadow-sm rounded-xl border-slate-200 bg-white/70 text-slate-800 hover:shadow"
              >
                Skip
              </motion.button>
            </div>
          </motion.div>

          {/* subtle ground gradient */}
          <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-white to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CloudSvg({ variant = 0 }) {
  const shapes = [
    "M60 30c10-18 40-20 52-6 10 12 8 31-6 37-12 5-25-2-31-9-7 9-25 18-40 10C23 56 24 41 36 34c8-5 18-5 24-4Z",
    "M40 40c12-16 35-14 46 0 8 10 7 26-4 32-10 6-22 1-28-6-6 8-22 15-35 8C9 70 11 55 22 48c7-5 14-6 18-8Z",
    "M55 35c10-12 28-12 38-1 8 9 8 22-1 28-9 6-19 2-25-4-5 7-19 13-30 7-10-5-10-18-2-24 6-4 13-5 20-6Z",
  ];
  return (
    <svg width="240" height="120" viewBox="0 0 120 60" className="drop-shadow-sm">
      <g fill="white">
        <path d={shapes[variant]} />
        <ellipse cx="20" cy="40" rx="18" ry="10" />
        <ellipse cx="85" cy="35" rx="20" ry="12" />
      </g>
    </svg>
  );
}
