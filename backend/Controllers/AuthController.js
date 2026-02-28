const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require("../Models/user");
const sendEmail = require('../utils/sendEmail');

/* =========================
   HELPER: Generate 6-digit OTP
========================= */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

/* =========================
   SIGNUP WITH EMAIL OTP
========================= */
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const validRoles = ['waiter', 'cashier', 'manager', 'admin', 'kitchen_staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate OTP for email verification
    const otp = generateOTP();

    const newUser = new UserModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isEmailVerified: false,
      emailVerificationToken: otp,               // store OTP
      emailVerificationExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    await newUser.save();

    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'Your TablEase OTP Verification Code',
      html: `
        <h2>Welcome to TablEase</h2>
        <p>Your OTP to verify your email is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Signup successful. Please check your email for the OTP to verify your account.'
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/* =========================
   VERIFY EMAIL WITH OTP
========================= */
const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body; // OTP verification now via POST body

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: otp,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });

  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/* =========================
   LOGIN (EMAIL MUST BE VERIFIED)
========================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email is not verified. Please check your email and verify your account.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(403).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const jwtToken = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      jwtToken,
      name: user.name,
      role: user.role
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail
};
