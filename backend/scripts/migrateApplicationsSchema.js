require("dotenv").config();

const pool = require("../src/config/db");

async function migrateApplicationsSchema() {
  await pool.query(`
    ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'APPLIED',
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    UPDATE applications
    SET status = 'APPLIED'
    WHERE status IS NULL
  `);

  console.log("Applications schema updated");
}

migrateApplicationsSchema()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
