const axios = require("axios");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:8000";

const analyzeResume = async (resumeText, jobDescription) => {
  const response = await axios.post(`${AI_ENGINE_URL}/match`, {
    resume_text: resumeText,
    job_description: jobDescription
  });
  return response.data;
};

const analyzePDF = async (pdfPath, jobDescription) => {
  const response = await axios.post(`${AI_ENGINE_URL}/screen-pdf`, {
    pdf_path: pdfPath,
    job_description: jobDescription
  });
  return response.data;
};

const analyzeInterviewTranscript = async (transcript, jobDescription) => {
  const response = await axios.post(`${AI_ENGINE_URL}/analyze-interview`, {
    transcript,
    job_description: jobDescription
  });
  return response.data;
};

const analyzeInterviewVideo = async (videoPath, jobDescription) => {
  const response = await axios.post(`${AI_ENGINE_URL}/analyze-interview-video`, {
    video_path: videoPath,
    job_description: jobDescription
  });
  return response.data;
};

const askRecruiterAssistant = async (question, candidates) => {
  const response = await axios.post(`${AI_ENGINE_URL}/recruiter-assistant`, {
    question,
    candidates
  });
  return response.data;
};

const generateCandidateSummary = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
  const response = await axios.post(`${AI_ENGINE_URL}/candidate-summary`, {
    resume_text: resumeText,
    job_description: jobDescription,
    score,
    matched_skills: matchedSkills,
    missing_skills: missingSkills
  });
  return response.data;
};

const explainScore = async ({
  resumeText,
  jobDescription,
  score,
  matchedSkills,
  missingSkills
}) => {
  const response = await axios.post(`${AI_ENGINE_URL}/explain-score`, {
    resume_text: resumeText,
    job_description: jobDescription,
    score,
    matched_skills: matchedSkills,
    missing_skills: missingSkills
  });
  return response.data;
};

const compareCandidates = async ({
  candidateA,
  candidateB,
  jobDescription
}) => {
  const response = await axios.post(`${AI_ENGINE_URL}/compare-candidates`, {
    candidate_a: candidateA,
    candidate_b: candidateB,
    job_description: jobDescription
  });
  return response.data;
};

const extractPDFText = async (pdfPath) => {
  const response = await axios.post(`${AI_ENGINE_URL}/extract-text-path`, {
    pdf_path: pdfPath
  });
  return response.data;
};

module.exports = {
  analyzeResume,
  analyzePDF,
  analyzeInterviewTranscript,
  analyzeInterviewVideo,
  askRecruiterAssistant,
  generateCandidateSummary,
  explainScore,
  compareCandidates,
  extractPDFText
};
