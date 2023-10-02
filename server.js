const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { initializeApp } = require("firebase/app");
const admin = require("firebase-admin");
dotenv.config({ path: "./config.env" });

const app = require("./app");

//Connecting to ATLAS cluster (to MongoDB's cloud db)
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log("DB connection successfull");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });

//Connecting to Firebase for image upload
const firebaseConfig = require("./firebaseConfig");
const firebaseApp = initializeApp(firebaseConfig);
admin.initializeApp({
  credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  storageBucket: firebaseConfig.storageBucket,
});

//Start backend server on port 4000
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
