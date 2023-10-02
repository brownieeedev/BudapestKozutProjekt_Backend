const { promisify } = require("util");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (id, statusCode, res) => {
  const token = signToken(id);

  //sending back a jwt token in the response with users mongodb ID to save to localStorage in the frontend

  return res.status(statusCode).json({
    status: "success",
    token,
  });
};

exports.googleLogin = async (req, res) => {
  //looking for user in the db if its already a registered user
  const { email, name } = req.body.googleUser;
  const user = await User.findOne({ email: email });

  if (!user) {
    //user not loggedIn before
    const newUser = await User.create({
      name,
      email,
    });
    const newUserFromDB = await User.findOne({ email: email });
    const id = newUserFromDB._id;
    createSendToken(id, 200, res);
  } else {
    //user already loggedIn min once
    const id = user._id;
    createSendToken(id, 200, res);
  }
};

exports.login = async (req, res) => {
  const { email, jelszo } = req.body;

  //1) email és jelszó létezik-e
  if (!email || !jelszo) {
    res.status(400).send("Please provide email and password!");
  }
  //2)megnézni h létezik e felhasználó és a jelszava megegyezik e
  const user = await User.findOne({ email }).select("+jelszo");

  if (!user || !(await user.correctPassword(jelszo, user.jelszo))) {
    return res.status(401).json({ message: "Incorrect email or password" });
  }

  //3) ha minden jó token küldése a kliensnek
  try {
    await req.session.save();
    req.session.userId = user.id;
  } catch (err) {
    console.log(err);
  }
  createSendToken(user, 200, res);
};

exports.logout = (req, res) => {
  //sending empty jwt token --> cant delete this because of httpOnly attribute only emptying it
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

exports.protect = async (req, res, next) => {
  //1) Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token);
  if (!token) {
    return res
      .status(401)
      .send("You are not logged in please login to get access");
  }
  //2) Validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).send("The user to the token does not exist!");
  }
  //megadja az engedélyt a route eléréshez a felhasználónak
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
};
