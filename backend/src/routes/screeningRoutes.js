const express = require("express");
const router = express.Router();
const {
  screenCandidate,
  getScoreJustification,
  compareCandidateScores
} = require("../controllers/screeningController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post(
  "/screen",
  protect,
  authorize("HR"),
  screenCandidate
);

router.get(
  "/applications/:applicationId/justification",
  protect,
  authorize("HR"),
  getScoreJustification
);

router.get(
  "/applications/:applicationId/compare/:otherApplicationId",
  protect,
  authorize("HR"),
  compareCandidateScores
);

module.exports = router;
