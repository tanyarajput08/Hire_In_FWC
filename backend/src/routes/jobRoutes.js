const express = require("express");

const router = express.Router();

const {
  createJob,
  getJobs
} = require("../controllers/jobController");

const protect =
require("../middleware/authMiddleware");

const authorize =
require("../middleware/roleMiddleware");

router.post(
  "/jobs",
  protect,
  authorize("HR"),
  createJob
);

router.get(
  "/jobs",
  protect,
  getJobs
);

module.exports = router;