// controllers/messageController.js
const Message = require('../models/message');
const Chat = require('../models/Chat');
const Notification = require('../models/Notification');

// try to require socket helper, but protect against missing file
let getIO = null;
try {
  ({ getIO } = require('../utils/socket'));
} catch (err) {
  // Socket helper not present — controller will function without emits
  getIO = null;
}

function getRequesterId(req) {
  if (!req || !req.user) return null;
  return typeof req.user === 'string' ? req.user : (req.user._id || req.user.id || null);
}

exports.getMessages = async (req, res) => {
  try {
    const meId = getRequesterId(req);
    const { chatId } = req.params;
    if (!chatId) return res.status(400).json({ message: 'chatId required' });

    const chat = await Chat.findById(chatId).lean();
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!meId || !chat.participants.map(p => String(p)).includes(String(meId))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 }).populate('sender', 'username email').lean();
    return res.json(messages);
  } catch (err) {
    console.error('[getMessages] error:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const meId = getRequesterId(req);
    const { chatId } = req.params;
    const { content } = req.body;

    if (!meId) return res.status(401).json({ message: 'Unauthorized' });
    if (!chatId) return res.status(400).json({ message: 'chatId required' });
    if (!content || !content.trim()) return res.status(400).json({ message: 'Message content is required' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const participants = chat.participants.map(p => String(p));
    if (!participants.includes(String(meId))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let msg = await Message.create({
      chat: chatId,
      sender: meId,
      content: content.trim(),
    });

    // populate with sender
    msg = await Message.findById(msg._id).populate('sender', 'username email').lean();

    // update chat meta
    chat.lastMessage = content.trim();
    chat.lastMessageAt = new Date();
    await chat.save();

    // notify recipients (for 1:1 chat we pick the other user; for groups we loop)
    const recipientIds = chat.participants.filter(p => String(p) !== String(meId));

    let notif = null;
    try {
      if (Notification && recipientIds.length) {
        // create a notification for the first recipient (adjust as needed)
        notif = await Notification.create({
          user: recipientIds[0],
          type: 'NEW_MESSAGE',
          title: 'New message',
          body: content.length > 120 ? content.slice(0, 120) + '…' : content,
          data: { chatId, messageId: msg._id, fromUser: meId },
        });
      }
    } catch (nErr) {
      console.error('[sendMessage] notification creation failed', nErr);
    }

    // emit via socket if available
    try {
      const io = typeof getIO === 'function' ? getIO() : null;
      if (io) {
        io.to(`chat:${chatId}`).emit('newMessage', msg);
        recipientIds.forEach(rid => io.to(`user:${rid}`).emit('notification:new', notif || { chatId, messageId: msg._id }));
      }
    } catch (emitErr) {
      console.error('[sendMessage] socket emit error:', emitErr);
    }

    return res.status(201).json(msg);
  } catch (err) {
    console.error('[sendMessage] error:', err);
    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};
