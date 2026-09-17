const { z } = require('zod');

// Schema for adding a family member. 
// Uses `coerce` because data sent via multipart/form-data arrives as strings.
const addFamilyMemberSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100),
  age: z.coerce
    .number({ required_error: 'Age is required' })
    .int('Age must be an integer')
    .min(0, 'Age cannot be negative')
    .max(150, 'Age is too high'),
  guardianContact: z
    .string({ required_error: 'Guardian contact is required' })
    .trim()
    .min(10, 'Contact must be at least 10 characters')
    .max(15)
    .regex(/^\+?[0-9]+$/, 'Contact must contain only digits and an optional leading +'),
  address: z
    .string({ required_error: 'Address is required' })
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(500),
  passphrase: z
    .string({ required_error: 'Passphrase is required' })
    .trim()
    .min(4, 'Passphrase must be at least 4 characters')
    .max(100),
});

module.exports = {
  addFamilyMemberSchema,
};
