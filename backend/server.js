const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const MEDIA_DIR = path.join(__dirname, "..", "media");
const PHOTOS_DIR = path.join(MEDIA_DIR, "photos");
const VIDEOS_DIR = path.join(MEDIA_DIR, "videos");
const AUDIO_DIR = path.join(MEDIA_DIR, "audio");

[MEDIA_DIR, PHOTOS_DIR, VIDEOS_DIR, AUDIO_DIR]
  .forEach(dir => fs.mkdirSync(dir, { recursive: true }));

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    let folder = MEDIA_DIR;

    if (file.mimetype.startsWith("image/")) {
      folder = PHOTOS_DIR;
    } else if (file.mimetype.startsWith("video/")) {
      folder = VIDEOS_DIR;
    } else if (file.mimetype.startsWith("audio/")) {
      folder = AUDIO_DIR;
    }

    cb(null, folder);
  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname);

    const filename =
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 9) +
      ext;

    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MIRZA Device Utility backend is running"
  });
});

app.post("/api/upload", upload.single("media"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No media file received"
    });
  }

  res.json({
    success: true,
    message: "Media uploaded successfully",
    file: {
      name: req.file.filename,
      type: req.file.mimetype,
      size: req.file.size
    }
  });
});

app.use("/media", express.static(MEDIA_DIR));

app.get("/api/media", (req, res) => {

  const result = [];

  function scan(folder, type) {

    if (!fs.existsSync(folder)) return;

    fs.readdirSync(folder).forEach(file => {

      result.push({
        name: file,
        type,
        url: `/media/${type}/${encodeURIComponent(file)}`
      });

    });
  }

  scan(PHOTOS_DIR, "photos");
  scan(VIDEOS_DIR, "videos");
  scan(AUDIO_DIR, "audio");

  res.json(result);
});

app.listen(PORT, () => {

  console.log("");
  console.log("MIRZA Device Utility Backend");
  console.log("--------------------------------");
  console.log(`Server running on port ${PORT}`);
  console.log("");
});
