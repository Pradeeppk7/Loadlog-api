import { getCoachChatReply } from '../services/coachChatService';
import { coachChatValidation, validateInput } from '../utils/validation';

export const aiHandlers = {
  coachChat: async (_c: any, req: any, res: any) => {
    try {
      const input = validateInput(coachChatValidation, req.body);
      const reply = await getCoachChatReply(input);

      return res.status(200).json({
        reply,
        model: 'gemini',
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
