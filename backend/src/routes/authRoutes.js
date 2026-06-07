const express = require("express");
const router = express.Router();

const {
  register,
  login
} = require("../controllers/authController");

router.get("/login", (req, res) => {
  res.status(200).json({
    message: "This endpoint accepts POST requests only. Send email and password as JSON to POST /api/auth/login",
  });
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;