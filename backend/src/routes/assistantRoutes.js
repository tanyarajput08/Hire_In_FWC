const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {
  askRecruiterAssistant
} = require("../controllers/assistantController");

router.post(
  "/assistant/recruiter",
  protect,
  authorize("HR"),
  askRecruiterAssistant
);

module.exports = router;
