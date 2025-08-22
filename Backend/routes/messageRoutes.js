const router = require('express').Router()
const auth  = require('../middleware/auth')
const {sendMessage , getMessages } = require('../controllers/messageController')

router.get('/:chatId',auth,getMessages)
router.post('/:chatId',auth,sendMessage)

module.exports = router
