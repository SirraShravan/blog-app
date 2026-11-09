import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;

  if (
    !username ||
    !email ||
    !password ||
    username.trim() === "" ||
    email.trim() === "" ||
    password === ""
  ) {
    return next(errorHandler(400, "All fields are required"));
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanUsername = username.trim();

  try {
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return next(errorHandler(400, "An account with this email already exists."));
    }

    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });
    if (existingUsername) {
      return next(errorHandler(400, "This username is already taken."));
    }

    const hashpassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashpassword,
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "SignUp Successful" });
  } catch (error) {
    if (error.code === 11000) {
      return next(errorHandler(400, "Username or email is already registered."));
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email.trim() === "" || password === "") {
    return next(errorHandler(400, "All fields are required"));
  }

  const cleanIdentifier = email.trim();

  try {
    // Search by email (case-insensitive) OR username (case-insensitive)
    const validUser = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { email: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
        { username: { $regex: new RegExp(`^${cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
      ],
    });

    if (!validUser) {
      return next(errorHandler(404, "User not found. Check your email or username."));
    }

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(400, "Invalid password. Please try again."));
    }

    const token = jwt.sign(
      { id: validUser._id, isAdmin: validUser.isAdmin },
      process.env.JWT_SECRET
    );
    const { password: pass, ...rest } = validUser._doc;
    res
      .status(200)
      .cookie("access_token", token, { httpOnly: true, sameSite: "lax" })
      .json({ ...rest, token });
  } catch (error) {
    next(error);
  }
};

export const google = async (req, res, next) =>{
    const {email, name, googlePhotoUrl} = req.body
    try {
      const user = await User.findOne({email})
      if(user){
        const token = jwt.sign({id: user._id, isAdmin:user.isAdmin}, process.env.JWT_SECRET)
        const {password, ...rest} = user._doc
        res.status(200).cookie('access_token', token, {
          httpOnly: true,
        }).json(rest)
      } else {
        const generatedPassword = Math.random().toString(36).slice(-8)+Math.random().toString(36).slice(-8)
        const hashedPassword = bcryptjs.hashSync(generatedPassword, 10)

        const newUser = new User({
          username: name.toLowerCase().split(' ').join('') + Math.random().toString(9).slice(-4),
          email,
          password: hashedPassword,
          profilePicture: googlePhotoUrl
        })
        await newUser.save()
        const token = jwt.sign({id: newUser._id, isAdmin:newUser.isAdmin}, process.env.JWT_SECRET)
        const {password, ...rest} = user._doc
        res.status(200).cookie('access_token', token, {
          httpOnly: true,
        }).json(rest)
      }
    } catch (error) {
        next(error)
    }
} 