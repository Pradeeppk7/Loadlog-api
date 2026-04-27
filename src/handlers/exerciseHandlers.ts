import { getExerciseHistory as getExerciseHistoryFromStore } from '../store/exerciseStore';

export const exerciseHandlers = {
  getExerciseHistory: async (c: any, _req: any, res: any) => {
    const { exerciseName } = c.request.params;
    return res.json(await getExerciseHistoryFromStore(exerciseName));
  },
};
