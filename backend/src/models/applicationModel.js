const pool = require("../config/db");

const APPLICATION_STATUSES = [
  "APPLIED",
  "SCREENED",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "REJECTED"
];

const getApplicationByIdForCandidate = async (applicationId, candidateId) => {
  const result = await pool.query(
    `
    SELECT
      a.*,
      j.title AS job_title,
      j.description AS job_description,
      j.skills_required,
      j.application_close_at,
      j.type AS job_type,
      j.mode AS job_mode,
      j.auto_screen
    FROM applications a
    JOIN jobs j
      ON a.job_id = j.id
    WHERE a.id = $1
      AND a.candidate_id = $2
    `,
    [applicationId, candidateId]
  );

  return result.rows[0];
};

const hasAppliedToJob = async (candidateId, jobId) => {
  const result = await pool.query(
    `
    SELECT id
    FROM applications
    WHERE candidate_id = $1
      AND job_id = $2
    LIMIT 1
    `,
    [candidateId, jobId]
  );

  return result.rows.length > 0;
};

const applyJob = async (candidate_id, job_id) => {
  const existing = await hasAppliedToJob(candidate_id, job_id);
  if (existing) {
    throw new Error("You have already applied to this job");
  }

  const result = await pool.query(
    `
    INSERT INTO applications
    (candidate_id, job_id, status)
    VALUES ($1, $2, 'APPLIED')
    RETURNING *
    `,
    [candidate_id, job_id]
  );

  return result.rows[0];
};

const updateScore = async (applicationId, score, matchedSkills = [], missingSkills = [], summary = null) => {
  const result = await pool.query(
    `
    UPDATE applications
    SET score = $1,
        status = 'SCREENED',
        matched_skills = $2,
        missing_skills = $3,
        summary = $4,
        updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [score, matchedSkills, missingSkills, summary ? JSON.stringify(summary) : null, applicationId]
  );

  return result.rows[0];
};

const clearScreening = async (applicationId) => {
  const result = await pool.query(
    `
    UPDATE applications
    SET score = NULL,
        matched_skills = '{}',
        missing_skills = '{}',
        summary = NULL,
        status = 'APPLIED',
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [applicationId]
  );

  return result.rows[0];
};

const getApplicationDetails = async (applicationId) => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.status,
      a.score,
      a.matched_skills,
      a.missing_skills,
      a.summary,
      u.name AS candidate_name,
      j.description,
      j.skills_required,
      r.file_path AS resume_file_path
    FROM applications a
    JOIN jobs j
      ON a.job_id = j.id
    JOIN users u
      ON a.candidate_id = u.id
    LEFT JOIN resumes r
      ON r.application_id = a.id
    WHERE a.id = $1
    `,
    [applicationId]
  );

  return result.rows[0];
};

const getApplicationsByCandidate = async (candidateId) => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.status,
      a.score,
      a.matched_skills,
      a.missing_skills,
      a.summary,
      a.updated_at AS created_at,
      a.updated_at,
      j.id AS job_id,
      j.title AS job_title,
      j.description AS job_description,
      j.skills_required,
      j.type AS job_type,
      j.mode AS job_mode,
      j.application_close_at,
      r.id AS resume_id,
      r.file_path AS resume_file_path
    FROM applications a
    JOIN jobs j
      ON a.job_id = j.id
    LEFT JOIN resumes r
      ON r.application_id = a.id
    WHERE a.candidate_id = $1
    ORDER BY a.updated_at DESC NULLS LAST, a.id DESC
    `,
    [candidateId]
  );

  return result.rows;
};

const getApplicationsByJob = async (jobId) => {
  const result = await pool.query(
    `
    SELECT
      a.id,
      a.status,
      a.score,
      a.matched_skills,
      a.missing_skills,
      a.summary,
      a.updated_at AS created_at,
      a.updated_at,
      a.job_id,
      u.id AS candidate_id,
      u.name AS candidate_name,
      u.email AS candidate_email,
      r.id AS resume_id,
      r.file_path AS resume_file_path,
      j.title AS job_title,
      j.description AS job_description,
      j.skills_required,
      j.application_close_at
    FROM applications a
    JOIN users u
      ON a.candidate_id = u.id
    JOIN jobs j
      ON a.job_id = j.id
    LEFT JOIN resumes r
      ON r.application_id = a.id
    WHERE a.job_id = $1
    ORDER BY a.score DESC NULLS LAST, a.updated_at DESC NULLS LAST, a.id DESC
    `,
    [jobId]
  );

  return result.rows;
};

const updateStatus = async (applicationId, status) => {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new Error("Invalid application status");
  }

  const result = await pool.query(
    `
    UPDATE applications
    SET status = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, applicationId]
  );

  return result.rows[0];
};

const getRankingsByJob = async (jobId) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      a.id AS application_id,
      a.job_id,
      a.score,
      a.status,
      a.matched_skills,
      a.missing_skills,
      a.summary,
      a.updated_at,
      r.file_path AS resume_file_path,
      j.title AS job_title,
      j.description AS job_description,
      j.skills_required
    FROM applications a
    JOIN users u
      ON a.candidate_id = u.id
    JOIN jobs j
      ON a.job_id = j.id
    LEFT JOIN resumes r
      ON r.application_id = a.id
    WHERE a.job_id = $1
    ORDER BY a.score DESC
    `,
    [jobId]
  );

  return result.rows;
};

module.exports = {
  APPLICATION_STATUSES,
  applyJob,
  hasAppliedToJob,
  getApplicationByIdForCandidate,
  updateScore,
  clearScreening,
  getApplicationDetails,
  getApplicationsByCandidate,
  getApplicationsByJob,
  updateStatus,
  getRankingsByJob
};
