require("dotenv").config();

const pool = require("../src/config/db");

async function migrateFeatureSchema() {
  await pool.query(`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'APPLIED',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS matched_skills TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS missing_skills TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS summary JSONB
  `);

  await pool.query(`
    UPDATE applications
    SET status = 'APPLIED'
    WHERE status IS NULL
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bulk_screening_runs (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      total_files INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bulk_screening_results (
      id SERIAL PRIMARY KEY,
      run_id INTEGER REFERENCES bulk_screening_runs(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      score NUMERIC(5,2),
      matched_skills TEXT[] DEFAULT '{}',
      missing_skills TEXT[] DEFAULT '{}',
      summary JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interview_results (
      id SERIAL PRIMARY KEY,
      application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      candidate_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
      video_path TEXT,
      transcript TEXT,
      communication_score NUMERIC(5,2),
      technical_relevance_score NUMERIC(5,2),
      confidence_score NUMERIC(5,2),
      overall_score NUMERIC(5,2),
      feedback TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("Feature schema updated");
}

migrateFeatureSchema()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
