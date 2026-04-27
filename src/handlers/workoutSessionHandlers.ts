import {
  createWorkoutSession as createWorkoutSessionInStore,
  listWorkoutSessions as listWorkoutSessionsFromStore,
  getWorkoutSessionById as getWorkoutSessionByIdFromStore,
} from '../store/workoutSessionStore';
import { CreateWorkoutSessionInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiRequest, ApiResponse } from '../types/api';

export const workoutSessionHandlers = {
  createWorkoutSession: async (
    c: ApiHandlerContext<CreateWorkoutSessionInput>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const body = c.request.requestBody;
    const created = await createWorkoutSessionInStore(body);
    return res.status(201).json(created);
  },

  listWorkoutSessions: async (_c: ApiHandlerContext, _req: ApiRequest, res: ApiResponse) => {
    return res.json(await listWorkoutSessionsFromStore());
  },

  getWorkoutSessionById: async (
    c: ApiHandlerContext<unknown, { sessionId: string }>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const { sessionId } = c.request.params;
    const session = await getWorkoutSessionByIdFromStore(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    return res.json(session);
  },
};
