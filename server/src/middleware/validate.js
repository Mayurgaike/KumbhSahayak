const { ZodError } = require('zod');

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with consistent error shape on validation failure.
 *
 * Usage: router.post('/route', validate(mySchema), controller)
 */
function validate(zodSchema) {
  return (req, res, next) => {
    try {
      req.body = zodSchema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: err.issues.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(err);
    }
  };
}

module.exports = validate;
