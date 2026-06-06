const pool = require("../config/db");

const saveResume = async (
  candidate_id,
  application_id,
  file_path
) => {
  const existing = await getResumeByApplication(application_id);

  if (existing) {
    const result = await pool.query(
      `
      UPDATE resumes
      SET file_path = $1
      WHERE application_id = $2
        AND candidate_id = $3
      RETURNING *
      `,
      [file_path, application_id, candidate_id]
    );

    return {
      ...result.rows[0],
      replaced: true,
      previous_file_path: existing.file_path
    };
  }

  const result = await pool.query(
    `
    INSERT INTO resumes
    (
      candidate_id,
      application_id,
      file_path
    )
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [
      candidate_id,
      application_id,
      file_path
    ]
  );

  return {
    ...result.rows[0],
    replaced: false,
    previous_file_path: null
  };
};

const getResumeByApplication = async (applicationId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM resumes
    WHERE application_id = $1
    `,
    [applicationId]
  );

  return result.rows[0];
};

const getResumeByApplicationForCandidate = async (applicationId, candidateId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM resumes
    WHERE application_id = $1
      AND candidate_id = $2
    `,
    [applicationId, candidateId]
  );

  return result.rows[0];
};

const deleteResumeByApplication = async (applicationId, candidateId) => {
  const result = await pool.query(
    `
    DELETE FROM resumes
    WHERE application_id = $1
      AND candidate_id = $2
    RETURNING *
    `,
    [applicationId, candidateId]
  );

  return result.rows[0];
};

module.exports = {
  saveResume,
  getResumeByApplication,
  getResumeByApplicationForCandidate,
  deleteResumeByApplication
};
