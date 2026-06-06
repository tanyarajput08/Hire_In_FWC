const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadRoot = "uploads";

const ensureDirectory = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const storage = multer.diskStorage({

  destination: function(req, file, cb) {
    const isVideo = file.fieldname === "answer_video";
    const destination = isVideo
      ? path.join(uploadRoot, "interviews")
      : path.join(uploadRoot, "resumes");

    ensureDirectory(destination);
    cb(null, destination);
  },

  filename: function(req, file, cb) {
    const extension = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/\s+/g, "-")
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "");

    const uniqueName =
      Date.now() +
      "-" +
      baseName +
      extension;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

module.exports = upload;
