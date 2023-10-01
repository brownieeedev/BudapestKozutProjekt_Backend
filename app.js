const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

//Route imports
const userRouter = require("./routers/userRouter");
const newsRouter = require("./routers/newsRouter");

//Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/news", newsRouter);

module.exports = app;
