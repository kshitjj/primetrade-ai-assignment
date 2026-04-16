// middlewares/validation.ts
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Common email sanitization & validation (reused everywhere)
export const sanitizeEmail = [
  body('email')
    .trim()
    .normalizeEmail({ gmail_remove_dots: false })
    .isEmail()
    .withMessage('Valid email address is required')
];

// Registration-specific password validation (strong)
// Personally I don't like to put all this in development environment.
//
// export const validateStrongPassword = [
//   body('password')
//     .trim()
//     .isLength({ min: 8 })
//     .withMessage('Password must be at least 8 characters')
//     .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
//     .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
//     .matches(/[0-9]/).withMessage('Password must contain at least one number')
//     .matches(/[!@#$%^&*(),.?":{}|<>]/)
//     .withMessage('Password must contain at least one special character')
// ];

// Login-specific password validation (only non-empty, minimal)
export const validateLoginPassword = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
];

// Generic error checker middleware
export const checkValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registration middleware chain
export const registrationValidation = [
  ...sanitizeEmail,
//  ...validateStrongPassword, (THIS SHOULDN'T BE COMMENTED IN PRODUCTION, I HATE IT THAT's why I have commented it out.)
  checkValidationErrors
];

// Login middleware chain
export const loginValidation = [
  ...sanitizeEmail,
  ...validateLoginPassword,
  checkValidationErrors
];

