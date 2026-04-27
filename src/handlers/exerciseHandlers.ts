import { getExerciseHistory as getExerciseHistoryFromStore } from '../store/exerciseStore';
import { ApiHandlerContext, ApiRequest, ApiResponse } from '../types/api';

export const exerciseHandlers = {
  getExerciseHistory: async (
    c: ApiHandlerContext<unknown, { exerciseName: string }>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const { exerciseName } = c.request.params;
    return res.json(await getExerciseHistoryFromStore(exerciseName));
  },
};
