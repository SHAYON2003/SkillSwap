// routes/requestRoutes.js
const express = require("express");
const auth = require("../middleware/auth");
const {
  createRequest,
  updateRequestStatus,
  getIncoming,
  getOutgoing,
  getPublicOpen,
  claimPublic,
  completeRequest
} = require("../controllers/requestController");

const requestController = require('../controllers/requestController')
const router = express.Router();

router.post("/create", auth, createRequest);
router.get("/incoming", auth, getIncoming);
router.get("/outgoing", auth, getOutgoing);

// new
router.get("/public", auth, getPublicOpen);
router.post("/:id/claim", auth, claimPublic);


router.get('/public', auth, requestController.getPublicOpen);

router.patch("/:id", auth, updateRequestStatus);
router.patch("/:id/complete", auth, completeRequest);

module.exports = router;
