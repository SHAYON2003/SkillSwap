// controllers/requestController.js
const SkillRequest = require("../models/SkillRequest");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const { getIO } = require("../socket");
const User = require('../models/User')



// helper: emit notif safely
async function safeNotify(payload, roomUserId) {
  try {
    const notif = await Notification.create(payload);
    getIO().to(`user:${String(roomUserId)}`).emit("notification:new", notif);
  } catch (e) {
    console.warn("[REQUEST][notify] non-fatal:", e.message);
  }
}

// A: create post / request (public or direct)
exports.createRequest = async (req, res) => {
  try {
    const {
      to = null,
      type = "direct", // 'offer' | 'learn' | 'direct'
      skillOffered,
      skillRequested,
    } = req.body;

    // normalize strings
    const offeredName = skillOffered?.name?.trim() || "";
    const requestedName = skillRequested?.name?.trim() || "";

    // validation matrix
    if (type === "offer") {
      if (!offeredName) {
        return res
          .status(400)
          .json({ success: false, message: "Provide the skill you want to offer" });
      }
    } else if (type === "learn") {
      if (!requestedName) {
        return res
          .status(400)
          .json({ success: false, message: "Provide the skill you want to learn" });
      }
    } else if (type === "direct") {
      const hasSomeSkill = offeredName || requestedName;
      if (!to || !hasSomeSkill) {
        return res.status(400).json({
          success: false,
          message: "Direct request needs a target user and at least one skill",
        });
      }
      if (String(to) === String(req.user)) {
        return res
          .status(400)
          .json({ success: false, message: "You cannot send request to yourself" });
      }
      // avoid duplicate pending between these two
      const existing = await SkillRequest.findOne({
        $or: [
          { from: req.user, to, status: "pending" },
          { from: to, to: req.user, status: "pending" },
        ],
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "A pending request already exists between these users",
        });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }

    // decide visibility & status
    const isPublic = !to && (type === "offer" || type === "learn");
    const status = isPublic ? "open" : "pending";

    const request = await SkillRequest.create({
      from: req.user,
      to: to || null,
      type,
      visibility: isPublic ? "public" : "direct",
      status,
      skillOffered: offeredName ? { name: offeredName, ...(skillOffered?.level ? { level: skillOffered.level } : {}) } : { name: "" },
      skillRequested: requestedName ? { name: requestedName, ...(skillRequested?.level ? { level: skillRequested.level } : {}) } : { name: "" },
    });

    // notify receiver for direct requests only
    if (!isPublic && to) {
      await safeNotify(
        {
          user: to,
          type: "REQUEST_RECEIVED",
          title: "New skill request",
          body:
            (offeredName || "—") +
            " ⇄ " +
            (requestedName || "—"),
          data: { requestId: request._id, fromUser: req.user },
        },
        to
      );
    }

    return res.status(201).json({ success: true, request });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Claim a public (open) post -> becomes a pending direct request
exports.claimPublic = async (req, res) => {
  try {
    const reqId = req.params.id;
    const doc = await SkillRequest.findById(reqId);
    if (!doc) return res.status(404).json({ success: false, message: "Request not found" });

    if (doc.visibility !== "public" || doc.status !== "open") {
      return res.status(400).json({ success: false, message: "This post is not open for claiming" });
    }

    if (String(doc.from) === String(req.user)) {
      return res.status(400).json({ success: false, message: "You cannot claim your own post" });
    }

    // turn into a direct pending request
    doc.to = req.user;
    doc.visibility = "direct";
    doc.status = "pending";
    await doc.save();

    // notify author
    await safeNotify(
      {
        user: doc.from,
        type: "REQUEST_RECEIVED",
        title: "Someone responded to your post",
        body:
          (doc.skillOffered?.name || "—") +
          " ⇄ " +
          (doc.skillRequested?.name || "—"),
        data: { requestId: doc._id, fromUser: req.user },
      },
      doc.from
    );

    return res.json({ success: true, message: "Claimed", request: doc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// B: accept / reject; A: cancel (unchanged except it also works after claim)
exports.updateRequestStatus = async (req, res) => {
  try {
    const { action } = req.body;
    const reqId = req.params.id;

    const doc = await SkillRequest.findById(reqId);
    if (!doc) return res.status(404).json({ success: false, message: "Request not found" });

    // Accept / Reject (only receiver can do these)
    if (["accept", "reject"].includes(action)) {
      if (String(doc.to) !== String(req.user)) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }

      doc.status = action === "accept" ? "accepted" : "rejected";
      await doc.save();

      if (action === "accept") {
        let chat = await Chat.findOne({ participants: { $all: [doc.from, doc.to] } });
        if (!chat) chat = await Chat.create({ participants: [doc.from, doc.to] });

        await safeNotify(
          {
            user: doc.from,
            type: "REQUEST_ACCEPTED",
            title: "Request accepted",
            body: "Your skill request was accepted",
            data: { requestId: doc._id, chatId: chat._id },
          },
          doc.from
        );

        return res.json({ success: true, message: "Accepted", request: doc, chatId: chat._id });
      }

      await safeNotify(
        {
          user: doc.from,
          type: "REQUEST_REJECTED",
          title: "Request rejected",
          body: "Your skill request was rejected",
          data: { requestId: doc._id },
        },
        doc.from
      );

      return res.json({ success: true, message: "Rejected", request: doc });
    }

    // Cancel (only author can cancel)
    if (action === "cancel") {
      if (String(doc.from) !== String(req.user)) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
      doc.status = "cancelled";
      await doc.save();
      return res.json({ success: true, message: "Cancelled", request: doc });
    }

    // Complete (either participant; only if accepted)
    if (action === "complete") {
      if (doc.status !== "accepted") {
        return res.status(400).json({ success: false, message: "Only accepted requests can be completed" });
      }

      const isParticipant = [String(doc.from), String(doc.to)].includes(String(req.user));
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }

      doc.status = "completed";
      doc.completedAt = new Date();
      await doc.save();

      const offeredName = doc?.skillOffered?.name || "";
      const requestedName = doc?.skillRequested?.name || "";

      await Promise.all([
        bumpUserSkillCounters(doc.from, offeredName, requestedName),
        bumpUserSkillCounters(doc.to,   offeredName, requestedName)
      ]);

      await safeNotify(
        {
          user: doc.from,
          type: "REQUEST_COMPLETED",
          title: "Swap completed",
          body: `${offeredName || '—'} ⇄ ${requestedName || '—'} marked as completed`,
          data: { requestId: doc._id },
        },
        doc.from
      );
      await safeNotify(
        {
          user: doc.to,
          type: "REQUEST_COMPLETED",
          title: "Swap completed",
          body: `${offeredName || '—'} ⇄ ${requestedName || '—'} marked as completed`,
          data: { requestId: doc._id },
        },
        doc.to
      );

      return res.json({ success: true, message: "Completed", request: doc });
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};


// B: list incoming (direct only)
exports.getIncoming = async (req, res) => {
  try {
    const list = await SkillRequest.find({ to: req.user })
      .populate("from", "username email avatar")
      .sort({ createdAt: -1 });
    return res.json({ success: true, requests: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// A: list outgoing (includes your open public posts)
exports.getOutgoing = async (req, res) => {
  try {
    const list = await SkillRequest.find({ from: req.user })
      .populate("to", "username email avatar")
      .sort({ createdAt: -1 });
    return res.json({ success: true, requests: list });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};



function escapeRegex(str = '') {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

exports.getPublicOpen = async (req, res) => {
  try {
    const requesterId = typeof req.user === 'string' ? req.user : (req.user?._id || req.user?.id);
    const { skill, type = 'offered' } = req.query || {};

    // If no skill query → original "open public" feed (excluding self)
    if (!skill || !skill.trim()) {
      const list = await SkillRequest.find({
        visibility: 'public',
        status: 'open',
        ...(requesterId ? { from: { $ne: requesterId } } : {}),
      })
        .populate('from', 'username email avatar')
        .sort({ createdAt: -1 });

      return res.json({ success: true, requests: list });
    }

    // Else: skill search on public posts
    const normalizedType = String(type || 'offered').toLowerCase();
    const field = normalizedType === 'wanted' ? 'skillRequested.name' : 'skillOffered.name';
    const s = skill.trim();
    const rx = new RegExp(escapeRegex(s), 'i');

    const query = {
      visibility: 'public',
      status: 'open',
      ...(requesterId ? { from: { $ne: requesterId } } : {}),
      $or: [{ [field]: rx }, { [field]: s }],
    };

    const results = await SkillRequest.find(query)
      .populate('from', 'username email avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, results });
  } catch (err) {
    console.error('getPublicOpen ERROR:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
};


async function bumpUserSkillCounters(userId, offeredName, requestedName) {
  // Normalize names
  const offName = (offeredName || '').trim();
  const reqName = (requestedName || '').trim();

  // Build update operations (Mongo positional $[elem] filters)
  const updates = [];
  const arrayFilters = [];

  if (offName) {
    updates.push({ 
      update: { $inc: { "skillsOffered.$[so].swapsCount": 1 } }, 
      filter: { "so.name": offName } 
    });
  }
  if (reqName) {
    updates.push({ 
      update: { $inc: { "skillsWanted.$[sw].swapsCount": 1 } }, 
      filter: { "sw.name": reqName } 
    });
  }

  // If skill doesn’t exist yet, we’ll append it with a fresh counter
  const user = await User.findById(userId);
  if (!user) return;

  let modified = false;

  if (offName) {
    const idx = (user.skillsOffered || []).findIndex(s => (s?.name || '').toLowerCase() === offName.toLowerCase());
    if (idx === -1) {
      user.skillsOffered.push({ name: offName, level: "Beginner", swapsCount: 1 });
      modified = true;
    }
  }
  if (reqName) {
    const idx = (user.skillsWanted || []).findIndex(s => (s?.name || '').toLowerCase() === reqName.toLowerCase());
    if (idx === -1) {
      user.skillsWanted.push({ name: reqName, level: "Beginner", swapsCount: 1 });
      modified = true;
    }
  }

  if (modified) {
    await user.save();
  } else if (updates.length) {
    // Do in-place increments if the subdocs exist
    const $inc = {};
    const filters = {};

    updates.forEach((u) => {
      Object.assign($inc, u.update.$inc);
      Object.assign(filters, u.filter);
    });

    const arrayFiltersFinal = [];
    if (offName) arrayFiltersFinal.push({ "so.name": offName });
    if (reqName) arrayFiltersFinal.push({ "sw.name": reqName });

    await User.updateOne(
      { _id: userId },
      { $inc },
      { arrayFilters: arrayFiltersFinal.length ? arrayFiltersFinal : undefined }
    );
  }
}
exports.completeRequest = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only participants can complete
    const currentUserId = String(req.user?._id || req.user?.id || req.user || '');
    const isParticipant = [String(request.from), String(request.to)].includes(currentUserId);
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only accepted requests can be completed
    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be completed' });
    }

    // Mark as completed
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    // Get both users
    const [fromUser, toUser] = await Promise.all([
      User.findById(request.from),
      User.findById(request.to),
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // Helper function to fix typos in skill levels
    const fixSkillLevels = (skills) => {
      if (skills && Array.isArray(skills)) {
        skills.forEach(skill => {
          if (skill.level === 'Intermeditate') {
            skill.level = 'Intermediate';
          }
          // Fix any other potential typos
          if (skill.level === 'Expertt') {
            skill.level = 'Expert';
          }
          if (skill.level === 'Beginnner') {
            skill.level = 'Beginner';
          }
        });
      }
    };

    // Fix any typos in skill levels before validation
    fixSkillLevels(fromUser.skillsOffered);
    fixSkillLevels(fromUser.skillsWanted);
    fixSkillLevels(toUser.skillsOffered);
    fixSkillLevels(toUser.skillsWanted);

    // Helper to safely ensure progress object exists
    const ensureProgress = (user) => {
      if (!user.progress) {
        user.progress = {
          swapsCount: 0,
          offered: new Map(),
          learned: new Map()
        };
      }
      if (!user.progress.offered) {
        user.progress.offered = new Map();
      }
      if (!user.progress.learned) {
        user.progress.learned = new Map();
      }
    };

    // Ensure both users have progress objects
    ensureProgress(fromUser);
    ensureProgress(toUser);

    const offeredName = request.skillOffered?.name?.trim();
    const requestedName = request.skillRequested?.name?.trim();

    // Increment total swaps count for both users
    fromUser.progress.swapsCount = (fromUser.progress.swapsCount || 0) + 1;
    toUser.progress.swapsCount = (toUser.progress.swapsCount || 0) + 1;

    // Update skill-specific counters using Map methods
    if (offeredName) {
      // From user taught this skill, so increment their "offered" count
      const currentOfferedCount = fromUser.progress.offered.get(offeredName) || 0;
      fromUser.progress.offered.set(offeredName, currentOfferedCount + 1);
      
      // To user learned this skill, so increment their "learned" count
      const currentLearnedCount = toUser.progress.learned.get(offeredName) || 0;
      toUser.progress.learned.set(offeredName, currentLearnedCount + 1);
    }

    if (requestedName) {
      // To user taught this skill (if they offered something back), increment their "offered" count
      const currentOfferedCount = toUser.progress.offered.get(requestedName) || 0;
      toUser.progress.offered.set(requestedName, currentOfferedCount + 1);
      
      // From user learned this skill, increment their "learned" count
      const currentLearnedCount = fromUser.progress.learned.get(requestedName) || 0;
      fromUser.progress.learned.set(requestedName, currentLearnedCount + 1);
    }

    // Also update the skillsOffered and skillsWanted arrays with swapsCounts
    if (offeredName) {
      // Update fromUser's skillsOffered
      const offeredSkill = fromUser.skillsOffered.find(skill => skill.name === offeredName);
      if (offeredSkill) {
        offeredSkill.swapsCount = (offeredSkill.swapsCount || 0) + 1;
      }
      
      // Update toUser's skillsWanted (if they wanted this skill)
      const wantedSkill = toUser.skillsWanted.find(skill => skill.name === offeredName);
      if (wantedSkill) {
        wantedSkill.swapsCount = (wantedSkill.swapsCount || 0) + 1;
      }
    }

    if (requestedName) {
      // Update toUser's skillsOffered (if they offered this skill back)
      const offeredSkill = toUser.skillsOffered.find(skill => skill.name === requestedName);
      if (offeredSkill) {
        offeredSkill.swapsCount = (offeredSkill.swapsCount || 0) + 1;
      }
      
      // Update fromUser's skillsWanted
      const wantedSkill = fromUser.skillsWanted.find(skill => skill.name === requestedName);
      if (wantedSkill) {
        wantedSkill.swapsCount = (wantedSkill.swapsCount || 0) + 1;
      }
    }

    // Save both users (now with fixed data)
    await Promise.all([
      fromUser.save(),
      toUser.save()
    ]);

    return res.json({ 
      success: true, 
      message: 'Request marked as completed', 
      request 
    });

  } catch (err) {
    console.error('completeRequest error:', err);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};