import {
  createWorkoutSession as createWorkoutSessionInStore,
  listWorkoutSessionsPaginated as listWorkoutSessionsPaginatedFromStore,
  getWorkoutSessionById as getWorkoutSessionByIdFromStore,
} from '../store/workoutSessionStore';
import { getWorkoutPlanById as getWorkoutPlanByIdFromStore } from '../store/workoutPlanStore';
import { CreateWorkoutSessionInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiResponse, AuthenticatedRequest } from '../types/api';
import { getAuthenticatedUserId } from '../middleware/auth';
import { normalizePagination } from '../utils/pagination';

export const workoutSessionHandlers = {
  createWorkoutSession: async (
    c: ApiHandlerContext<CreateWorkoutSessionInput>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const body = {
      ...c.request.requestBody,
      userId: authenticatedUserId,
    };
    const plan = await getWorkoutPlanByIdFromStore(body.planId);

    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    if (plan.userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const created = await createWorkoutSessionInStore(body);
    return res.status(201).json(created);
  },

  listWorkoutSessions: async (
    _c: ApiHandlerContext,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { page, pageSize } = normalizePagination({
        ...(typeof req.query['page'] === 'string' ? { page: req.query['page'] } : {}),
        ...(typeof req.query['pageSize'] === 'string' ? { pageSize: req.query['pageSize'] } : {}),
      });

      return res.json(
        await listWorkoutSessionsPaginatedFromStore({
          userId: authenticatedUserId,
          page,
          pageSize,
        })
      );
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
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const { sessionId } = c.request.params;
    const session = await getWorkoutSessionByIdFromStore(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    if (session.userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(session);
  },
};
