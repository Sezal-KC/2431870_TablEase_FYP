const express = require('express');
const router = express.Router();

// getting the validation functions to check user input
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
// getting the actual controller functions that do signup and login work
const { signup, login, verifyEmail, forgotPassword, resetPassword } = require('../Controllers/AuthController');

// when user tries to login, first check the data then call login function
router.post('/login', loginValidation, login);

// same idea for signup, validate first then run the signup logic
router.post('/signup', signupValidation, signup);

router.post('/verify-email', verifyEmail);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password/:token', resetPassword);


module.exports = router;
