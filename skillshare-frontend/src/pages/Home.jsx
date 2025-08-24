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
      <main className={`transition-opacity duration-500 ${showWelcome ? "opacity-0" : "opacity-100"}`}>
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          {/* Advanced Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Neural Network Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.line
                  key={i}
                  x1={`${Math.random() * 100}%`}
                  y1={`${Math.random() * 100}%`}
                  x2={`${Math.random() * 100}%`}
                  y2={`${Math.random() * 100}%`}
                  stroke="url(#line-gradient)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 1, 0], 
                    opacity: [0, 0.3, 0] 
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </svg>

            {/* Morphing Gradient Blobs */}
            <motion.div
              animate={{
                scale: [1, 1.3, 0.8, 1.2, 1],
                rotate: [0, 120, 240, 360],
                x: [0, 150, -100, 50, 0],
                y: [0, -80, 120, -50, 0],
                borderRadius: ["30%", "60%", "40%", "80%", "30%"]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-48 -left-48 w-96 h-96 bg-gradient-to-br from-violet-400/20 via-purple-300/25 to-indigo-400/20 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1.1, 0.9, 1.4, 1],
                rotate: [360, 240, 120, 0],
                x: [0, -120, 80, 0],
                y: [0, 150, -80, 0],
                borderRadius: ["40%", "70%", "50%", "90%", "40%"]
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: -8 }}
              className="absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-bl from-cyan-400/25 via-blue-300/30 to-indigo-400/25 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1, 1.5, 0.7, 1.2, 1],
                rotate: [0, -180, -360, -180, 0],
                x: [0, 80, -120, 40, 0],
                y: [0, -100, 80, -60, 0],
                borderRadius: ["50%", "30%", "70%", "45%", "50%"]
              }}
              transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: -15 }}
              className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-tr from-emerald-400/20 via-teal-300/25 to-cyan-400/20 blur-3xl"
            />

            <motion.div
              animate={{
                scale: [1.2, 1, 1.6, 0.8, 1.2],
                rotate: [180, 540, 180, 360, 180],
                x: [0, -100, 60, -40, 0],
                y: [0, 80, -120, 100, 0],
                borderRadius: ["60%", "40%", "80%", "35%", "60%"]
              }}
              transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: -20 }}
              className="absolute w-64 h-64 bottom-32 right-16 bg-gradient-to-tl from-pink-400/25 via-rose-300/30 to-purple-400/25 blur-3xl"
            />

            {/* Advanced Geometric Patterns */}
            <div className="absolute inset-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    rotate: [0, 360], 
                    scale: [1, 1.2, 0.8, 1],
                    x: [0, 30, -20, 0],
                    y: [0, -25, 15, 0]
                  }}
                  transition={{ 
                    duration: 20 + i * 3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: -i * 2
                  }}
                  className="absolute border-2 rounded-2xl border-purple-300/20"
                  style={{
                    width: `${60 + i * 20}px`,
                    height: `${60 + i * 20}px`,
                    top: `${20 + i * 15}%`,
                    left: `${10 + i * 12}%`,
                    transform: `rotate(${i * 45}deg)`
                  }}
                />
              ))}
            </div>

            {/* Particle System */}
            <div className="absolute inset-0">
              {Array.from({ length: 80 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -40, 0], 
                    x: [0, 20, -10, 0],
                    opacity: [0.2, 0.8, 0.3, 0.6, 0.2],
                    scale: [0.5, 1.2, 0.8, 1, 0.5]
                  }}
                  transition={{
                    duration: 6 + Math.random() * 4,
                    repeat: Infinity,
                    delay: Math.random() * 4,
                    ease: "easeInOut",
                  }}
                  className="absolute rounded-full"
                  style={{ 
                    left: `${Math.random() * 100}%`, 
                    top: `${Math.random() * 100}%`,
                    width: `${4 + Math.random() * 8}px`,
                    height: `${4 + Math.random() * 8}px`,
                    background: `linear-gradient(${Math.random() * 360}deg, 
                      hsl(${250 + Math.random() * 60}, 70%, 65%), 
                      hsl(${200 + Math.random() * 80}, 80%, 70%))`
                  }}
                />
              ))}
            </div>

            {/* Advanced Grid with Glow */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 25px 25px, #6366f1 2px, transparent 2px),
                  linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                  linear-gradient(180deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px, 50px 50px, 50px 50px",
              }}
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-20">
            <div className="text-center max-w-7xl">
              {/* Enhanced Hero Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="inline-flex items-center px-8 py-4 mb-12 border rounded-full shadow-2xl bg-white/80 backdrop-blur-2xl border-white/40"
                style={{
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
                }}
              >
                <motion.span 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 mr-3 rounded-full shadow-lg bg-gradient-to-r from-green-400 to-emerald-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  🚀 Welcome to the Future of Skill Sharing
                </span>
              </motion.div>

              {/* Enhanced Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, type: "spring", bounce: 0.3 }}
                className="mb-8 text-6xl font-black leading-tight text-gray-900 md:text-8xl lg:text-9xl"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                <motion.span 
                  className="block"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  Welcome
                </motion.span>
                {user && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    className="block text-transparent bg-gradient-to-r from-violet-600 via-purple-600 via-indigo-600 to-blue-600 bg-clip-text username-glow"
                    style={{
                      backgroundSize: "300% 100%",
                      animation: "gradientShift 3s ease-in-out infinite"
                    }}
                  >
                    {user.username || user.name || user.email?.split("@")[0]}
                  </motion.span>
                )}
                <motion.span 
                  className="block"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  to
                </motion.span>
                <motion.span
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.05 }}
                  className="block text-transparent bg-gradient-to-r from-purple-600 via-pink-500 via-indigo-600 via-cyan-500 to-purple-600 bg-clip-text skillswap-glow"
                  style={{ backgroundSize: "400% 100%" }}
                >
                  SkillSwap!
                </motion.span>
              </motion.h1>

              {/* Enhanced Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="max-w-4xl mx-auto mb-16"
              >
                <p className="mb-4 text-2xl font-light leading-relaxed text-gray-700 md:text-3xl">
                  Connect, learn, and share skills with a global community.
                </p>
                <motion.p
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-lg font-medium text-gray-600 md:text-xl"
                >
                  Discover new talents, teach others, and grow together in real-time.
                </motion.p>
              </motion.div>

              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="flex flex-col items-center justify-center gap-8 mb-20 sm:flex-row"
              >
                <motion.button
                  whileHover={{ 
                    scale: 1.08, 
                    y: -8,
                    boxShadow: "0 25px 50px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-10 py-5 text-xl font-bold text-white rounded-3xl overflow-hidden min-w-[240px] border border-white/20"
                  onClick={() => (window.location.href = "/search")}
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4)",
                    backgroundSize: "200% 200%"
                  }}
                >
                  <motion.div
                    animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0"
                  />
                  <span className="relative z-10 flex items-center gap-3">
                    🔍 Find Skills
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ 
                    scale: 1.08, 
                    y: -8,
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-10 py-5 text-xl font-bold text-gray-800 bg-white/70 backdrop-blur-2xl border-2 border-gray-200/60 rounded-3xl shadow-2xl min-w-[240px] overflow-hidden"
                  onClick={() => (window.location.href = "/profile")}
                >
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/50 to-transparent"
                  />
                  <span className="relative z-10 flex items-center gap-3">
                    ⭐ Share Your Skills
                    <motion.span
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✨
                    </motion.span>
                  </span>
                </motion.button>
              </motion.div>

              {/* Enhanced Feature Cards */}
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.9 }}
                className="grid gap-12 mx-auto max-w-7xl md:grid-cols-2"
              >
                {[
                  {
                    icon: "🤝",
                    title: "Real-time Collaboration",
                    description: "Connect instantly with skill partners worldwide through seamless video calls and interactive sessions",
                    gradient: "from-violet-500/10 to-purple-500/10",
                    borderGradient: "from-violet-300/30 to-purple-300/30"
                  },
                  {
                    icon: "📈",
                    title: "Track Progress",
                    description: "Monitor your learning journey with detailed analytics, achievements, and personalized growth insights",
                    gradient: "from-blue-500/10 to-cyan-500/10",
                    borderGradient: "from-blue-300/30 to-cyan-300/30"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: 1.1 + index * 0.2,
                      type: "spring",
                      bounce: 0.3
                    }}
                    whileHover={{ 
                      y: -15, 
                      scale: 1.03,
                      boxShadow: "0 35px 70px rgba(0, 0, 0, 0.15)",
                      borderColor: "rgba(139, 92, 246, 0.3)"
                    }}
                    className={`group relative p-10 transition-all duration-500 border-2 shadow-2xl bg-gradient-to-br ${feature.gradient} backdrop-blur-2xl border-gray-200/40 rounded-4xl hover:shadow-purple-500/20 overflow-hidden`}
                  >
                    {/* Card Background Effect */}
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0, 0.1, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, delay: index }}
                      className={`absolute inset-0 bg-gradient-to-br ${feature.borderGradient} rounded-4xl`}
                    />
                    
                    <div className="relative z-10">
                      <motion.div 
                        className="mb-6 text-5xl"
                        whileHover={{ 
                          scale: 1.2, 
                          rotate: [0, -10, 10, 0],
                          textShadow: "0 0 20px rgba(139, 92, 246, 0.3)"
                        }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 className="mb-4 text-2xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-purple-700">
                        {feature.title}
                      </h3>
                      <p className="text-lg leading-relaxed text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Enhanced Floating Action Button */}
          <motion.div
            animate={{ 
              rotate: 360,
              boxShadow: [
                "0 0 20px rgba(139, 92, 246, 0.3)",
                "0 0 40px rgba(59, 130, 246, 0.4)",
                "0 0 20px rgba(139, 92, 246, 0.3)"
              ]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="fixed z-30 flex items-center justify-center w-20 h-20 border-2 rounded-full cursor-pointer bottom-8 right-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 backdrop-blur-xl border-white/30"
            whileHover={{ 
              scale: 1.15, 
              boxShadow: "0 0 60px rgba(139, 92, 246, 0.6)",
              background: "linear-gradient(45deg, #8b5cf6, #3b82f6, #06b6d4)"
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <motion.svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </motion.svg>
          </motion.div>
        </div>
      </main>

      {/* Enhanced Keyframes */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
          50% { text-shadow: 0 0 40px rgba(59, 130, 246, 0.5); }
        }
        
        .username-glow {
          animation: textGlow 3s ease-in-out infinite;
        }
        
        .username-glow:hover {
          text-shadow: 0 0 30px rgba(139, 92, 246, 0.6) !important;
        }
        
        .skillswap-glow {
          animation: textGlow 4s ease-in-out infinite;
        }
        
        .skillswap-glow:hover {
          text-shadow: 0 0 50px rgba(139, 92, 246, 0.7) !important;
        }
        
        .rounded-4xl {
          border-radius: 2rem;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #3b82f6);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #2563eb);
        }
      `}</style>
    </div>
  );
}