const multer = require("multer");
const sharp = require("sharp");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, //5mb limit
});

exports.uploadCover = (req, res, next) => {
  console.log("uploading Cover");
  upload.single("coverImg")(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

exports.uploadOtherImages = (req, res, next) => {
  console.log("uploading other Images");
  upload.single("otherImages", 5)(req, res, (err) => {
    if (err) {
      // Handle any multer errors here
      return next(err);
    }
    next();
  });
};

exports.modifyCoverPhoto = async (req, res, next) => {
  console.log("modify cover photo");
  if (!req.file) {
    return next();
  }
  // const photos = req.files.length;
  try {
    //   for (let i = 0; i < photos; i++) {
    //     const buffer = await sharp(req.files[i].buffer, {
    //       failOnError: false,
    //     })
    //       .toFormat("jpeg")
    //       .resize(1000, 1000)
    //       .jpeg({ quality: 50 })
    //       .toBuffer();
    //     req.files[i].buffer = buffer;
    //   }
    next();
  } catch (err) {
    return next(err);
  }
};

exports.createNews = (req, res) => {
  console.log("inside createNews");
  const { title, articleBody } = req.body;

  console.log(req.file);
  // console.log(req.files);
  console.log(req.body);

  return res.status(200).json({
    status: "success",
    message: "Successfully created news!",
  });
};
