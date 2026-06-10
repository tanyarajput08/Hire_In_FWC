require("dotenv").config();

const pool = require("../src/config/db");

async function migrateFeatureSchema() {
  // 1. Create base tables if they don't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      skills_required TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      type VARCHAR(32) DEFAULT 'Full-Time',
      mode VARCHAR(32) DEFAULT 'On-site',
      application_close_at TIMESTAMP,
      auto_screen BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      status VARCHAR(32) DEFAULT 'APPLIED',
      score NUMERIC(5,2),
      matched_skills TEXT[] DEFAULT '{}',
      missing_skills TEXT[] DEFAULT '{}',
      summary JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS resumes (
      id SERIAL PRIMARY KEY,
      candidate_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Add extra feature columns if applications table already exists but lacks them
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
