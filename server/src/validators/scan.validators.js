const { z } = require('zod');

const verifyScanSchema = z.object({
  passphrase: z
    .string({ required_error: 'Passphrase is required' })
    .trim()
    .min(1, 'Passphrase cannot be empty'),
  location: z
    .string({ required_error: 'Location is required' })
    .trim()
    .min(2, 'Location name is too short'),
});

module.exports = {
  verifyScanSchema,
};
