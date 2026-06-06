const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {
  analyzeInterview,
  getInterviewResult
} = require("../controllers/interviewController");

router.post(
  "/interviews/analyze",
  protect,
  authorize("CANDIDATE", "Candidate", "HR"),
  upload.single("answer_video"),
  analyzeInterview
);

router.get(
  "/applications/:applicationId/interview-result",
  protect,
  authorize("CANDIDATE", "Candidate", "HR"),
  getInterviewResult
);

module.exports = router;
