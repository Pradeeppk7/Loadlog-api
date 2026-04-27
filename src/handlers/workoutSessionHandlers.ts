import {
  createWorkoutSession as createWorkoutSessionInStore,
  listWorkoutSessionsPaginated as listWorkoutSessionsPaginatedFromStore,
  getWorkoutSessionById as getWorkoutSessionByIdFromStore,
} from '../store/workoutSessionStore';
import { CreateWorkoutSessionInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiRequest, ApiResponse } from '../types/api';
import { normalizePagination } from '../utils/pagination';

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

  listWorkoutSessions: async (_c: ApiHandlerContext, req: ApiRequest, res: ApiResponse) => {
    try {
      const { page, pageSize } = normalizePagination({
        ...(typeof req.query['page'] === 'string' ? { page: req.query['page'] } : {}),
        ...(typeof req.query['pageSize'] === 'string' ? { pageSize: req.query['pageSize'] } : {}),
      });

      return res.json(await listWorkoutSessionsPaginatedFromStore({ page, pageSize }));
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(400).json({
        error: 'Invalid pagination parameters',
        details,
      });
    }
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
