require("dotenv").config();

const pool = require("../src/config/db");

async function migrateJobSchema() {
  await pool.query(`
    ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS type VARCHAR(32) DEFAULT 'Full-Time',
      ADD COLUMN IF NOT EXISTS mode VARCHAR(32) DEFAULT 'On-site',
      ADD COLUMN IF NOT EXISTS application_close_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS auto_screen BOOLEAN DEFAULT FALSE
  `);

  await pool.query(`
    UPDATE jobs
    SET type = 'Full-Time'
    WHERE type IS NULL
  `);

  await pool.query(`
    UPDATE jobs
    SET mode = 'On-site'
    WHERE mode IS NULL
  `);

  console.log("Jobs schema updated with type, mode, and application_close_at");
}

migrateJobSchema()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
