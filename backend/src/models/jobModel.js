const pool = require("../config/db");

const createJob = async (
  title,
  description,
  skills_required,
  created_by,
  type = "Full-Time",
  mode = "On-site",
  application_close_at = null,
  auto_screen = false
) => {
  const result = await pool.query(
    `
    INSERT INTO jobs
    (
      title,
      description,
      skills_required,
      created_by,
      type,
      mode,
      application_close_at,
      auto_screen
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      title,
      description,
      skills_required,
      created_by,
      type,
      mode,
      application_close_at,
      auto_screen
    ]
  );

  return result.rows[0];
};

const isJobAcceptingApplications = (job) => {
  if (!job?.application_close_at) {
    return true;
  }

  return new Date() < new Date(job.application_close_at);
};

const getAllJobs = async () => {
  const result = await pool.query(
    `SELECT * FROM jobs
     ORDER BY created_at DESC`
  );

  return result.rows;
};

const getJobById = async (jobId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM jobs
    WHERE id = $1
    `,
    [jobId]
  );

  return result.rows[0];
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  isJobAcceptingApplications
};
