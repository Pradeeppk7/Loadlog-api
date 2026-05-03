import { getExerciseHistory as getExerciseHistoryFromStore } from '../store/exerciseStore';
import { ApiHandlerContext, ApiResponse, AuthenticatedRequest } from '../types/api';
import { getAuthenticatedUserId } from '../middleware/auth';

export const exerciseHandlers = {
  getExerciseHistory: async (
    c: ApiHandlerContext<unknown, { exerciseName: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const { exerciseName } = c.request.params;
    return res.json(await getExerciseHistoryFromStore(exerciseName, authenticatedUserId));
  },
};
