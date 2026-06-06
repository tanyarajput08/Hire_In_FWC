const pool = require("../config/db");

const createBulkRun = async (jobId, createdBy, totalFiles) => {
  const result = await pool.query(
    `
    INSERT INTO bulk_screening_runs
    (job_id, created_by, total_files)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [jobId, createdBy, totalFiles]
  );

  return result.rows[0];
};

const saveBulkResult = async ({
  runId,
  jobId,
  fileName,
  filePath,
  score,
  matchedSkills,
  missingSkills,
  summary
}) => {
  const result = await pool.query(
    `
    INSERT INTO bulk_screening_results
    (
      run_id,
      job_id,
      file_name,
      file_path,
      score,
      matched_skills,
      missing_skills,
      summary
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [
      runId,
      jobId,
      fileName,
      filePath,
      score,
      matchedSkills,
      missingSkills,
      summary
    ]
  );

  return result.rows[0];
};

const getBulkRunResults = async (runId) => {
  const result = await pool.query(
    `
    SELECT *
    FROM bulk_screening_results
    WHERE run_id = $1
    ORDER BY score DESC NULLS LAST, created_at ASC
    `,
    [runId]
  );

  return result.rows;
};

module.exports = {
  createBulkRun,
  saveBulkResult,
  getBulkRunResults
};
