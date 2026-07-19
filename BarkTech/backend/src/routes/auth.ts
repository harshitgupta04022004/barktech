import { FastifyInstance } from 'fastify';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

export async function authRoutes(app: FastifyInstance) {
  // Public routes
  app.post('/register', authController.register);
  app.post('/login', authController.login);
  app.post('/forgot-password', authController.forgotPassword);
  app.post('/reset-password', authController.resetPassword);

  // Google OAuth — redirect flow (GET callback from Google)
  app.get('/google/callback', authController.googleCallback);

  // Google OAuth — token exchange flow (POST from frontend with auth code)
  app.post('/google/token', authController.googleTokenLogin);

  // Protected routes
  app.get('/profile', { preHandler: [authenticate] }, authController.profile);
  app.put('/profile', { preHandler: [authenticate] }, authController.updateProfile);
  app.put('/change-password', { preHandler: [authenticate] }, authController.changePassword);
}
