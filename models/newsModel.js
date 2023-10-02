const mongoose = require("mongoose");
const User = require("./userModel");

const newsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, unique: true },
    articleBody: { type: String, required: true },
    coverImg: { type: String },
    category: { type: String, required: true },
    publicationDate: {
      type: Date,
      required: true,
      default: new Date(Date.now()),
    },
    lastModifiedDate: {
      type: Date,
      required: true,
      default: Date.now(),
    },
  },
  { versionKey: false }
);

const News = mongoose.model("News", newsSchema);

module.exports = News;
