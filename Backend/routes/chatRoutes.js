const router = require('express').Router()
const auth = require('../middleware/auth')
const {createOrGetChat , getMyChats} = require('../controllers/chatController')

router.post('/',auth, createOrGetChat)
router.get('/',auth, getMyChats)

module.exports = router
