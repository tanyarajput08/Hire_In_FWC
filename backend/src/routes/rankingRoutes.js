const express = require("express");
const router = express.Router();
const { getRankings } = require("../controllers/rankingController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.get(
  "/jobs/:jobId/rankings",
  protect,
  authorize("HR"),
  getRankings
);

module.exports = router;
