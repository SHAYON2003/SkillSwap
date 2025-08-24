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

const router = express.Router();

router.post("/create", auth, createRequest);
router.get("/incoming", auth, getIncoming);
router.get("/outgoing", auth, getOutgoing);

// Public board (list or search)
router.get("/public", auth, getPublicOpen);

// Claim a public post
router.post("/:id/claim", auth, claimPublic);

// Update status / complete
router.patch("/:id", auth, updateRequestStatus);
router.patch("/:id/complete", auth, completeRequest);

module.exports = router;
