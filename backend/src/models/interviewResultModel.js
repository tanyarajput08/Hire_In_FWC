const pool = require("../config/db");

const saveInterviewResult = async ({
  applicationId,
  candidateId,
  jobId,
  videoPath,
  transcript,
  communicationScore,
  technicalRelevanceScore,
  confidenceScore,
  overallScore,
  feedback
}) => {
  const result = await pool.query(
    `
    INSERT INTO interview_results
    (
      application_id,
      candidate_id,
      job_id,
      video_path,
      transcript,
      communication_score,
      technical_relevance_score,
      confidence_score,
      overall_score,
      feedback
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      applicationId,
      candidateId,
      jobId,
      videoPath,
      transcript,
      communicationScore,
      technicalRelevanceScore,
      confidenceScore,
      overallScore,
      feedback
    ]
  );

  return result.rows[0];
};

const getInterviewResultByApplication = async (applicationId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM interview_results
    WHERE application_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [applicationId]
  );

  return result.rows[0];
};

module.exports = {
  saveInterviewResult,
  getInterviewResultByApplication
};
