// pages/Home.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import WelcomeClouds from "../components/WelcomeCloud";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);

  // Show if redirected with ?new=1 OR if no "welcomed" flag for this user
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFlag = params.get("new") === "1";
    const key = `welcomed:${user?.id || "anon"}`;
    const already = localStorage.getItem(key) === "1";

    if (newFlag || !already) {
      setShowWelcome(true);
      localStorage.setItem(key, "1");
      
      // optional: clean query param visually
      if (newFlag && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [user?.id]);

  return (
    <div className="relative min-h-screen">
      <WelcomeClouds
        username={user?.username || user?.name || user?.email?.split("@")[0] || "there"}
        show={showWelcome}
        onDone={() => setShowWelcome(false)}
      />

      {/* actual home content */}
      <main className={`transition-opacity duration-300 ${showWelcome ? "opacity-0" : "opacity-100"}`}>
        <div className="relative min-h-screen overflow-hidden bg-white">
          {/* Abstract Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Gradient Blobs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                x: [0, 100, 0],
                y: [0, -50, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              className="absolute rounded-full -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-indigo-200/40 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0],
                x: [0, -80, 0],
                y: [0, 100, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: -5 }}
              className="absolute right-0 rounded-full -top-20 w-80 h-80 bg-gradient-to-bl from-pink-200/30 to-purple-200/30 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, -180, -360],
                x: [0, 50, 0],
                y: [0, -80, 0],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: -10 }}
              className="absolute bottom-0 rounded-full left-1/4 w-72 h-72 bg-gradient-to-tr from-blue-200/35 to-cyan-200/35 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                rotate: [180, 360, 540],
                x: [0, -60, 0],
                y: [0, 60, 0],
              }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: -8 }}
              className="absolute w-64 h-64 rounded-full bottom-40 right-20 bg-gradient-to-tl from-teal-200/40 to-green-200/40 blur-3xl"
            />

            {/* Abstract Geometric Shapes */}
            <motion.div
              animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute w-32 h-32 transform rotate-45 border rounded-lg top-20 left-20 border-purple-300/20"
            />

            <motion.div
              animate={{ rotate: [360, 0], scale: [1, 0.9, 1], x: [0, 20, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-24 h-24 border-2 rounded-full top-40 right-40 border-indigo-300/25"
            />

            <motion.div
              animate={{ rotate: [0, -360], y: [0, -30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-20 h-20 transform bottom-60 left-40 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-xl rotate-12"
            />

            {/* Floating Dots Pattern */}
            <div className="absolute inset-0">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut",
                  }}
                  className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-purple-300 to-indigo-300 opacity-30"
                  style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                />
              ))}
            </div>

            {/* Grid Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, #6366f1 1px, transparent 1px),
                  linear-gradient(180deg, #6366f1 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
            <div className="max-w-6xl text-center">
              {/* Hero Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center px-6 py-3 mb-8 border rounded-full shadow-lg bg-white/60 backdrop-blur-xl border-purple-200/50"
              >
                <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-gray-700">
                  🚀 Welcome to the Future of Skill Sharing
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-6 text-5xl font-bold leading-tight text-gray-900 md:text-7xl lg:text-8xl"
              >
                <span className="block">Welcome</span>
                {user && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="block text-transparent bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text"
                  >
                    {user.username || user.name || user.email?.split("@")[0]}
                  </motion.span>
                )}
                <span className="block">to</span>
                <motion.span
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="block bg-gradient-to-r from-purple-600 via-pink-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_auto]"
                >
                  SkillSwap!
                </motion.span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="max-w-3xl mx-auto mb-12 text-xl leading-relaxed text-gray-600 md:text-2xl"
              >
                Connect, learn, and share skills with a global community.
                <span className="block mt-2 font-medium text-gray-700">
                  Discover new talents, teach others, and grow together in real-time.
                </span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col items-center justify-center gap-6 mb-16 sm:flex-row"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2, boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[200px]"
                  onClick={() => (window.location.href = "/search")}
                >
                  🔍 Find Skills
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white/60 backdrop-blur-xl border border-gray-300/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                  onClick={() => (window.location.href = "/profile")}
                >
                  ⭐ Share Your Skills
                </motion.button>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid max-w-5xl gap-8 mx-auto md:grid-cols-3"
              >
                {[
                  {
                    icon: "🤝",
                    title: "Real-time Collaboration",
                    description: "Connect instantly with skill partners worldwide",
                  },
                  {
                    icon: "🎯",
                    title: "Smart Matching",
                    description: "AI-powered skill matching for perfect partnerships",
                  },
                  {
                    icon: "📈",
                    title: "Track Progress",
                    description: "Monitor your learning journey and achievements",
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.1)" }}
                    className="p-8 transition-all duration-300 border shadow-lg bg-white/70 backdrop-blur-xl border-gray-200/50 rounded-3xl hover:shadow-2xl"
                  >
                    <div className="mb-4 text-4xl">{feature.icon}</div>
                    <h3 className="mb-3 text-xl font-bold text-gray-800">{feature.title}</h3>
                    <p className="leading-relaxed text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats Section */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="max-w-4xl p-8 mx-auto mt-16 border shadow-xl bg-gradient-to-r from-white/50 to-purple-50/50 backdrop-blur-xl border-purple-200/30 rounded-3xl"
                >
                  <h3 className="mb-6 text-2xl font-bold text-gray-800">Your SkillSwap Journey</h3>
                  <div className="grid gap-8 md:grid-cols-3">
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mb-2 text-3xl font-bold text-purple-600"
                      >
                        0
                      </motion.div>
                      <p className="text-gray-600">Skills Learned</p>
                    </div>
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        className="mb-2 text-3xl font-bold text-indigo-600"
                      >
                        0
                      </motion.div>
                      <p className="text-gray-600">Skills Shared</p>
                    </div>
                    <div className="text-center">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                        className="mb-2 text-3xl font-bold text-blue-600"
                      >
                        0
                      </motion.div>
                      <p className="text-gray-600">Connections Made</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Floating Action Elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="fixed z-20 flex items-center justify-center w-16 h-16 rounded-full shadow-lg cursor-pointer bottom-8 right-8 bg-gradient-to-r from-purple-500 to-indigo-500"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.div>
        </div>
      </main>

      {/* keyframes for gradient text (optional if used elsewhere) */}
      <style>{`@keyframes gradientText { to { background-position: 200% center; } }`}</style>
    </div>
  );
}
