const express = require("express")
const auth = require("../middleware/auth")
const {searchBySkill , getCompatibleMatches}  = require("../controllers/matchController")


const router = express.Router()
router.get("/search",auth,searchBySkill)
router.get("/compatible", auth, getCompatibleMatches)

module.exports = router
