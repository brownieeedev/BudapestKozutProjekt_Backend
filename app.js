const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

//Route imports
const userRouter = require("./routers/userRouter");
//Routes
app.use("/api/v1/users", userRouter);

module.exports = app;
