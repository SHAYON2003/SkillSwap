// src/pages/About.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen pt-20 text-gray-900 bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50">
      <div className="container p-6 mx-auto">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold">About SkillSwap</h1>
          <p className="max-w-xl mt-2 text-gray-700">
            SkillSwap helps you trade what you know for what you want to learn. We connect learners and creators, simplify scheduling, and keep interactions friendly and productive.
          </p>
        </motion.header>

        <section className="grid gap-6 mt-8 md:grid-cols-3">
          <motion.div className="p-6 border shadow-sm rounded-2xl bg-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 className="font-semibold">What we do</h3>
            <p className="mt-2 text-sm text-gray-700">Match complementary skills, run short sessions, and build a profile that highlights real value.</p>
          </motion.div>

          <motion.div className="p-6 border shadow-sm rounded-2xl bg-white/80" initial={{ opacity: 0, delay: 0.05 }} animate={{ opacity: 1 }}>
            <h3 className="font-semibold">Our values</h3>
            <p className="mt-2 text-sm text-gray-700">Respect, reciprocity, and momentum. We prioritize quick wins and meaningful learning.</p>
          </motion.div>

          <motion.div className="p-6 border shadow-sm rounded-2xl bg-white/80" initial={{ opacity: 0, delay: 0.1 }} animate={{ opacity: 1 }}>
            <h3 className="font-semibold">Join us</h3>
            <p className="mt-2 text-sm text-gray-700">Sign up to start swapping skills with people who actually want to help and learn.</p>
            <NavLink to="/register" className="inline-block px-4 py-2 mt-3 text-white rounded bg-gradient-to-r from-indigo-500 to-purple-600">Get started</NavLink>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
