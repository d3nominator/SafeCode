require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
// const File = require('./Models/File');
var fs = require("fs");
const path = require("path");
const File = require("./Models/File");

const app = express();

mongoose.connect(process.env.MONGO_URI);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Specify the destination folder
  },
  filename: (req, file, cb) => {
    console.log(req.method);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // console.log(path.extname(file.originalname));
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    ); // Specify the filename
  },
});

const upload = multer({ storage: storage });

app.set("view engine", "ejs");
var bodyParser = require("body-parser");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

app.get("/upload", (req, res) => {
  res.render("index");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const FileData = {
    path: req.file.path,
    originalname: req.file.originalname,
  };
  if (req.body.password != null && req.body.password != "") {
    FileData.password = await bcrypt.hash(req.body.password, 10);
  }
  console.log(FileData);
  const file = await File.create(FileData);
  res.render("index", {
    fileLink: `${req.headers.origin}/download/${file.id}`,
  });
});

app.get("/download/:id", handleDownload);
app.post("/download/:id", handleDownload);

app.get("/", (req, res) => {
  res.redirect("/upload");
});

  
  
async function handleDownload(req, res) {
  const file = await File.findById(req.params.id);
    if (file.password != null) {
      if ( req.body.password == null || req.body.password == "") {
        res.render("download", { id: req.params.id });
        return;
      }
      if ( !(await bcrypt.compare(req.body.password , file.password) ) ) {
        res.render("download", { id: req.params.id , error: true });
        return;
      }
      file.downloadCount++;
      file.save();
      res.download(file.path);       
    } 
    else {
     file.downloadCount++;
     file.save();
     res.download(file.path);
   }
};

app.listen(process.env.PORT, () => {
  console.log("Server is running on port 3000");
});
