// controllers/chatController.js
const Chat = require('../models/Chat');
const SkillRequest = require('../models/SkillRequest');

async function createOrGetChat(req, res) {
  try {
    const me = req.user;
    const { recipientId } = req.body;

    if (!recipientId) return res.status(400).json({ message: 'recipientId is required' });

    // ensure there is an accepted skill request between the two users
    const accepted = await SkillRequest.findOne({
      $or: [
        { from: me, to: recipientId, status: 'accepted' },
        { from: recipientId, to: me, status: 'accepted' }
      ]
    });

    if (!accepted) {
      return res.status(403).json({ message: 'No accepted skill exchange found' });
    }

    let chat = await Chat.findOne({ participants: { $all: [me, recipientId] } });
    if (!chat) {
      chat = await Chat.create({ participants: [me, recipientId] });
    }

    return res.json(chat);
  } catch (err) {
    console.error('[chatController.createOrGetChat] error:', err);
    return res.status(500).json({ message: err.message });
  }
}

async function getMyChats(req, res) {
  try {
    const me = req.user;
    const chats = await Chat.find({ participants: me })
      .sort({ lastMessageAt: -1 })                   // sort by timestamp
      .populate('participants', 'username email');   // correct spelling
    return res.json(chats);
  } catch (err) {
    console.error('[chatController.getMyChats] error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createOrGetChat,
  getMyChats
};
