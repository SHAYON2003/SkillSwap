// controllers/matchController.js
const User = require('../models/User');

// escape regex helper
function escapeRegex(str = '') {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// safely resolve requester id (string or object)
function getRequesterId(req) {
  if (!req || !req.user) return null;
  return typeof req.user === 'string' ? req.user : (req.user._id || req.user.id || null);
}

exports.searchBySkill = async (req, res) => {
  try {
    const { skill, type = 'offered' } = req.query;
    if (!skill || typeof skill !== 'string' || !skill.trim()) {
      return res.status(400).json({ message: 'skill query is required' });
    }

    const normalizedType = (type || 'offered').toString().toLowerCase();
    const field = (normalizedType === 'wanted' || normalizedType === 'requested') ? 'skillsWanted' : 'skillsOffered';

    const s = skill.trim();
    const safe = escapeRegex(s);
    const skillRegex = new RegExp(safe, 'i');

    const requesterId = getRequesterId(req);

    // Build a safe query that targets the subdocument `name` field.
    // Do NOT do { [field]: { $in: [s] } } for arrays of subdocs — that causes casting errors.
    const query = {
      $or: [
        { [`${field}.name`]: { $regex: skillRegex } },
        // also allow exact matches on the subdoc name using $in on the sub-field:
        { [`${field}.name`]: { $in: [s] } }
      ],
    };

    if (requesterId) query._id = { $ne: requesterId };

    const list = await User.find(query).select('-password').limit(50).lean();
    return res.json({ results: list });
  } catch (err) {
    console.error('searchBySkill ERROR:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};


exports.getCompatibleMatches = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ message: 'Unauthorized' });

    const me = await User.findById(requesterId).lean();
    if (!me) return res.status(404).json({ message: 'User not found' });

    const offeredNames = (me.skillsOffered || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);
    const wantedNames  = (me.skillsWanted  || []).map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean);

    if (!offeredNames.length && !wantedNames.length) return res.json({ results: [] });

    const matches = await User.find({
      _id: { $ne: requesterId },
      $or: [
        // They offer what I want (match by subdoc name or legacy string)
        { $or: [{ 'skillsOffered.name': { $in: wantedNames } }, { skillsOffered: { $in: wantedNames } }] },
        // They want what I offer
        { $or: [{ 'skillsWanted.name': { $in: offeredNames } }, { skillsWanted: { $in: offeredNames } }] }
      ]
    }).select('-password').limit(50).lean();

    return res.json({ results: matches });
  } catch (err) {
    console.error('getCompatibleMatches ERROR:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};

exports.searchPublicRequests = async (req, res) => {
  try {
    const { skill, type = 'offered' } = req.query;
    if (!skill || typeof skill !== 'string' || !skill.trim()) {
      return res.status(400).json({ message: 'skill query is required' });
    }

    const normalizedType = type.toLowerCase();
    const field = normalizedType === 'wanted' ? 'skillRequested.name' : 'skillOffered.name';

    const s = skill.trim();
    const safe = escapeRegex(s);
    const skillRegex = new RegExp(safe, 'i');

    // Only fetch *public* requests
    const query = {
      visibility: 'public',
      $or: [
        { [field]: { $regex: skillRegex } },
        { [field]: skill }
      ]
    };

    const results = await SkillRequest.find(query)
      .populate('from', 'username email name') // join user info
      .limit(50)
      .lean();

    return res.json({ results });
  } catch (err) {
    console.error('searchPublicRequests ERROR:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};