const Application = require("../models/applicationModel");
const Job = require("../models/jobModel");
const {
  isApplicationOpen,
  applicationClosedMessage
} = require("../utils/applicationDeadline");

const applyJob = async (req, res) => {
  try {
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({
        message: "Job ID is required"
      });
    }

    const job = await Job.getJobById(job_id);
    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    if (!isApplicationOpen(job.application_close_at)) {
      return res.status(403).json({
        message: applicationClosedMessage(job.application_close_at)
      });
    }

    const application = await Application.applyJob(
      req.user.id,
      job_id
    );

    res.status(201).json(application);

  } catch (error) {
    console.error(error);
    res.status(error.message?.includes("already applied") ? 400 : 500).json({
      message: error.message || "Server Error"
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.getApplicationsByCandidate(req.user.id);
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.getApplicationsByJob(jobId);
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required"
      });
    }

    const application = await Application.updateStatus(applicationId, status);

    if (!application) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    res.json(application);
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: error.message || "Server Error"
    });
  }
};

module.exports = {
  applyJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus
};
