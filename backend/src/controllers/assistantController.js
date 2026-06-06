const AI = require("../services/aiService");

const askRecruiterAssistant = async (req, res) => {
  try {
    const { question, candidates } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required"
      });
    }

    if (!Array.isArray(candidates)) {
      return res.status(400).json({
        message: "Candidate context must be an array"
      });
    }

    const answer = await AI.askRecruiterAssistant(question, candidates);
    res.json(answer);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.response?.data?.detail || error.message || "Server Error"
    });
  }
};

module.exports = {
  askRecruiterAssistant
};
