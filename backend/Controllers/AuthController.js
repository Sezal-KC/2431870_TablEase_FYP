// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const UserModel = require("../Models/user");

// const signup = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // Basic input validation (extra safety layer)
//     if (!name || !email || !password || !role) {
//       return res.status(400).json({
//         message: 'All fields are required (name, email, password, role)',
//         success: false
//       });
//     }

//     // Check if user already exists
//     const existingUser = await UserModel.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({
//         message: 'User already exists. Please login.',
//         success: false
//       });
//     }

//     // Validate role (extra safety)
//     const validRoles = ['waiter', 'cashier', 'manager', 'admin', 'kitchen_staff'];
//     if (!validRoles.includes(role)) {
//       return res.status(400).json({
//         message: 'Invalid role selected. Please use your registered role.',
//         success: false
//       });
//     }

//     // Hash password
//     const saltRounds = 10;
//     const hashedPassword = await bcrypt.hash(password, saltRounds);

//     // Create new user
//     const newUser = new UserModel({
//       name,
//       email,
//       password: hashedPassword,
//       role
//     });

//     await newUser.save();

//     res.status(201).json({
//       message: "Signup successful! Please login.",
//       success: true
//     });
//   } catch (err) {
//     console.error('Signup error:', err);
//     res.status(500).json({
//       message: "Internal server error",
//       success: false
//     });
//   }
// };

// const login = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     // Find user by email
//     const user = await UserModel.findOne({ email });
//     if (!user) {
//       return res.status(403).json({
//         message: 'Invalid email or password',
//         success: false
//       });
//     }

//     // Compare password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(403).json({
//         message: 'Invalid email or password',
//         success: false
//       });
//     }

//     // Optional: Strict role check during login (uncomment if you want to enforce it)
//     // if (role && user.role !== role) {
//     //   return res.status(403).json({
//     //     message: 'Invalid role for this account',
//     //     success: false
//     //   });
//     // }

//     // Generate JWT token (include role in payload)
//     const jwtToken = jwt.sign(
//       {
//         email: user.email,
//         _id: user._id,
//         role: user.role,
//         name: user.name
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       success: true,
//       jwtToken,
//       name: user.name,
//       role: user.role,
//       email: user.email
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({
//       message: "Internal server error",
//       success: false
//     });
//   }
// };

// module.exports = {
//   signup,
//   login
// };
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserModel = require("../Models/user");
const sendEmail = require('../utils/sendEmail');

/* =========================
   SIGNUP WITH EMAIL VERIFY
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

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');

    const newUser = new UserModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      isEmailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires: Date.now() + 30 * 60 * 1000 // 30 mins
    });

    await newUser.save();

    // Verification email
    const verificationUrl = `http://localhost:5173/verify-email?token=${token}&email=${email}`;

    await sendEmail({
      to: email,
      subject: 'Verify your TablEase account',
      html: `
        <h2>Welcome to TablEase</h2>
        <p>Please verify your email to activate your account.</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link expires in 30 minutes.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Signup successful. Please verify your email.'
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
   EMAIL VERIFICATION
========================= */
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    const user = await UserModel.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification link'
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
        message: 'Your email is not verified. Please check your Gmail inbox and click the verification link to activate your account.'
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
