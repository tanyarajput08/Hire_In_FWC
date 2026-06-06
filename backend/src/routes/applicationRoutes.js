const express = require("express");
const router = express.Router();

const {
  applyJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus
} = require("../controllers/applicationController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Allow both "CANDIDATE" and "Candidate" for robustness
router.post(
  "/applications",
  protect,
  authorize("CANDIDATE", "Candidate"),
  applyJob
);

router.get(
  "/applications/me",
  protect,
  authorize("CANDIDATE", "Candidate"),
  getMyApplications
);

router.get(
  "/jobs/:jobId/applications",
  protect,
  authorize("HR"),
  getJobApplications
);

router.patch(
  "/applications/:applicationId/status",
  protect,
  authorize("HR"),
  updateApplicationStatus
);

module.exports = router;
