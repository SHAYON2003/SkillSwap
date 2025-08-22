// src/pages/Contact.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // wire to your API if you want — for now show success toast
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-20 text-gray-900 bg-gradient-to-br from-indigo-50 via-purple-50 to-emerald-50">
      <div className="container max-w-3xl p-6 mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold">
          Contact us
        </motion.h1>
        <p className="mt-2 text-gray-700">Have questions or want to partner? Drop a message and we'll get back soon.</p>

        <motion.form onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-4">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full px-4 py-3 border rounded-xl bg-white/80" />
          <input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" type="email" className="w-full px-4 py-3 border rounded-xl bg-white/80" />
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} placeholder="Message" className="w-full px-4 py-3 border rounded-xl bg-white/80" />
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 text-white rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600">Send</button>
            {sent && <span className="text-green-600">Message sent — thanks!</span>}
          </div>
        </motion.form>
      </div>
    </div>
  );
}
