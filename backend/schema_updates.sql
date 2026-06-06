-- TalentIQ feature upgrade schema.
-- Run this against your PostgreSQL database before using the new workflow,
-- bulk screening, resume preview, and interview result features.

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'APPLIED',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE applications
SET status = 'APPLIED'
WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS bulk_screening_runs (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_files INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_screening_results (
  id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES bulk_screening_runs(id) ON DELETE CASCADE,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  score NUMERIC(5,2),
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS type VARCHAR(32) DEFAULT 'Full-Time',
  ADD COLUMN IF NOT EXISTS mode VARCHAR(32) DEFAULT 'On-site',
  ADD COLUMN IF NOT EXISTS application_close_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS auto_screen BOOLEAN DEFAULT FALSE;

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
  created_at TIMESTAMP DEFAULT NOW()
);
