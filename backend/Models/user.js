const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['waiter', 'cashier', 'manager', 'admin', 'kitchen_staff'],
    required: true
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: {
    type: String
  },

  emailVerificationExpires: {
    type: Date
  }

}, { timestamps: true });

const UserModel = mongoose.model('users', UserSchema);
module.exports = UserModel;
