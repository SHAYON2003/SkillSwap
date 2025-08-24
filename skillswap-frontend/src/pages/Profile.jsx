import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Safe localStorage wrapper
const safeStorage = {
  getItem: (key) => {
    try {
      return typeof window !== 'undefined' && window.localStorage 
        ? localStorage.getItem(key) 
        : null;
    } catch (error) {
      console.warn('localStorage not available:', error);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  }
};

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Error handling utility
const handleApiError = (error, fallbackMessage = 'An error occurred') => {
  if (error.response?.status === 401) {
    return 'Session expired. Please log in again.';
  }
  const message = error.response?.data?.message || error.message || fallbackMessage;
  // Don't expose sensitive error details
  return message.includes('token') ? 'Authentication error' : message;
};

// Profile Header Component
const ProfileHeader = ({ profile, avatarPreview, onAvatarChange, onAvatarUpload, onAvatarRemove, uploadProgress, avatarUploading }) => {
  return (
    <div className="p-8 mb-8 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div className="relative">
          <div className="relative w-24 h-24 overflow-hidden shadow-lg rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile avatar" className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-4xl font-bold text-white">
                {profile.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="absolute w-6 h-6 bg-green-400 border-2 border-white rounded-full -top-1 -right-1" />
          </div>

          <div className="flex items-center justify-center gap-2 mt-3 md:justify-start">
            <label className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-150 rounded-lg cursor-pointer bg-white/90 hover:shadow">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => onAvatarChange(e.target.files?.[0])} 
                disabled={avatarUploading}
                aria-label="Select avatar image"
              />
              <span>Change</span>
            </label>
            <button 
              onClick={onAvatarUpload} 
              disabled={avatarUploading} 
              className="px-3 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow disabled:opacity-60"
              aria-label={avatarUploading ? `Uploading ${uploadProgress}%` : 'Upload avatar'}
            >
              {avatarUploading ? `Uploading ${uploadProgress}%` : 'Upload'}
            </button>
            <button 
              onClick={onAvatarRemove} 
              disabled={avatarUploading} 
              className="px-3 py-2 text-sm text-red-600 rounded-lg bg-white/90 hover:bg-white/100"
              aria-label="Remove avatar"
            >
              Remove
            </button>
          </div>

          {avatarUploading && (
            <div className="w-48 mt-2 rounded-full bg-white/30" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100">
              <div className="h-2 transition-all duration-300 bg-purple-600 rounded-full" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="mb-2 text-3xl font-bold text-gray-800">{profile.username}</h3>
          <p className="mb-4 text-gray-600">{profile.email}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="text-2xl">⭐</span>
            <span className="text-lg font-semibold text-gray-800">
              Average Rating: {profile?.ratingCount ? (profile.ratingSum / profile.ratingCount).toFixed(1) : 'No ratings yet'}
              {profile.ratingCount > 0 && (
                <span className="ml-2 text-sm text-gray-500">({profile.ratingCount} review{profile.ratingCount !== 1 ? 's' : ''})</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// About & Socials Component
const AboutSocialsSection = ({ profile, profileForm, setProfileForm, editingAbout, setEditingAbout, editingSocials, setEditingSocials, onSaveBio, onSaveProfile }) => {
  const bioTextareaRef = useRef(null);
  const ABOUT_MIN_HEIGHT_PX = 152;

  useEffect(() => {
    if (editingAbout && bioTextareaRef.current) {
      setTimeout(() => bioTextareaRef.current?.focus(), 0);
    }
  }, [editingAbout]);

  const isValidLinkedIn = (url) => /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(url);
  const isValidInstagram = (url) => /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._%-]+(?:\/.*)?$/i.test(url);
  const isValidYouTube = (url) => /^https?:\/\/(www\.)?youtube\.com\/.+|^https?:\/\/youtu\.be\/.+/i.test(url);

  const UniformIconWrap = ({ children }) => (
    <span className="inline-flex items-center justify-center w-5 h-5 text-gray-700 bg-gray-100 rounded-md">
      {children}
    </span>
  );

  const IconLinkedIn = (props) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0V8zm7.5 0H12v2.2h.06c.63-1.2 2.18-2.47 4.49-2.47 4.8 0 5.68 3.16 5.68 7.27V24h-5v-7.24c0-1.72-.03-3.93-2.39-3.93-2.4 0-2.77 1.87-2.77 3.8V24h-5V8z" fill="currentColor"/>
    </svg>
  );

  const IconInstagram = (props) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18.5 6a1 1 0 1 1-1-1 1 1 0 0 1 1 1z" fill="currentColor"/>
    </svg>
  );

  const IconYouTube = (props) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...props}>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.5v-7l6 3.5-6 3.5z" fill="currentColor"/>
    </svg>
  );

  return (
    <div className="p-8 mb-8 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <span className="text-3xl">🧾</span>
          About & Social Links
        </h3>

        {!editingAbout ? (
          <button 
            type="button" 
            onClick={() => setEditingAbout(true)} 
            className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-xl bg-white/80 hover:bg-white"
            aria-label="Edit about section"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => { 
                setEditingAbout(false); 
                setProfileForm((prev) => ({ ...prev, bio: profile?.bio || '' })); 
              }} 
              className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-xl bg-white/80 hover:bg-white"
              aria-label="Cancel editing"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onSaveBio} 
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-600"
              aria-label="Save bio"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="grid items-start grid-cols-1 gap-5 md:grid-cols-2">
        {/* About me */}
        <div className="flex flex-col">
          <label htmlFor="bio-input" className="mb-2 text-sm font-semibold text-gray-700">About me</label>

          {!editingAbout ? (
            <div
              className="p-4 text-gray-800 transition-all duration-300 border bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl"
              style={{ minHeight: ABOUT_MIN_HEIGHT_PX }}
              role="region"
              aria-label="About me section"
            >
              {(profileForm.bio && profileForm.bio.trim().length > 0)
                ? <p className="leading-relaxed whitespace-pre-wrap">{profileForm.bio}</p>
                : <p className="text-gray-500">Add a short bio about your background, what you love to teach/learn, and your availability.</p>}
            </div>
          ) : (
            <textarea
              id="bio-input"
              ref={bioTextareaRef}
              rows={6}
              value={profileForm.bio}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
              placeholder="A few lines about your background, what you love to teach/learn, and your availability."
              className="p-4 text-gray-800 placeholder-gray-500 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-describedby="bio-char-count"
            />
          )}

          <p id="bio-char-count" className="mt-2 text-xs text-gray-500">{profileForm.bio?.length || 0}/500</p>
        </div>

        {/* Social Links */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
              <span className="text-3xl">🔗</span>
              Social Links
            </h3>

            {!editingSocials ? (
              <button
                type="button"
                onClick={() => setEditingSocials(true)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-xl bg-white/80 hover:bg-white"
                aria-label="Edit social links"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSocials(false);
                    setProfileForm((prev) => ({
                      ...prev,
                      linkedin: profile?.linkedin || '',
                      instagram: profile?.instagram || '',
                      youtube: profile?.youtube || '',
                      isEmailPublic: Boolean(profile?.isEmailPublic),
                    }));
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-xl bg-white/80 hover:bg-white"
                  aria-label="Cancel social links editing"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveProfile}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-600"
                  aria-label="Save social links"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {!editingSocials ? (
            <div className="space-y-4">
              {/* Public email status */}
              <div className="p-4 border rounded-2xl bg-white/60 border-white/30">
                <p className="mb-1 text-sm font-semibold text-gray-700">Public email</p>
                {profile?.isEmailPublic ? (
                  <p className="text-sm text-gray-700">📧 {profile?.email}</p>
                ) : (
                  <p className="text-sm italic text-gray-500">Hidden</p>
                )}
              </div>

              {/* Social links */}
              <div className="p-4 space-y-2 border rounded-2xl bg-white/60 border-white/30">
                <p className="text-sm font-semibold text-gray-700">Social links</p>

                {profile?.linkedin ? (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="block text-sm text-blue-700 hover:underline">
                    🔗 LinkedIn
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">No LinkedIn added</p>
                )}

                {profile?.instagram ? (
                  <a href={profile.instagram} target="_blank" rel="noreferrer" className="block text-sm text-pink-600 hover:underline">
                    📸 Instagram
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">No Instagram added</p>
                )}

                {profile?.youtube ? (
                  <a href={profile.youtube} target="_blank" rel="noreferrer" className="block text-sm text-red-600 hover:underline">
                    ▶️ YouTube
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">No YouTube added</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Email toggle */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">Public email</label>
                <div className="flex items-center justify-between p-4 border rounded-2xl bg-white/60 border-white/30">
                  <div>
                    <p className="text-sm text-gray-600">Show your email on your public profile</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileForm(prev => ({ ...prev, isEmailPublic: !prev.isEmailPublic }))}
                    className={`w-12 h-7 rounded-full transition ${profileForm.isEmailPublic ? 'bg-green-500' : 'bg-gray-300'} relative`}
                    aria-label={`${profileForm.isEmailPublic ? 'Hide' : 'Show'} email publicly`}
                    role="switch"
                    aria-checked={profileForm.isEmailPublic}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition ${profileForm.isEmailPublic ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              {/* LinkedIn */}
              <div>
                <label htmlFor="linkedin-input" className="block mb-2 text-sm font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <UniformIconWrap><IconLinkedIn /></UniformIconWrap>
                    LinkedIn URL
                  </span>
                </label>
                <input
                  id="linkedin-input"
                  type="url"
                  value={profileForm.linkedin}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="https://www.linkedin.com/in/your-handle"
                  className="w-full p-4 text-gray-800 placeholder-gray-500 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  aria-describedby={profileForm.linkedin && !isValidLinkedIn(profileForm.linkedin) ? "linkedin-error" : undefined}
                />
                {profileForm.linkedin && !isValidLinkedIn(profileForm.linkedin) && (
                  <p id="linkedin-error" className="mt-1 text-sm text-red-600" role="alert">Please enter a valid LinkedIn URL</p>
                )}
                {profileForm.linkedin && isValidLinkedIn(profileForm.linkedin) && (
                  <a href={profileForm.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-gray-700 hover:underline">
                    <UniformIconWrap><IconLinkedIn /></UniformIconWrap> Preview LinkedIn
                  </a>
                )}
              </div>

              {/* Instagram */}
              <div>
                <label htmlFor="instagram-input" className="block mb-2 text-sm font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <UniformIconWrap><IconInstagram /></UniformIconWrap>
                    Instagram URL
                  </span>
                </label>
                <input
                  id="instagram-input"
                  type="url"
                  value={profileForm.instagram}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="https://www.instagram.com/yourname"
                  className="w-full p-4 text-gray-800 placeholder-gray-500 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  aria-describedby={profileForm.instagram && !isValidInstagram(profileForm.instagram) ? "instagram-error" : undefined}
                />
                {profileForm.instagram && !isValidInstagram(profileForm.instagram) && (
                  <p id="instagram-error" className="mt-1 text-sm text-red-600" role="alert">Please enter a valid Instagram URL</p>
                )}
                {profileForm.instagram && isValidInstagram(profileForm.instagram) && (
                  <a href={profileForm.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-gray-700 hover:underline">
                    <UniformIconWrap><IconInstagram /></UniformIconWrap> Preview Instagram
                  </a>
                )}
              </div>

              {/* YouTube */}
              <div>
                <label htmlFor="youtube-input" className="block mb-2 text-sm font-semibold text-gray-700">
                  <span className="inline-flex items-center gap-2">
                    <UniformIconWrap><IconYouTube /></UniformIconWrap>
                    YouTube URL
                  </span>
                </label>
                <input
                  id="youtube-input"
                  type="url"
                  value={profileForm.youtube}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, youtube: e.target.value }))}
                  placeholder="https://youtube.com/@yourhandle  or  https://youtu.be/xyz"
                  className="w-full p-4 text-gray-800 placeholder-gray-500 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  aria-describedby={profileForm.youtube && !isValidYouTube(profileForm.youtube) ? "youtube-error" : undefined}
                />
                {profileForm.youtube && !isValidYouTube(profileForm.youtube) && (
                  <p id="youtube-error" className="mt-1 text-sm text-red-600" role="alert">Please enter a valid YouTube URL</p>
                )}
                {profileForm.youtube && isValidYouTube(profileForm.youtube) && (
                  <a href={profileForm.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 text-sm font-medium text-gray-700 hover:underline">
                    <UniformIconWrap><IconYouTube /></UniformIconWrap> Preview YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skills Section Component
const SkillsSection = ({ title, icon, skills, type, onRemoveSkill, loading, emptyMessage }) => {
  return (
    <div className="p-8 mb-8 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl">
      <h3 className="flex items-center gap-2 mb-6 text-2xl font-bold text-gray-800">
        <span className="text-3xl">{icon}</span>
        {title}
      </h3>
      {skills?.length === 0 && (
        <p className="py-8 italic text-center text-gray-500">{emptyMessage}</p>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills?.map((skill, index) => (
          <div
            key={skill.name + index}
            className="p-4 transition-all duration-300 border shadow-lg bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl hover:shadow-xl group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-800 transition-colors duration-300 group-hover:text-purple-600">
                  {skill.name}
                </p>
                {skill.level && (
                  <p className={`mt-1 text-sm font-medium ${type === 'offered' ? 'text-green-600' : 'text-blue-600'}`}>
                    {skill.level}
                  </p>
                )}
              </div>
              <button
                onClick={() => onRemoveSkill(type, skill.name)}
                className="p-2 text-red-500 transition-colors duration-300 hover:text-red-600 rounded-xl hover:bg-red-50"
                disabled={loading}
                title={`Remove ${skill.name} skill`}
                aria-label={`Remove ${skill.name} skill`}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add Skills Component
const AddSkillsSection = ({ newSkill, setNewSkill, onAddSkill, loading }) => {
  const handleKeyPress = (e) => { 
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddSkill(); 
    }
  };

  return (
    <div className="p-8 mb-8 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl">
      <h3 className="flex items-center gap-2 mb-6 text-2xl font-bold text-gray-800">
        <span className="text-3xl">➕</span>
        Add New Skill
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label htmlFor="skill-type" className="block mb-2 text-sm font-semibold text-gray-700">Type</label>
          <select
            id="skill-type"
            value={newSkill.type}
            onChange={(e) => setNewSkill(prev => ({ ...prev, type: e.target.value }))}
            className="w-full p-4 text-gray-800 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="offered">I can teach</option>
            <option value="wanted">I want to learn</option>
          </select>
        </div>
        <div>
          <label htmlFor="skill-name" className="block mb-2 text-sm font-semibold text-gray-700">Skill Name *</label>
          <input
            id="skill-name"
            type="text"
            value={newSkill.name}
            onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
            onKeyPress={handleKeyPress}
            placeholder="e.g., JavaScript, Guitar, Cooking"
            className="w-full p-4 text-gray-800 placeholder-gray-500 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="skill-level" className="block mb-2 text-sm font-semibold text-gray-700">Level (Optional)</label>
          <select
            id="skill-level"
            value={newSkill.level}
            onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
            className="w-full p-4 text-gray-800 transition-all duration-300 border outline-none bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select level...</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={onAddSkill}
            disabled={!newSkill.name.trim() || loading}
            className="w-full px-6 py-4 text-sm font-semibold text-white transition-all duration-300 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Add skill"
          >
            {loading ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Reviews Component
const ReviewsSection = ({ reviews }) => {
  return (
    <div className="p-8 transition-all duration-300 border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl hover:shadow-2xl">
      <h3 className="flex items-center gap-2 mb-6 text-2xl font-bold text-gray-800">
        <span className="text-3xl">⭐</span>
        Reviews & Feedback
      </h3>
      {reviews.length === 0 && (
        <p className="py-8 italic text-center text-gray-500">No reviews yet. Complete some skill exchanges to get feedback!</p>
      )}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div
            key={review._id || index}
            className="p-6 transition-all duration-300 border shadow-lg bg-white/60 backdrop-blur-sm border-white/30 rounded-2xl hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                  <span className="font-semibold text-white">
                    {review.reviewer?.username?.charAt(0) || 'A'}
                  </span>
                </div>
                <p className="font-semibold text-gray-800">
                  {review.reviewer?.username || 'Anonymous'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex" role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-600">{review.rating}/5</span>
              </div>
            </div>
            <p className="mb-3 leading-relaxed text-gray-700">{review.comment}</p>
            {review.createdAt && (
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Skeleton Component
const ProfileSkeleton = () => (
  <div className="container relative z-10 p-4 pt-20 mx-auto">
    <div className="mb-12 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full shadow-lg bg-white/30 backdrop-blur-md border-white/20">
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
        <div className="w-20 h-4 bg-gray-300 rounded animate-pulse" />
      </div>
      <div className="w-64 h-12 mx-auto mb-4 bg-gray-300 rounded animate-pulse" />
    </div>
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse" />
      ))}
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Profile component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container relative z-10 p-4 pt-20 mx-auto">
          <div className="p-8 text-center border shadow-xl bg-white/40 backdrop-blur-lg border-white/20 rounded-3xl">
            <h2 className="mb-4 text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mb-4 text-gray-700">We're sorry, but there was an error loading your profile.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main Profile Component
function Profile() {
  // Always call hooks unconditionally at the top level
  const authContext = useAuth();
  const { user, logout } = authContext || { user: null, logout: () => {} };

  // ---------- Config ----------
  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:4000').replace(/\/$/, '');

  // Create axios instance with proper error handling
  const axiosAuth = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE });
    
    instance.interceptors.request.use((config) => {
      const token = safeStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    instance.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401) {
          safeStorage.removeItem('token');
          if (logout) logout();
        }
        return Promise.reject(err);
      }
    );
    
    return instance;
  }, [API_BASE, logout]);

  // ---------- Helpers ----------
  const getAvatarUrl = useCallback((avatar) => {
    if (!avatar) return '';
    const raw = (typeof avatar === 'string' ? avatar : (avatar.url || avatar.path || avatar.avatarUrl || '')).toString().trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return `${raw}${raw.includes('?') ? '&' : '?'}v=${Date.now()}`;
    let candidate = raw;
    if (API_BASE && raw.startsWith(API_BASE)) candidate = raw.slice(API_BASE.length);
    const slashPrefixed = candidate.startsWith('/') ? candidate : `/${candidate}`;
    const absolute = API_BASE ? `${API_BASE}${slashPrefixed}` : slashPrefixed;
    return `${absolute}${absolute.includes('?') ? '&' : '?'}v=${Date.now()}`;
  }, [API_BASE]);

  // normalize any user payload shape into what UI expects
  const normalizeUser = useCallback((raw) => {
    const u = raw?.user || raw || {};
    return {
      id: u.id || u._id,
      username: u.username || u.name || '',
      email: u.email || '',
      avatar: u.avatar || u.avatarUrl || u.photo || '',
      bio: u.bio ?? u.about ?? u.aboutMe ?? '',
      linkedin: u.linkedin || u.linkedinUrl || '',
      instagram: u.instagram || u.instagramUrl || '',
      youtube: u.youtube || u.youtubeUrl || '',
      isEmailPublic: Boolean(u.isEmailPublic),
      ratingCount: u.ratingCount || 0,
      ratingSum: u.ratingSum || 0,
      skillsOffered: u.skillsOffered || [],
      skillsWanted: u.skillsWanted || [],
    };
  }, []);

  // ---------- State ----------
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newSkill, setNewSkill] = useState({ type: 'offered', name: '', level: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // about + socials form
  const [profileForm, setProfileForm] = useState({
    bio: '',
    linkedin: '',
    instagram: '',
    youtube: '',
    isEmailPublic: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // about edit/view
  const [editingAbout, setEditingAbout] = useState(false);

  // socials edit/view
  const [editingSocials, setEditingSocials] = useState(false);

  // Memoized avatar preview
  const memoizedAvatarPreview = useMemo(() => {
    return avatarPreview || getAvatarUrl(profile?.avatar);
  }, [avatarPreview, profile?.avatar, getAvatarUrl]);

  // ---------- Load profile + reviews ----------
  useEffect(() => {
    if (!user) return;
    const token = safeStorage.getItem('token');
    if (!token) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }

    setLoading(true);
    Promise.all([
      axiosAuth.get(`/users/me`),
      axiosAuth.get(`/api/reviews/user/${user.id}`),
    ])
      .then(([profileRes, reviewsRes]) => {
        const normalized = normalizeUser(profileRes.data);
        setProfile(normalized);
        setReviews(reviewsRes.data || []);
        setAvatarPreview(getAvatarUrl(normalized?.avatar));
        setProfileForm({
          bio: normalized.bio || '',
          linkedin: normalized.linkedin || '',
          instagram: normalized.instagram || '',
          youtube: normalized.youtube || '',
          isEmailPublic: Boolean(normalized.isEmailPublic),
        });
        setEditingAbout(!(normalized.bio && normalized.bio.trim().length > 0));
        setEditingSocials(false);
      })
      .catch(err => {
        const errorMessage = handleApiError(err, 'Failed to load profile');
        setError(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [user, axiosAuth, normalizeUser, getAvatarUrl]);

  // Cleanup avatar preview URLs
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // ---------- Skills ----------
  const addSkill = useCallback(async () => {
    if (!newSkill.name.trim()) { 
      setError('Skill name is required'); 
      return; 
    }
    if (!safeStorage.getItem('token')) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }
    
    setError(''); 
    setLoading(true);
    
    try {
      await axiosAuth.post(`/users/skills/add`, newSkill);
      const res = await axiosAuth.get(`/users/me`);
      const normalized = normalizeUser(res.data);
      setProfile(normalized);
      setAvatarPreview(getAvatarUrl(normalized?.avatar));
      setNewSkill({ type: 'offered', name: '', level: '' });
      setError('Skill added successfully');
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to add skill');
      setError(errorMessage);
      console.error('Add skill error:', err);
    } finally { 
      setLoading(false); 
    }
  }, [newSkill, axiosAuth, normalizeUser, getAvatarUrl]);

  const removeSkill = useCallback(async (type, name) => {
    if (!safeStorage.getItem('token')) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }
    
    setError(''); 
    setLoading(true);
    
    try {
      await axiosAuth.delete(`/users/skills/remove`, { data: { type, name } });
      const res = await axiosAuth.get(`/users/me`);
      const normalized = normalizeUser(res.data);
      setProfile(normalized);
      setAvatarPreview(getAvatarUrl(normalized?.avatar));
      setError('Skill removed successfully');
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to remove skill');
      setError(errorMessage);
      console.error('Remove skill error:', err);
    } finally { 
      setLoading(false); 
    }
  }, [axiosAuth, normalizeUser, getAvatarUrl]);

  // ---------- Avatar ----------
  const onSelectAvatar = useCallback((file) => {
    setError('');
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(getAvatarUrl(profile?.avatar));
      return;
    }
    
    // Clean up previous preview URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    
    const url = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(url);
  }, [profile?.avatar, avatarPreview, getAvatarUrl]);

  const uploadAvatar = useCallback(async () => {
    if (!safeStorage.getItem('token')) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }
    if (!avatarFile) { 
      setError('Select an image first'); 
      return; 
    }
    
    setAvatarUploading(true); 
    setUploadProgress(0); 
    setError('');
    
    try {
      const fd = new FormData(); 
      fd.append('avatar', avatarFile);
      
      const res = await axiosAuth.post(`/users/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      });
      
      const normalized = normalizeUser(res.data);
      if (normalized?.avatar) {
        setAvatarPreview(getAvatarUrl(normalized.avatar));
        setProfile((prev) => ({ ...prev, avatar: normalized.avatar }));
        setError('Avatar uploaded successfully');
      } else {
        const pr = await axiosAuth.get(`/users/me`);
        const n2 = normalizeUser(pr.data);
        setProfile(n2);
        setAvatarPreview(getAvatarUrl(n2?.avatar));
        setError('Avatar uploaded successfully');
      }
      setAvatarFile(null);
    } catch (err) {
      console.error('Upload avatar error:', err.response || err);
      const errorMessage = handleApiError(err, 'Failed to upload avatar');
      setError(errorMessage);
    } finally { 
      setAvatarUploading(false); 
      setUploadProgress(0); 
    }
  }, [avatarFile, axiosAuth, normalizeUser, getAvatarUrl]);

  const removeAvatar = useCallback(async () => {
    if (!safeStorage.getItem('token')) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }
    
    setError(''); 
    setLoading(true);
    
    try {
      await axiosAuth.delete(`/users/avatar`);
      const pr = await axiosAuth.get(`/users/me`);
      const normalized = normalizeUser(pr.data);
      setProfile(normalized);
      setAvatarPreview(getAvatarUrl(normalized?.avatar));
      setError('Avatar removed');
    } catch (err) {
      setAvatarFile(null); 
      setAvatarPreview('');
      const errorMessage = handleApiError(err, 'Avatar cleared locally (server delete might not be implemented).');
      setError(errorMessage);
    } finally { 
      setLoading(false); 
    }
  }, [axiosAuth, normalizeUser, getAvatarUrl]);

  // ---------- Save ONLY Bio ----------
  const saveBio = useCallback(async () => {
    if (!safeStorage.getItem('token')) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }

    setError('');
    const trimmedBio = (profileForm.bio || '').slice(0, 500);

    // Optimistic: update view immediately
    setProfile((prev) => prev ? { ...prev, bio: trimmedBio } : prev);
    setProfileForm((prev) => ({ ...prev, bio: trimmedBio }));

    try {
      await axiosAuth.patch(`/users/me`, { bio: trimmedBio });
      const res = await axiosAuth.get(`/users/me`);
      const normalized = normalizeUser(res.data);
      setProfile(normalized);
      setProfileForm((prev) => ({ ...prev, bio: normalized.bio || trimmedBio }));
      setError('Bio updated successfully');
      setEditingAbout(false);
    } catch (err) {
      console.error('Save bio error:', err);
      const errorMessage = handleApiError(err, 'Failed to update bio');
      setError(errorMessage);
    }
  }, [profileForm.bio, axiosAuth, normalizeUser]);

  // ---------- Save socials (also carries bio if you edit there) ----------
  const saveProfileBasics = useCallback(async () => {
    if (!safeStorage.getItem('token')) { 
      setError('You are not signed in. Please log in again.'); 
      return; 
    }

    setError('');
    const trimmed = {
      bio: (profileForm.bio || '').slice(0, 500),
      linkedin: (profileForm.linkedin || '').trim(),
      instagram: (profileForm.instagram || '').trim(),
      youtube: (profileForm.youtube || '').trim(),
      isEmailPublic: Boolean(profileForm.isEmailPublic),
    };

    // Validation
    const isValidLinkedIn = (u) => /^https?:\/\/(www\.)?linkedin\.com\/.+/i.test(u);
    const isValidInstagram = (u) => /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._%-]+(?:\/.*)?$/i.test(u);
    const isValidYouTube = (u) => /^https?:\/\/(www\.)?youtube\.com\/.+|^https?:\/\/youtu\.be\/.+/i.test(u);

    if (trimmed.linkedin && !isValidLinkedIn(trimmed.linkedin)) { 
      setError('Please enter a valid LinkedIn URL'); 
      return; 
    }
    if (trimmed.instagram && !isValidInstagram(trimmed.instagram)) { 
      setError('Please enter a valid Instagram URL'); 
      return; 
    }
    if (trimmed.youtube && !isValidYouTube(trimmed.youtube)) { 
      setError('Please enter a valid YouTube URL'); 
      return; 
    }

    setSavingProfile(true);

    // Optimistic
    setProfile((prev) => prev ? { ...prev, ...trimmed } : prev);
    setProfileForm((prev) => ({ ...prev, ...trimmed }));

    try {
      await axiosAuth.patch(`/users/me`, trimmed);
      const res = await axiosAuth.get(`/users/me`);
      const normalized = normalizeUser(res.data);
      setProfile(normalized);
      setProfileForm({
        bio: normalized.bio || trimmed.bio,
        linkedin: normalized.linkedin || trimmed.linkedin,
        instagram: normalized.instagram || trimmed.instagram,
        youtube: normalized.youtube || trimmed.youtube,
        isEmailPublic: Boolean(normalized.isEmailPublic),
      });
      setError('Profile updated successfully');
      setEditingAbout(false);
      setEditingSocials(false);
    } catch (err) {
      console.error('Save profile error:', err);
      const errorMessage = handleApiError(err, 'Failed to update profile');
      setError(errorMessage);
    } finally { 
      setSavingProfile(false); 
    }
  }, [profileForm, axiosAuth, normalizeUser]);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ---------- Decorative dots ----------
  const floatingDots = useMemo(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i, 
      x: Math.random() * 100, 
      y: Math.random() * 100, 
      size: Math.random() * 4 + 2, 
      delay: Math.random() * 5
    })), []
  );

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-purple-50 to-blue-50">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full top-20 left-20 bg-gradient-to-br from-purple-300/30 to-pink-300/30 blur-xl animate-pulse" />
          <div className="absolute w-48 h-48 rounded-full top-40 right-32 bg-gradient-to-br from-blue-300/30 to-teal-300/30 blur-xl animate-pulse" />
          <div className="absolute rounded-full bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-pink-200/25 to-purple-200/25 blur-xl animate-pulse" />
          <div className="absolute w-16 h-16 rotate-45 border-2 top-1/4 left-1/4 border-purple-200/40 animate-spin" style={{ animationDuration: '15s' }} />
          <div className="absolute w-20 h-20 border-2 rounded-full bottom-1/3 right-1/4 border-blue-200/40 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />
          {floatingDots.map((dot) => (
            <div
              key={dot.id}
              className="absolute rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-bounce"
              style={{ 
                left: `${dot.x}%`, 
                top: `${dot.y}%`, 
                width: `${dot.size}px`, 
                height: `${dot.size}px`,
                animationDelay: `${dot.delay}s`,
                animationDuration: '4s'
              }}
            />
          ))}
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        </div>

        <div className="container relative z-10 p-4 pt-20 mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 border rounded-full shadow-lg bg-white/30 backdrop-blur-md border-white/20">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">👤 Your Profile</span>
            </div>

            <h1 className="mb-4 text-4xl font-bold md:text-6xl">
              <span className="text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text">
                Manage Your
              </span>
              <br />
              <span className="text-transparent bg-gradient-to-r from-blue-600 via-teal-600 to-purple-600 bg-clip-text">
                Skills & Profile
              </span>
            </h1>
          </div>

          {/* Error/Success banner */}
          {error && (
            <div 
              className={`mb-6 p-4 rounded-2xl backdrop-blur-md border shadow-lg ${
                /success|updated/i.test(error) 
                  ? 'bg-green-50/80 border-green-200 text-green-800' 
                  : 'bg-red-50/80 border-red-200 text-red-800'
              }`}
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Content */}
          {profile && (
            <>
              <ProfileHeader
                profile={profile}
                avatarPreview={memoizedAvatarPreview}
                onAvatarChange={onSelectAvatar}
                onAvatarUpload={uploadAvatar}
                onAvatarRemove={removeAvatar}
                uploadProgress={uploadProgress}
                avatarUploading={avatarUploading}
              />

              <AboutSocialsSection
                profile={profile}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                editingAbout={editingAbout}
                setEditingAbout={setEditingAbout}
                editingSocials={editingSocials}
                setEditingSocials={setEditingSocials}
                onSaveBio={saveBio}
                onSaveProfile={saveProfileBasics}
              />

              <AddSkillsSection
                newSkill={newSkill}
                setNewSkill={setNewSkill}
                onAddSkill={addSkill}
                loading={loading}
              />

              <SkillsSection
                title="Skills I Offer"
                icon="🎯"
                skills={profile.skillsOffered}
                type="offered"
                onRemoveSkill={removeSkill}
                loading={loading}
                emptyMessage="No skills offered yet. Add some skills you can teach!"
              />

              <SkillsSection
                title="Skills I Want to Learn"
                icon="🎓"
                skills={profile.skillsWanted}
                type="wanted"
                onRemoveSkill={removeSkill}
                loading={loading}
                emptyMessage="No skills wanted yet. Add some skills you'd like to learn!"
              />

              <ReviewsSection reviews={reviews} />
            </>
          )}

          {/* Scroll to Top */}
          <button
            onClick={scrollToTop}
            className="fixed z-50 flex items-center justify-center text-white transition-all duration-300 rounded-full shadow-lg bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-110"
            aria-label="Scroll to top"
          >
            <span className="text-xl">↑</span>
          </button>
        </div>

        <style>{`
          .bg-grid-pattern { 
            background-image: radial-gradient(circle at 25px 25px, rgba(0,0,0,0.1) 2px, transparent 0); 
            background-size: 50px 50px; 
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}

export default Profile;