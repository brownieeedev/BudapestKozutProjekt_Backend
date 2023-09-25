const { promisify } = require("util");

const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
// const sendEmail = require('../utils/email');
const crypto = require("crypto");
// const { Email, Email2 } = require('../utils/email');

const signToken = (payload, secret, expires) => {
  return jwt.sign({ id: payload }, secret, {
    expiresIn: expires * 1,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(
    user._id,
    process.env.JWT_ACCESS_SECRET,
    process.env.JWT_ACCESS_EXPIRES_IN
  );

  const refreshToken = signToken(
    "thegiveawayuk",
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRES_IN
  );

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_REFRESH_EXPIRES_IN) * 1,
    httpOnly: true,
    //secure: true, //cookie will only be sent on encrypted (https)s
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
    cookieOptions.httpOnly = true;
  }

  const shortTokenTime = process.env.JWT_ACCESS_EXPIRES_IN * 1000;
  console.log(`Shortoken time ${shortTokenTime}`);

  res.cookie("jwt_r", refreshToken, cookieOptions);

  //Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    shortTokenTime,
  });
};

exports.refresh = async (req, res) => {
  console.log("inside refresh");
  // ntpClient.getNetworkTime("pool.ntp.org", 123, (err, date) => {
  //   if (err) {
  //     console.error(err);
  //     return;
  //   }
  //   console.log("Network Time:", date);
  // });
  const { _id } = req.user;

  let refreshToken;
  if (!req.cookies.jwt_r) {
    return res.status(400).json({
      status: "Unsuccess",
      message: "Token has expired! Log in again!",
    });
  } else {
    refreshToken = req.cookies.jwt_r;
  }

  // console.log("refresh token");
  // console.log(refreshToken);

  try {
    const decoded = await promisify(jwt.verify)(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    const { id, iat, exp } = decoded;
    let isExpired = Date.now() / 1000 >= exp;

    if (decoded && id === "thegiveawayuk" && !isExpired) {
      console.log("signin new token");
      // Correct refresh token -> send a new access token
      const token = signToken(
        _id,
        process.env.JWT_ACCESS_SECRET,
        process.env.JWT_ACCESS_EXPIRES_IN
      );
      return res.status(201).json({ status: "success", token });
    } else {
      res.cookie("jwt_r", "loggedout", {
        expires: new Date(0),
        httpOnly: true,
      });
      return res.status(406).json({
        status: "unsuccess",
        message: "Unauthorized",
      });
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.cookie("jwt_r", "loggedout", {
        expires: new Date(0),
        httpOnly: true,
      });
      return res.status(401).json({
        status: "unsuccess",
        message: "Token has expired, please log in again!",
      });
    } else {
      res.cookie("jwt_r", "loggedout", {
        expires: new Date(0),
        httpOnly: true,
      });
      return res.status(403).json({
        status: "unsuccess",
        message: "Authentication failed!",
      });
    }
  }
};

exports.protect = async (req, res, next) => {
  //1) Getting token Authorization header of the fetch and check if it exists
  console.log("inside protect");
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "unsuccess",
      message: "You are not logged in please login to get access!",
    });
  }
  //2) Validate token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.cookie("jwt_r", "loggedout", {
        expires: new Date(0),
        httpOnly: true,
      });
      return res.status(401).json({
        status: "unsuccess",
        message: "Token has expired, please log in again!",
      });
    } else {
      res.cookie("jwt_r", "loggedout", {
        expires: new Date(0),
        httpOnly: true,
      });
      return res.status(403).json({
        status: "unsuccess",
        message: "Authentication failed!",
      });
    }
  }

  if (!decoded) {
    res.cookie("jwt_r", "loggedout", {
      expires: new Date(0),
      httpOnly: true,
    });
    return res.status(401).json({
      status: "unsuccess",
      message: "Token validation error!",
    });
  }
  // console.log(decoded);
  //3)Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).json({
      status: "unsuccess",
      message: "Unauthorized! The user to the token does not exist!",
    });
  }
  //4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return res
      .status(401)
      .send("Recently changed password, please login again!");
  }
  //megadja az engedélyt a route eléréshez a felhasználónak
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
};

exports.signup = async (req, res) => {
  const { email, password, subscribed } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: "unsuccess",
      message: "Either email or password is missing!",
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    return res.status(400).json({
      status: "unsuccess",
      message: "The provided email is already in use!",
    });
  }

  const newUser = await User.create({
    email,
    password,
    subscribed,
  });

  //Sending welcome email

  // const url1 = `${req.protocol}://${req.get("host")}/`;
  // const url2 = `${req.protocol}://${req.get("host")}/`;
  // await new Email(newUser, url1, url2).sendWelcome();
  // createSendToken(newUser, 201, res);

  res.status(201).json({
    status: "success",
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  //1) email és jelszó létezik-e
  if (!email || !password) {
    res.status(400).json({
      status: "unsuccess",
      message: "Please provide email and password!",
    });
  }
  //2)megnézni h létezik e felhasználó és a jelszava megegyezik e
  const user = await User.findOne({ email }).select("+password");

  if (
    !user ||
    !(await user.correctPassword(password, user.password)) ||
    user.active === false
  ) {
    return res
      .status(401)
      .json({ status: "unsuccess", message: "Incorrect email or password!" });
  }

  //3) ha minden jó token küldése a kliensnek

  createSendToken(user, 200, res);
};

exports.logout = (req, res) => {
  //sending empty jwt token --> cant delete this because of httpOnly attribute only emptying it
  res.cookie("jwt_r", "loggedout", {
    expires: new Date(0),
    httpOnly: true,
  });

  return res.status(200).json({
    status: "success",
    message: "Successfully saved and loggedout!",
  });
};

//only for rendered pages
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //Validate token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_ACCESS_SECRET
      );
      //3)Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return res.status(401).send("The user to the token does not exist!");
      }
      //4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return res
          .status(401)
          .send("Recently changed password, please login again!");
      }
      //User is Logged in
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin','user']
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("You do not have permission.");
    }
    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  //1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).send("There is no user with that email address");
  }
  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it to users email
  const resetURL = `${req.protocol}:${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}}`;
  const message = `Forgot your password? Submit a patch request with your new password, and passconfirm url: ${resetURL}`;
  try {
    await new Email2(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTime = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);

    res.status(500).send("There was an error sending the email");
  }
};
exports.resetPassword = async (req, res, next) => {
  //1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTime: { $gt: Date.now() },
  });
  //2) If token is not expired and there is a user
  if (!user) {
    return res.status(400).send("Token is invalid or has expired");
  }
  user.password = req.body.password;
  user.passwordAgain = req.body.passwordAgain;
  user.passwordResetToken = undefined;
  user.passwordResetTime = undefined;
  await user.save();
  //3) Update changedPasswordAt property for the user

  //4) Log the user in};
  createSendToken(user, 200, res);
};

exports.updatePassword = async (req, res, next) => {
  //Logged in users but password needs to be added again
  //1) get user from the collection
  const user = await User.findById(req.user.id).select("+password"); //comes from protect middleware
  //2)Posted password is correct?
  // console.log(user);
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return res.status(401).send("Your current password is wrong!");
  }
  //3) If yes, update password
  user.password = req.body.password;
  user.passwordAgain = req.body.passwordAgain;
  await user.save();
  //4) log user in , send JWT
  createSendToken(user, 200, res);
};

exports.newPassword = async (req, res) => {
  const { email, password, newpassword } = req.body;

  console.log(email, password, newpassword);

  if (!email || !password || !newpassword) {
    return res.status(400).json({
      status: "unsuccess",
      message: "Missing inputs!",
    });
  }
  if (password === newpassword) {
    return res.status(400).json({
      status: "unsuccess",
      message: "Previous and new password is the same!",
    });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return res
      .status(401)
      .json({ status: "unsuccess", message: "Incorrect email or password!" });
  }

  try {
    user.password = newpassword;
    await user.save();
  } catch (err) {
    return res.status(400).json({
      status: "unsuccess",
      message: err,
    });
  }

  res.status(200).json({
    status: "success",
    message: "Password changed successfully!",
  });

  //checking if prevPassword is correct
};
