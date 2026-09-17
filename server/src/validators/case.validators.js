const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

// Custom validation for MongoDB ObjectId
const objectIdValidator = z
  .string({ required_error: 'ID is required' })
  .refine((val) => isValidObjectId(val), { message: 'Invalid ID format' });

const raiseCaseSchema = z.object({
  familyMemberId: objectIdValidator,
});

module.exports = {
  raiseCaseSchema,
};
