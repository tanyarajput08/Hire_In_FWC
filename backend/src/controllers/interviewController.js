const path = require("path");
const AI = require("../services/aiService");
const InterviewResult = require("../models/interviewResultModel");

const analyzeInterview = async (req, res) => {
  try {
    const {
      application_id,
      job_id,
      job_description,
      transcript
    } = req.body;

    if (!application_id || !job_description) {
      return res.status(400).json({
        message: "Application ID and job description are required"
      });
    }

    let analysis;

    if (transcript) {
      analysis = await AI.analyzeInterviewTranscript(
        transcript,
        job_description
      );
    } else if (req.file) {
      analysis = await AI.analyzeInterviewVideo(
        path.resolve(req.file.path),
        job_description
      );
    } else {
      return res.status(400).json({
        message: "Upload a video or provide a transcript"
      });
    }

    const saved = await InterviewResult.saveInterviewResult({
      applicationId: application_id,
      candidateId: req.user.id,
      jobId: job_id || null,
      videoPath: req.file?.path || null,
      transcript: analysis.transcript || transcript,
      communicationScore: analysis.communication_score,
      technicalRelevanceScore: analysis.technical_relevance_score,
      confidenceScore: analysis.confidence_score,
      overallScore: analysis.overall_score,
      feedback: analysis.feedback || null
    });

    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.response?.data?.detail || error.message || "Server Error"
    });
  }
};

const getInterviewResult = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const result = await InterviewResult.getInterviewResultByApplication(applicationId);

    if (!result) {
      return res.status(404).json({
        message: "Interview result not found"
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  analyzeInterview,
  getInterviewResult
};
