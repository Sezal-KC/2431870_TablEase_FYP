const Joi = require('joi');

// Validation schema for signup
const signupValidation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
      }),

    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'np'] } })
      .required()
      .trim()
      .lowercase()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),

    password: Joi.string()
      .min(8)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character (@$!%*?&)',
        'any.required': 'Password is required'
      }),

    role: Joi.string()
      .valid('waiter', 'cashier', 'manager', 'admin', 'kitchen_staff')
      .required()
      .messages({
        'any.only': 'Invalid role selected',
        'any.required': 'Role is required'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      message: 'Validation failed',
      errors,
      success: false
    });
  }

  next();
};

// Validation schema for login
const loginValidation = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'np'] } })
      .required()
      .trim()
      .lowercase()
      .messages({
        'string.email': 'Please enter a valid email address',
        'any.required': 'Email is required'
      }),

    password: Joi.string()
      .min(6)
      .max(100)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
      }),

    role: Joi.string()
      .valid('waiter', 'cashier', 'manager', 'admin', 'kitchen_staff') 
      .messages({
        'any.only': 'Invalid role selected'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      message: 'Validation failed',
      errors,
      success: false
    });
  }

  next();
};

module.exports = {
  signupValidation,
  loginValidation
};