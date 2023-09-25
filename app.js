const express = require("express");

const app = express();

//Route imports
const userRouter = require("./routers/userRouter");
//Routes
app.use("/api/v1/users", userRouter);

module.exports = app;
