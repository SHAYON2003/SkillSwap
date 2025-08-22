const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const onlineMap = new Map(); // userId => Set of socketIds
const socketUserMap = new Map(); // socketId => { userId, socket }
const activeCalls = new Map();
const callTimers = new Map(); // Track call timeouts

function addOnline(userId, socketId, socket) {
  const set = onlineMap.get(userId) || new Set();
  set.add(socketId);
  onlineMap.set(userId, set);
  socketUserMap.set(socketId, { userId, socket });
}

function removeOnline(userId, socketId) {
  const set = onlineMap.get(userId);
  if (!set) return;
  set.delete(socketId);
  socketUserMap.delete(socketId);

  if (set.size === 0) {
    onlineMap.delete(userId);
  } else {
    onlineMap.set(userId, set);
  }
}

function getOnlineUsers() {
  return Array.from(onlineMap.keys());
}

function getUserSockets(userId) {
  const socketIds = onlineMap.get(userId);
  if (!socketIds) return [];
  return Array.from(socketIds)
    .map(id => socketUserMap.get(id)?.socket)
    .filter(Boolean);
}

function cleanupCall(callId) {
  activeCalls.delete(callId);
  if (callTimers.has(callId)) {
    clearTimeout(callTimers.get(callId));
    callTimers.delete(callId);
  }
}

function init(httpServer) {
  const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(s => s.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (FRONTEND_ORIGINS.includes(origin)) return cb(null, true);
        return cb(new Error('CORS not allowed'));
      },
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    allowUpgrades: true
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.id || decoded._id || decoded);
      try {
        const user = await User.findById(socket.userId);
        socket.username = user?.username || user?.name || 'Unknown User';
        socket.userInfo = user;
      } catch (err) {
        console.warn('Could not fetch user info:', err.message);
        socket.username = 'Unknown User';
      }
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    const username = socket.username;

    console.log(`🔌 User ${username} (${uid}) connected with socket ${socket.id}`);

    addOnline(uid, socket.id, socket);
    socket.join(`user:${uid}`);

    io.emit('presence:update', { userId: uid, online: true });

    // Chat events
    socket.on('join', (room) => socket.join(room));
    socket.on('joinChat', (chatId) => socket.join(`chat:${chatId}`));
    socket.on('leaveChat', (chatId) => socket.leave(`chat:${chatId}`));
    socket.on('typing', ({ chatId }) => socket.to(`chat:${chatId}`).emit('typing', { userId: uid }));
    socket.on('stopTyping', ({ chatId }) => socket.to(`chat:${chatId}`).emit('stopTyping', { userId: uid }));
    socket.on('getOnlineUsers', () => socket.emit('onlineUsers', getOnlineUsers()));

    // === WebRTC Calls ===
    socket.on('webrtc:call-request', ({ toUserId, type = 'audio' }) => {
      console.log(`📞 Call request from ${uid} to ${toUserId}, type: ${type}`);

      if (toUserId === uid) {
        socket.emit('webrtc:call-failed', { reason: "You can't call yourself", code: 'SELF_CALL' });
        return;
      }

      if (!onlineMap.has(toUserId)) {
        socket.emit('webrtc:call-failed', { reason: 'User is offline', code: 'USER_OFFLINE' });
        return;
      }

      const targetSockets = getUserSockets(toUserId);
      if (targetSockets.length === 0) {
        socket.emit('webrtc:call-failed', { reason: 'User connection not found', code: 'USER_DISCONNECTED' });
        return;
      }

      // Check if already in call
      const busy = Array.from(activeCalls.values()).some(
        call => [uid, toUserId].includes(call.callerId) || [uid, toUserId].includes(call.calleeId)
      );
      if (busy) {
        socket.emit('webrtc:call-failed', { reason: 'Already in a call', code: 'USER_BUSY' });
        return;
      }

      const callId = `${uid}-${toUserId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      activeCalls.set(callId, { callerId: uid, calleeId: toUserId, type, startTime: Date.now(), status: 'ringing' });

      targetSockets.forEach(s =>
        s.emit('webrtc:call-request', { fromUserId: uid, fromUsername: username, callId, type })
      );
      socket.emit('webrtc:call-initiated', { toUserId, callId, type });

      // Timeout
      const timeout = setTimeout(() => {
        const call = activeCalls.get(callId);
        if (call && call.status === 'ringing') {
          cleanupCall(callId);
          socket.emit('webrtc:call-failed', { reason: 'Call timed out', code: 'TIMEOUT' });
          targetSockets.forEach(s => s.emit('webrtc:call-ended', { fromUserId: uid, callId, reason: 'timeout' }));
        }
      }, 30000);
      callTimers.set(callId, timeout);
    });

    socket.on('webrtc:call-accepted', ({ toUserId, callId, type }) => {
      const call = activeCalls.get(callId);
      if (!call || call.calleeId !== uid) {
        socket.emit('webrtc:call-failed', { reason: 'Invalid call session', code: 'INVALID_CALL' });
        return;
      }

      cleanupCall(callId); // clear ringing timeout

      call.status = 'accepted';
      call.acceptTime = Date.now();
      activeCalls.set(callId, call);

      getUserSockets(toUserId).forEach(s =>
        s.emit('webrtc:call-accepted', { fromUserId: uid, fromUsername: username, callId, type: type || call.type })
      );
    });

    socket.on('webrtc:call-rejected', ({ toUserId, callId }) => {
      cleanupCall(callId);
      getUserSockets(toUserId).forEach(s =>
        s.emit('webrtc:call-rejected', { fromUserId: uid, fromUsername: username, callId })
      );
    });

    socket.on('webrtc:call-ended', ({ toUserId, callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'ended';
        call.endTime = Date.now();
        call.endedBy = uid;
        cleanupCall(callId);
      }
      getUserSockets(toUserId).forEach(s =>
        s.emit('webrtc:call-ended', { fromUserId: uid, fromUsername: username, callId })
      );
    });

    // === Signaling (with validation) ===
    function validateActiveCall(toUserId) {
      return Array.from(activeCalls.values()).find(
        c => (c.callerId === uid && c.calleeId === toUserId) || (c.callerId === toUserId && c.calleeId === uid)
      );
    }

    socket.on('webrtc:offer', ({ toUserId, offer }) => {
      if (!validateActiveCall(toUserId)) return;
      getUserSockets(toUserId).forEach(s => s.emit('webrtc:offer', { fromUserId: uid, fromUsername: username, offer }));
    });

    socket.on('webrtc:answer', ({ toUserId, answer }) => {
      const call = validateActiveCall(toUserId);
      if (!call) return;
      call.status = 'connected';
      call.connectTime = Date.now();
      getUserSockets(toUserId).forEach(s => s.emit('webrtc:answer', { fromUserId: uid, fromUsername: username, answer }));
    });

    socket.on('webrtc:ice-candidate', ({ toUserId, candidate }) => {
      if (!validateActiveCall(toUserId)) return;
      getUserSockets(toUserId).forEach(s => s.emit('webrtc:ice-candidate', { fromUserId: uid, candidate }));
    });

    socket.on('webrtc:ping', ({ toUserId }) => {
      const isOnline = getUserSockets(toUserId).length > 0;
      socket.emit('webrtc:ping-response', { toUserId, online: isOnline });
    });

    // === Disconnect ===
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [callId, call] of activeCalls.entries()) {
        if (now - call.startTime > 5 * 60 * 1000 && call.status === 'ringing') {
          cleanupCall(callId);
          getUserSockets(call.callerId).forEach(s => s.emit('webrtc:call-ended', { callId, reason: 'cleanup' }));
          getUserSockets(call.calleeId).forEach(s => s.emit('webrtc:call-ended', { callId, reason: 'cleanup' }));
        }
      }
    }, 60000);

    socket.on('disconnect', async (reason) => {
      console.log(`🔌 User ${username} (${uid}) disconnected: ${reason}`);
      clearInterval(cleanupInterval);

      // End calls
      for (const [callId, call] of activeCalls.entries()) {
        if (call.callerId === uid || call.calleeId === uid) {
          const otherId = call.callerId === uid ? call.calleeId : call.callerId;
          getUserSockets(otherId).forEach(s =>
            s.emit('webrtc:call-ended', { fromUserId: uid, callId, reason: 'user_disconnected' })
          );
          cleanupCall(callId);
        }
      }

      removeOnline(uid, socket.id);

      try {
        await User.findByIdAndUpdate(uid, { lastSeen: new Date(), isOnline: false });
      } catch (e) {
        console.warn('Could not update user status:', e.message);
      }

      io.emit('presence:update', { userId: uid, online: onlineMap.has(uid) });
    });

    socket.on('error', (error) => {
      console.error(`🚨 Socket error for user ${uid}:`, error.message);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

function getServerStats() {
  return {
    connectedUsers: onlineMap.size,
    activeCalls: activeCalls.size,
    totalSockets: io ? io.engine.clientsCount : 0,
    callDetails: Array.from(activeCalls.entries()).map(([callId, call]) => ({
      callId,
      participants: [call.callerId, call.calleeId],
      type: call.type,
      status: call.status,
      duration: call.connectTime ? Date.now() - call.connectTime : null,
      age: Date.now() - call.startTime
    }))
  };
}

module.exports = { init, getIO, getOnlineUsers, getUserSockets, getServerStats };
