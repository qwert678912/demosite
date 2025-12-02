require("dotenv").config();
const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// FIX FOR CSS MIME TYPE
app.use(
  express.static("public", {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      }
    },
  })
);

/* ---------------------------
   S3 CONFIG (Backblaze B2)
------------------------------*/
/* ---------------------------
   S3 CONFIG (Backblaze B2)
------------------------------*/
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint("https://s3.us-east-005.backblazeb2.com"),
  region: "us-east-005",
  signatureVersion: "v4",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APP_KEY,
  },
  s3ForcePathStyle: true
});

/* ---------------------------
   CREATE PRESIGNED PUT URL
------------------------------*/
app.get("/sign-put", async (req, res) => {
  try {
    const fileName = req.query.file;

    const params = {
      Bucket: process.env.B2_BUCKET,
      Key: fileName,
      Expires: 300,
    };

    const uploadURL = await s3.getSignedUrlPromise("putObject", params);
    res.json({ uploadURL });
  } catch (err) {
    console.error("SIGN PUT ERROR:", err);
    res.status(500).json({ error: "Failed to generate PUT URL" });
  }
});

/* ---------------------------
   CREATE PRESIGNED GET URL
------------------------------*/
app.get("/signed-get", async (req, res) => {
  try {
    const fileName = req.query.file;

    const params = {
      Bucket: process.env.B2_BUCKET,
      Key: fileName,
      Expires: 600,
    };

    const viewURL = await s3.getSignedUrlPromise("getObject", params);
    res.json({ viewURL });
  } catch (err) {
    console.error("SIGN GET ERROR:", err);
    res.status(500).json({ error: "Failed to generate GET URL" });
  }
});

/* ---------------------------
   LIST ALL FILES IN BUCKET
------------------------------*/
app.get("/list", async (req, res) => {
  try {
    const result = await s3
      .listObjectsV2({
        Bucket: process.env.B2_BUCKET,
      })
      .promise();

    res.json(result.Contents || []);
  } catch (err) {
    console.error("LIST ERROR:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

/* ---------------------------
   SERVE FRONTEND
------------------------------*/
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ---------------------------
   START SERVER
------------------------------*/
app.listen(process.env.PORT, () => {
  console.log(`Server running → http://localhost:${process.env.PORT}`);
});

