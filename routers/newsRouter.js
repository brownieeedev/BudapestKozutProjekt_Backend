const express = require("express");
const router = express.Router();

const newsController = require("../controllers/newsController");

router.post(
  "/create",
  newsController.uploadCover,
  //   newsController.uploadOtherImages,
  newsController.modifyCoverPhoto,
  newsController.createNews
);

module.exports = router;
