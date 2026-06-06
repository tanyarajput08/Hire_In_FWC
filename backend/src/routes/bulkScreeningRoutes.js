const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {
  bulkScreenResumes,
  getBulkResults
} = require("../controllers/bulkScreeningController");

router.post(
  "/bulk-screen",
  protect,
  authorize("HR"),
  upload.array("resumes", 100),
  bulkScreenResumes
);

router.get(
  "/bulk-screen/:runId/results",
  protect,
  authorize("HR"),
  getBulkResults
);

module.exports = router;
