const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/user");

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic input validation (extra safety layer)
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'All fields are required (name, email, password, role)',
        success: false
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists. Please login.',
        success: false
      });
    }

    // Validate role (extra safety)
    const validRoles = ['waiter', 'cashier', 'manager', 'admin', 'kitchen_staff'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role selected',
        success: false
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({
      message: "Signup successful! Please login.",
      success: true
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(403).json({
        message: 'Invalid email or password',
        success: false
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(403).json({
        message: 'Invalid email or password',
        success: false
      });
    }

    // Optional: Strict role check during login (uncomment if you want to enforce it)
    // if (role && user.role !== role) {
    //   return res.status(403).json({
    //     message: 'Invalid role for this account',
    //     success: false
    //   });
    // }

    // Generate JWT token (include role in payload)
    const jwtToken = jwt.sign(
      {
        email: user.email,
        _id: user._id,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      jwtToken,
      name: user.name,
      role: user.role,
      email: user.email
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

module.exports = {
  signup,
  login
};