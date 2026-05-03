import type { Request, Response } from 'express';
import { getAuthenticatedUser, loginUser, registerUser } from '../services/authService';
import type { AuthenticatedRequest } from '../types/api';
import type { LoginInput, RegisterUserInput } from '../models/workoutPlanModels';
import { authValidation, validateInput } from '../utils/validation';

export const authHandlers = {
  register: async (req: Request, res: Response) => {
    try {
      const input = validateInput<RegisterUserInput>(authValidation.register, req.body);
      const payload = await registerUser(input);
      return res.status(201).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      const status = message.includes('already exists') ? 409 : 400;

      return res.status(status).json({
        error: 'Registration failed',
        details: message,
      });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const input = validateInput<LoginInput>(authValidation.login, req.body);
      const payload = await loginUser(input);
      return res.status(200).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login';
      const status = message.includes('Invalid email or password') ? 401 : 400;

      return res.status(status).json({
        error: 'Login failed',
        details: message,
      });
    }
  },

  me: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await getAuthenticatedUser(userId);

      if (!user) {
        return res.status(401).json({ error: 'Authenticated user no longer exists' });
      }

      return res.status(200).json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch authenticated user';
      return res.status(500).json({
        error: 'Failed to fetch authenticated user',
        details: message,
      });
    }
  },
};
