const express = require("express");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

//Start backend server on port 4000
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
