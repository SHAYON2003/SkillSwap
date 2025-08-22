// routes/progressRoutes.js
const express = require("express");
const auth = require("../middleware/auth");
const { getProgress } = require("../controllers/progressController");

const router = express.Router();

router.get("/", auth, getProgress);

module.exports = router;
