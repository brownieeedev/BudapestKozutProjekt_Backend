const multer = require("multer");
const sharp = require("sharp");
const News = require("../models/newsModel");
const User = require("../models/userModel");
const admin = require("firebase-admin");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, //10mb limit
});

exports.uploadCover = (req, res, next) => {
  upload.single("coverImg")(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

exports.uploadOtherImages = (req, res, next) => {
  const { id } = req.params;

  upload.single("otherImages", 5)(req, res, (err) => {
    if (err) {
      // Handle any multer errors here
      return next(err);
    }
    next();
  });
};

exports.modifyCoverPhoto = async (req, res, next) => {
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

//POST
exports.createNews = async (req, res) => {
  const { title, articleBody, category } = req.body;
  const coverImg = req.file;

  if (!title || !articleBody || !req.user || !coverImg) {
    return res.status(400).json({
      status: "unsuccess",
      message: "Missing fields, could not create news!",
    });
  }
  try {
    const bucket = admin.storage().bucket();
    const uploadFileToFirebase = async (photo) => {
      try {
        let filepath = title + "-" + "coverimg";

        //save the doc to the database first
        await News.create({
          title,
          articleBody,
          user: req.user._id,
          coverImg: filepath,
          category,
        });
        //get the saved document and change filename to documentId +"filetype .jpeg"
        const currentDoc = await News.findOne({
          coverImg: filepath,
        });
        const filetype = coverImg.mimetype.split("/")[1];
        filepath = currentDoc._id + `.${filetype}`;
        //save to doc back again to db
        await News.findByIdAndUpdate(currentDoc._id, { coverImg: filepath });

        //upload to firebase
        const fileRef = bucket.file(filepath);
        await fileRef.save(photo.buffer, {
          contentType: `${coverImg.mimetype}`,
        });
      } catch (err) {
        console.error(err);
      }
    };

    uploadFileToFirebase(coverImg);

    return res.status(200).json({
      status: "success",
      message: "Successfully created news!",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: "unsuccess",
      message: "Error happened while saving to the DB!",
    });
  }
};

//GET
exports.getAllNews = async (req, res) => {
  const newsList = await News.find();
  //getting images from firebase to the news
  const bucket = admin.storage().bucket();
  let author;
  const news = await Promise.all(
    newsList.map(async (item) => {
      if (item.coverImg) {
        const imageURL = await bucket.file(`${item.coverImg}`).getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        const user = await User.findById(item.user);
        author = user.name;

        const itemWithImageURL = {
          ...item.toObject(),
          coverImg: imageURL,
          author: author,
        };
        return itemWithImageURL;
      } else {
        // Handle the case where the coverImg field is empty or not provided, but should not happen this scenario because mongoose Models
        return item.toObject();
      }
    })
  );
  if (!newsList) {
    return res.status(200).json({
      message: "No news were found!",
    });
  }
  return res.status(200).json({
    status: "success",
    news,
  });
};

exports.getMyNews = async (req, res) => {
  const mynews = await News.find({ user: req.user._id });
  if (mynews.length === 0 || !mynews) {
    return res.status(400).json({
      status: "unsuccess",
      message: "You do not have any news!",
    });
  }
  //getting images from firebase to the news
  const bucket = admin.storage().bucket();
  let author;
  const news = await Promise.all(
    mynews.map(async (item) => {
      if (item.coverImg) {
        const imageURL = await bucket.file(`${item.coverImg}`).getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
        });

        const user = await User.findById(item.user);
        author = user.name;

        const itemWithImageURL = {
          ...item.toObject(),
          coverImg: imageURL,
          author: author,
        };
        return itemWithImageURL;
      } else {
        // Handle the case where the coverImg field is empty or not provided, but should not happen this scenario because mongoose Models
        return item.toObject();
      }
    })
  );
  return res.status(200).json({
    status: "success",
    news,
  });
};

exports.getOne = async (req, res) => {
  const { id } = req.params;
  let article = await News.findById(id);

  if (!article) {
    return res.status(404).json({
      status: "unsuccess",
      message: "Article not found!",
    });
  }

  //getting coverImg from firebase to the article
  const bucket = admin.storage().bucket();
  const imageURL = await bucket.file(`${article.coverImg}`).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });

  //getting author name aswell
  let author;
  const user = await User.findById(article.user);
  author = user.name;

  article = {
    ...article.toObject(),
    author,
    coverImg: imageURL,
  };

  return res.status(200).json({
    status: "success",
    article,
  });
};

//DELETE
exports.deleteNews = async (req, res) => {
  const { id } = req.params;
  const article = await News.findById(id);

  if (!article) {
    return res.status(404).json({
      status: "unsuccess",
      message: "Could not found article!",
    });
  } else {
    await News.findByIdAndDelete(id);
    return res.status(200).json({
      status: "success",
      message: "Successfully deleted item!",
    });
  }
};

//UPDATE
exports.updateNews = async (req, res) => {
  console.log("reached backend");
  const { id } = req.params;
  const title = req.body.title;
  const { articleBody, category } = req.body;

  console.log(title, articleBody, category);

  if (!title || !articleBody || !category || !req.user || !id) {
    return res.status(400).json({
      status: "unsuccess",
      message: "Missing fields, could not update news!",
    });
  }
  try {
    await News.findByIdAndUpdate(id, { title, articleBody, category });
    return res.status(200).json({
      status: "success",
      message: "Successfully created news!",
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      status: "unsuccess",
      message: "Error happened while saving to the DB!",
    });
  }
};
