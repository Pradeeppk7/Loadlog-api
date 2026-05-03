import {
  listWorkoutPlansPaginated as listWorkoutPlansPaginatedFromStore,
  createWorkoutPlan as createWorkoutPlanInStore,
  getWorkoutPlanById as getWorkoutPlanByIdFromStore,
  updateWorkoutPlan as updateWorkoutPlanInStore,
  deleteWorkoutPlan as deleteWorkoutPlanInStore,
} from '../store/workoutPlanStore';
import { CreateWorkoutPlanInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiResponse, AuthenticatedRequest } from '../types/api';
import { getAuthenticatedUserId } from '../middleware/auth';
import { normalizePagination } from '../utils/pagination';

export const workoutPlanHandlers = {
  listWorkoutPlans: async (_c: ApiHandlerContext, req: AuthenticatedRequest, res: ApiResponse) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { page, pageSize } = normalizePagination({
        ...(typeof req.query['page'] === 'string' ? { page: req.query['page'] } : {}),
        ...(typeof req.query['pageSize'] === 'string' ? { pageSize: req.query['pageSize'] } : {}),
      });

      return res.json(
        await listWorkoutPlansPaginatedFromStore({
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

  createWorkoutPlan: async (
    c: ApiHandlerContext<CreateWorkoutPlanInput>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const body = {
        ...c.request.requestBody,
        userId: authenticatedUserId,
      };
      const created = await createWorkoutPlanInStore(body);
      return res.status(201).json(created);
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      console.error('createWorkoutPlan error:', error);
      return res.status(500).json({
        error: 'Failed to create workout plan',
        details,
      });
    }
  },

  getWorkoutPlanById: async (
    c: ApiHandlerContext<unknown, { planId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const { planId } = c.request.params;
    const plan = await getWorkoutPlanByIdFromStore(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    if (plan.userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(plan);
  },

  updateWorkoutPlan: async (
    c: ApiHandlerContext<CreateWorkoutPlanInput, { planId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const { planId } = c.request.params;
    const existing = await getWorkoutPlanByIdFromStore(planId);

    if (!existing) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    if (existing.userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = {
      ...c.request.requestBody,
      userId: authenticatedUserId,
    };
    const updated = await updateWorkoutPlanInStore(planId, body);

    if (!updated) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    return res.json(updated);
  },

  deleteWorkoutPlan: async (
    c: ApiHandlerContext<unknown, { planId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    try {
      const authenticatedUserId = getAuthenticatedUserId(req);
      const { planId } = c.request.params;
      const existing = await getWorkoutPlanByIdFromStore(planId);

      if (!existing) {
        return res.status(404).json({ error: 'Workout plan not found' });
      }

      if (existing.userId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const deleted = await deleteWorkoutPlanInStore(planId);

      if (!deleted) {
        return res.status(404).json({ error: 'Workout plan not found' });
      }

      return res.json({ message: 'Deleted successfully' });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      console.error('deleteWorkoutPlan error:', error);
      return res.status(500).json({
        error: 'Failed to delete workout plan',
        details,
      });
    }
  },
};
