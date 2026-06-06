const Job = require("../models/jobModel");

const createJob = async (req, res) => {
  try {

    const {
      title,
      description,
      skills_required,
      type = "Full-Time",
      mode = "On-site",
      application_close_at = null,
      auto_screen = false
    } = req.body;

    if (
      !title ||
      !description ||
      !skills_required
    ) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const job = await Job.createJob(
      title,
      description,
      skills_required,
      req.user.id,
      type,
      mode,
      application_close_at || null,
      auto_screen
    );

    res.status(201).json(job);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });

  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await Job.getAllJobs();
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  createJob,
  getJobs
};