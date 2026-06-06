const path = require("path");
const BulkScreening = require("../models/bulkScreeningModel");
const Job = require("../models/jobModel");
const AI = require("../services/aiService");

const bulkScreenResumes = async (req, res) => {
  try {
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({
        message: "Job ID is required"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "Upload at least one resume PDF"
      });
    }

    const job = await Job.getJobById(job_id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    const run = await BulkScreening.createBulkRun(
      job_id,
      req.user.id,
      req.files.length
    );

    const results = [];

    for (const file of req.files) {
      const analysis = await AI.analyzePDF(
        path.resolve(file.path),
        job.description
      );

      const saved = await BulkScreening.saveBulkResult({
        runId: run.id,
        jobId: job_id,
        fileName: file.originalname,
        filePath: file.path,
        score: analysis.score,
        matchedSkills: analysis.matched_skills || [],
        missingSkills: analysis.missing_skills || [],
        summary: analysis.summary || null
      });

      results.push(saved);
    }

    res.status(201).json({
      run,
      results: results.sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

const getBulkResults = async (req, res) => {
  try {
    const { runId } = req.params;
    const results = await BulkScreening.getBulkRunResults(runId);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  bulkScreenResumes,
  getBulkResults
};
