const express = require("express");

const router = express.Router();

const upload =
require("../config/multer");

const protect =
require("../middleware/authMiddleware");

const authorize =
require("../middleware/roleMiddleware");

const {
  uploadResume,
  previewResume,
  deleteResume
} = require("../controllers/resumeController");

router.post(
  "/upload-resume",
  protect,
  authorize("CANDIDATE", "Candidate"),
  upload.single("resume"),
  uploadResume
);

router.get(
  "/applications/:applicationId/resume-preview",
  protect,
  authorize("HR", "CANDIDATE", "Candidate"),
  previewResume
);

router.delete(
  "/applications/:applicationId/resume",
  protect,
  authorize("CANDIDATE", "Candidate"),
  deleteResume
);

module.exports = router;
