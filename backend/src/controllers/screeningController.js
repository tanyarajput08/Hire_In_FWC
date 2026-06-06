const path = require("path");
const Resume = require("../models/resumeModel");
const Application = require("../models/applicationModel");
const AI = require("../services/aiService");

const screenApplicationInternal = async (applicationId) => {
  const resume = await Resume.getResumeByApplication(applicationId);
  if (!resume) {
    throw new Error("Resume not found for this application");
  }

  const application = await Application.getApplicationDetails(applicationId);
  if (!application) {
    throw new Error("Application details not found");
  }

  const absoluteResumePath = path.resolve(resume.file_path);

  const screeningContext = [
    application.description,
    application.skills_required
      ? `Required skills: ${application.skills_required}`
      : null
  ].filter(Boolean).join("\n\n");

  const result = await AI.analyzePDF(
    absoluteResumePath,
    screeningContext
  );

  await Application.updateScore(
    applicationId,
    result.score,
    result.matched_skills || [],
    result.missing_skills || [],
    result.summary || null
  );

  return result;
};

const screenCandidate = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const result = await screenApplicationInternal(applicationId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Server Error"
    });
  }
};

const getScoreJustification = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.getApplicationDetails(applicationId);

    if (!application) {
      return res.status(404).json({
        message: "Application details not found"
      });
    }

    if (application.score === null || application.score === undefined) {
      return res.status(400).json({
        message: "Candidate must be screened first before explaining score"
      });
    }

    let resumeText = "";
    if (application.resume_file_path) {
      try {
        const absolutePath = path.resolve(application.resume_file_path);
        const parsed = await AI.extractPDFText(absolutePath);
        resumeText = parsed.text || "";
      } catch (err) {
        console.error("Failed to parse resume text:", err);
      }
    }

    const explanation = await AI.explainScore({
      resumeText,
      jobDescription: application.description,
      score: Number(application.score),
      matchedSkills: application.matched_skills || [],
      missingSkills: application.missing_skills || []
    });

    res.json(explanation);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

const compareCandidateScores = async (req, res) => {
  try {
    const { applicationId, otherApplicationId } = req.params;

    const candidateA = await Application.getApplicationDetails(applicationId);
    const candidateB = await Application.getApplicationDetails(otherApplicationId);

    if (!candidateA || !candidateB) {
      return res.status(404).json({
        message: "One or both application details not found"
      });
    }

    if (candidateA.score === null || candidateB.score === null) {
      return res.status(400).json({
        message: "Both candidates must be screened before comparison"
      });
    }

    let textA = "";
    if (candidateA.resume_file_path) {
      try {
        const absolutePath = path.resolve(candidateA.resume_file_path);
        const parsed = await AI.extractPDFText(absolutePath);
        textA = parsed.text || "";
      } catch (err) {
        console.error("Failed to parse resume text A:", err);
      }
    }

    let textB = "";
    if (candidateB.resume_file_path) {
      try {
        const absolutePath = path.resolve(candidateB.resume_file_path);
        const parsed = await AI.extractPDFText(absolutePath);
        textB = parsed.text || "";
      } catch (err) {
        console.error("Failed to parse resume text B:", err);
      }
    }

    const comparison = await AI.compareCandidates({
      candidateA: {
        name: candidateA.candidate_name || "Candidate A",
        score: Number(candidateA.score),
        matched_skills: candidateA.matched_skills || [],
        missing_skills: candidateA.missing_skills || [],
        resume_text: textA
      },
      candidateB: {
        name: candidateB.candidate_name || "Candidate B",
        score: Number(candidateB.score),
        matched_skills: candidateB.matched_skills || [],
        missing_skills: candidateB.missing_skills || [],
        resume_text: textB
      },
      jobDescription: candidateA.description || candidateB.description
    });

    res.json(comparison);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  screenCandidate,
  screenApplicationInternal,
  getScoreJustification,
  compareCandidateScores
};
