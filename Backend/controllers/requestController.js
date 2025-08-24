// controllers/requestController.js
const SkillRequest = require("../models/SkillRequest");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");
const { getIO } = require("../socket");
const User = require('../models/User');

function getRequesterId(req) {
  // Normalize to a plain string id, covering all shapes
  return String(req.userId || (req.userObj && req.userObj.id) || req.auth?.id || req.user || '');
}

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
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ success: false, message: 'Not authenticated' });

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
        return res.status(400).json({ success: false, message: "Provide the skill you want to offer" });
      }
    } else if (type === "learn") {
      if (!requestedName) {
        return res.status(400).json({ success: false, message: "Provide the skill you want to learn" });
      }
    } else if (type === "direct") {
      const hasSomeSkill = offeredName || requestedName;
      if (!to || !hasSomeSkill) {
        return res.status(400).json({
          success: false,
          message: "Direct request needs a target user and at least one skill",
        });
      }
      if (String(to) === String(requesterId)) {
        return res.status(400).json({ success: false, message: "You cannot send request to yourself" });
      }
      // avoid duplicate pending between these two
      const existing = await SkillRequest.findOne({
        $or: [
          { from: requesterId, to, status: "pending" },
          { from: to, to: requesterId, status: "pending" },
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
      from: requesterId,
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
          body: (offeredName || "—") + " ⇄ " + (requestedName || "—"),
          data: { requestId: request._id, fromUser: requesterId },
        },
        to
      );
    }

    return res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('createRequest error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Claim a public (open) post -> becomes a pending direct request
exports.claimPublic = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const reqId = req.params.id;
    const doc = await SkillRequest.findById(reqId);
    if (!doc) return res.status(404).json({ success: false, message: "Request not found" });

    if (doc.visibility !== "public" || doc.status !== "open") {
      return res.status(400).json({ success: false, message: "This post is not open for claiming" });
    }

    if (String(doc.from) === String(requesterId)) {
      return res.status(400).json({ success: false, message: "You cannot claim your own post" });
    }

    // turn into a direct pending request
    doc.to = requesterId;
    doc.visibility = "direct";
    doc.status = "pending";
    await doc.save();

    // notify author
    await safeNotify(
      {
        user: doc.from,
        type: "REQUEST_RECEIVED",
        title: "Someone responded to your post",
        body: (doc.skillOffered?.name || "—") + " ⇄ " + (doc.skillRequested?.name || "—"),
        data: { requestId: doc._id, fromUser: requesterId },
      },
      doc.from
    );

    return res.json({ success: true, message: "Claimed", request: doc });
  } catch (err) {
    console.error('claimPublic error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// B: accept / reject; A: cancel; complete
exports.updateRequestStatus = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { action } = req.body;
    const reqId = req.params.id;

    const doc = await SkillRequest.findById(reqId);
    if (!doc) return res.status(404).json({ success: false, message: "Request not found" });

    // Accept / Reject (only receiver can do these)
    if (["accept", "reject"].includes(action)) {
      if (String(doc.to) !== String(requesterId)) {
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
      if (String(doc.from) !== String(requesterId)) {
        return res.status(403).json({ success: false, message: "Not allowed" });
      }
      doc.status = "cancelled";
      await doc.save();
      return res.json({ success: true, message: "Cancelled", request: doc });
    }

    // Complete → redirect to completeRequest handler for consistency
    if (action === "complete") {
      req.params.id = reqId;
      return exports.completeRequest(req, res);
    }

    return res.status(400).json({ success: false, message: "Invalid action" });
  } catch (err) {
    console.error('updateRequestStatus error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// B: list incoming (direct only)
exports.getIncoming = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const list = await SkillRequest.find({ to: requesterId })
      .populate("from", "username email avatar")
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests: list });
  } catch (err) {
    console.error('getIncoming error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// A: list outgoing (includes your open public posts)
exports.getOutgoing = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const list = await SkillRequest.find({ from: requesterId })
      .populate("to", "username email avatar")
      .sort({ createdAt: -1 });

    return res.json({ success: true, requests: list });
  } catch (err) {
    console.error('getOutgoing error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

function escapeRegex(str = '') {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

exports.getPublicOpen = async (req, res) => {
  try {
    const requesterId = getRequesterId(req);
    const { skill, type = 'offered' } = req.query || {};

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
  const offName = (offeredName || '').trim();
  const reqName = (requestedName || '').trim();

  const user = await User.findById(userId);
  if (!user) return;

  let modified = false;

  if (offName) {
    const idx = (user.skillsOffered || []).findIndex(s => (s?.name || '').toLowerCase() === offName.toLowerCase());
    if (idx === -1) {
      user.skillsOffered.push({ name: offName, level: "Beginner", swapsCount: 1 });
      modified = true;
    } else {
      user.skillsOffered[idx].swapsCount = (user.skillsOffered[idx].swapsCount || 0) + 1;
    }
  }

  if (reqName) {
    const idx = (user.skillsWanted || []).findIndex(s => (s?.name || '').toLowerCase() === reqName.toLowerCase());
    if (idx === -1) {
      user.skillsWanted.push({ name: reqName, level: "Beginner", swapsCount: 1 });
      modified = true;
    } else {
      user.skillsWanted[idx].swapsCount = (user.skillsWanted[idx].swapsCount || 0) + 1;
    }
  }

  if (modified) await user.save();
}

exports.completeRequest = async (req, res) => {
  try {
    const request = await SkillRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const currentUserId = String(req.userId || req.user || '');
    const isParticipant = [String(request.from), String(request.to)].includes(currentUserId);
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted requests can be completed' });
    }

    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();

    const [fromUser, toUser] = await Promise.all([
      User.findById(request.from),
      User.findById(request.to),
    ]);
    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'One or both users not found' });
    }

    // ensure progress objects are plain JSON
    const ensureProgress = (user) => {
      if (!user.progress) {
        user.progress = { swapsCount: 0, offered: {}, learned: {} };
      }
      if (!user.progress.offered) user.progress.offered = {};
      if (!user.progress.learned) user.progress.learned = {};
    };

    ensureProgress(fromUser);
    ensureProgress(toUser);

    const offeredName = request.skillOffered?.name?.trim();
    const requestedName = request.skillRequested?.name?.trim();

    // total swaps
    fromUser.progress.swapsCount = (fromUser.progress.swapsCount || 0) + 1;
    toUser.progress.swapsCount = (toUser.progress.swapsCount || 0) + 1;

    // Offered skill → increment fromUser.offered, toUser.learned
    if (offeredName) {
      fromUser.progress.offered[offeredName] = (fromUser.progress.offered[offeredName] || 0) + 1;
      toUser.progress.learned[offeredName] = (toUser.progress.learned[offeredName] || 0) + 1;
    }

    // Requested skill → increment toUser.offered, fromUser.learned
    if (requestedName) {
      toUser.progress.offered[requestedName] = (toUser.progress.offered[requestedName] || 0) + 1;
      fromUser.progress.learned[requestedName] = (fromUser.progress.learned[requestedName] || 0) + 1;
    }

    // Also update skillsOffered / skillsWanted arrays
    if (offeredName) {
      const offeredSkill = fromUser.skillsOffered.find(s => s.name === offeredName);
      if (offeredSkill) offeredSkill.swapsCount = (offeredSkill.swapsCount || 0) + 1;

      const wantedSkill = toUser.skillsWanted.find(s => s.name === offeredName);
      if (wantedSkill) wantedSkill.swapsCount = (wantedSkill.swapsCount || 0) + 1;
    }
    if (requestedName) {
      const offeredSkill = toUser.skillsOffered.find(s => s.name === requestedName);
      if (offeredSkill) offeredSkill.swapsCount = (offeredSkill.swapsCount || 0) + 1;

      const wantedSkill = fromUser.skillsWanted.find(s => s.name === requestedName);
      if (wantedSkill) wantedSkill.swapsCount = (wantedSkill.swapsCount || 0) + 1;
    }

    await Promise.all([fromUser.save(), toUser.save()]);

    return res.json({ success: true, message: 'Request marked as completed', request });
  } catch (err) {
    console.error('completeRequest error:', err);
    return res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
