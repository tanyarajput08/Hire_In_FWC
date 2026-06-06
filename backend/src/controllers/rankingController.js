const Application = require("../models/applicationModel");

const getRankings = async (req, res) => {
  try {
    const { jobId } = req.params;

    const rankings = await Application.getRankingsByJob(jobId);

    const rankedCandidates = rankings.map((candidate, index) => ({
      rank: index + 1,
      ...candidate
    }));

    res.json(rankedCandidates);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  getRankings
};
