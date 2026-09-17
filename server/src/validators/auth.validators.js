const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must be at most 15 characters')
    .regex(/^\+?[0-9]+$/, 'Phone number must contain only digits and an optional leading +'),
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .optional(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

const loginSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(1, 'Phone number is required'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};
