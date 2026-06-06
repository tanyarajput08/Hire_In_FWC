const fs = require("fs");
const Resume = require("../models/resumeModel");
const Application = require("../models/applicationModel");
const {
  isApplicationOpen,
  applicationClosedMessage
} = require("../utils/applicationDeadline");
const path = require("path");
const { screenApplicationInternal } = require("./screeningController");

const ensureResumeChangesAllowed = async (applicationId, candidateId) => {
  const application = await Application.getApplicationByIdForCandidate(
    applicationId,
    candidateId
  );

  if (!application) {
    return {
      allowed: false,
      status: 404,
      message: "Application not found"
    };
  }

  if (!isApplicationOpen(application.application_close_at)) {
    return {
      allowed: false,
      status: 403,
      message: applicationClosedMessage(application.application_close_at)
    };
  }

  return {
    allowed: true,
    application
  };
};

const uploadResume = async (req, res) => {
  try {
    const { application_id } = req.body;

    const access = await ensureResumeChangesAllowed(
      application_id,
      req.user.id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        message: access.message
      });
    }

    const resume = await Resume.saveResume(
      req.user.id,
      application_id,
      req.file.path
    );

    let autoScreened = false;
    if (access.application && access.application.auto_screen) {
      try {
        await screenApplicationInternal(application_id);
        autoScreened = true;
      } catch (err) {
        console.error("Auto-screening failed on resume upload:", err);
      }
    } else {
      await Application.clearScreening(application_id);
    }

    if (resume.replaced && resume.previous_file_path) {
      const previousPath = path.resolve(resume.previous_file_path);
      fs.unlink(previousPath, (error) => {
        if (error && error.code !== "ENOENT") {
          console.error("Failed to delete replaced resume file:", error);
        }
      });
    }

    let successMessage = "Resume uploaded";
    if (autoScreened) {
      successMessage = resume.replaced
        ? "Resume updated and auto-screened"
        : "Resume uploaded and auto-screened";
    } else if (resume.replaced) {
      successMessage = "Resume updated and screening results cleared";
    }

    res.status(resume.replaced ? 200 : 201).json({
      ...resume,
      message: successMessage
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

const previewResume = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const resume = await Resume.getResumeByApplication(applicationId);

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found"
      });
    }

    const absolutePath = path.resolve(resume.file_path);

    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(absolutePath);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

const deleteResume = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const access = await ensureResumeChangesAllowed(
      applicationId,
      req.user.id
    );

    if (!access.allowed) {
      return res.status(access.status).json({
        message: access.message
      });
    }

    const resume = await Resume.getResumeByApplicationForCandidate(
      applicationId,
      req.user.id
    );

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found for this application"
      });
    }

    const deleted = await Resume.deleteResumeByApplication(
      applicationId,
      req.user.id
    );

    await Application.clearScreening(applicationId);

    const absolutePath = path.resolve(deleted.file_path);
    fs.unlink(absolutePath, (error) => {
      if (error && error.code !== "ENOENT") {
        console.error("Failed to delete resume file:", error);
      }
    });

    res.json({
      message: "Resume deleted and screening results cleared"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = {
  uploadResume,
  previewResume,
  deleteResume
};
