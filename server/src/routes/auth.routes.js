const { Router } = require('express');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema, refreshSchema } = require('../validators/auth.validators');
const authController = require('../controllers/auth.controller');

const router = Router();

// POST /api/auth/register — visitor self-registration (no auth required)
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login — authenticate any user (no auth required)
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh — exchange refresh token for new access token (no auth required)
router.post('/refresh', validate(refreshSchema), authController.refresh);

module.exports = router;
