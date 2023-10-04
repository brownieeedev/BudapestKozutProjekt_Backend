const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const newsController = require("../controllers/newsController");

router.post(
  "/create",
  authController.protect,
  newsController.uploadCover,
  newsController.modifyCoverPhoto,
  newsController.createNews
);

router.get("/getnews", newsController.getAllNews);
router.get("/get/:id", newsController.getOne);

//Protected routes
router.put("/update/:id", authController.protect, newsController.updateNews);
router.get("/getmynews", authController.protect, newsController.getMyNews);
router.delete("/delete/:id", authController.protect, newsController.deleteNews);

module.exports = router;
