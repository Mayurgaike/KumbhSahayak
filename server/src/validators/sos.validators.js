const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

const objectIdValidator = z
  .string({ required_error: 'ID is required' })
  .refine((val) => isValidObjectId(val), { message: 'Invalid ID format' });

const raiseSOSSchema = z.object({
  type: z.enum(['medical', 'police', 'mass-incident'], {
    required_error: 'Emergency type is required',
    invalid_type_error: 'Type must be medical, police, or mass-incident',
  }),
  zoneId: objectIdValidator,
});

module.exports = {
  raiseSOSSchema,
};
