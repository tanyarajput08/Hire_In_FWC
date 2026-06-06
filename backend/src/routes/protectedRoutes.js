const express = require("express");

const protect = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/hr-dashboard",
  protect,
  authorize("HR"),
  (req, res) => {

    res.json({
      success: true,
      message: "Welcome HR"
    });

  }
);

router.get(
  "/candidate-dashboard",
  protect,
  authorize("CANDIDATE"),
  (req, res) => {

    res.json({
      success: true,
      message: "Welcome Candidate"
    });

  }
);

module.exports = router;