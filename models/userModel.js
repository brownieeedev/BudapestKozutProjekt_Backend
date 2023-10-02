const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Enter a valid email format!"],
      required: true,
    },
    registration: { type: Date, default: Date.now() },
  },
  { versionKey: false }
);

//encrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (Password, userPassword) {
  return await bcrypt.compare(Password, userPassword);
};

const User = mongoose.model("Users", userSchema);
module.exports = User;
