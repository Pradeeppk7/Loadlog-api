import { Request } from 'express';
import { getCoachChatReply } from '../services/coachChatService';
import { CoachChatInput } from '../services/coachChatService';
import { ApiResponse, AuthenticatedRequest } from '../types/api';
import { coachChatValidation, validateInput } from '../utils/validation';
import { getAuthenticatedUserId } from '../middleware/auth';

export const aiHandlers = {
  coachChat: async (_c: unknown, req: Request, res: ApiResponse) => {
    try {
      const authenticatedRequest = req as AuthenticatedRequest;
      const input = validateInput<CoachChatInput>(coachChatValidation, req.body);
      const reply = await getCoachChatReply({
        ...input,
        userId: getAuthenticatedUserId(authenticatedRequest),
      });

      return res.status(200).json({
        reply,
        model: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate coach response';
      const statusCode = message.includes('GEMINI_API_KEY is not configured') ? 503 : 500;

      return res.status(statusCode).json({
        error: 'Coach chat failed',
        details: message,
      });
    }
  },
};
