const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

const objectIdValidator = z
  .string({ required_error: 'ID is required' })
  .refine((val) => isValidObjectId(val), { message: 'Invalid ID format' });

const createVolunteerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(10, 'Phone number must be at least 10 characters')
    .regex(/^\+?[0-9]+$/, 'Phone number must contain only digits and an optional leading +'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters'),
  zoneId: objectIdValidator,
});

module.exports = {
  createVolunteerSchema,
};
