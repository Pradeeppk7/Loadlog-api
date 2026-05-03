import { createUser, getUserById, updateUser } from '../store/userStore';
import { listWorkoutPlansPaginated } from '../store/workoutPlanStore';
import { listWorkoutSessionsPaginated } from '../store/workoutSessionStore';
import { CreateUserInput, UpdateUserInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiResponse, AuthenticatedRequest } from '../types/api';
import { getAuthenticatedUserId } from '../middleware/auth';
import { normalizePagination } from '../utils/pagination';

export const userHandlers = {
  listUsers: async (_c: ApiHandlerContext, req: AuthenticatedRequest, res: ApiResponse) => {
    const authenticatedUserId = getAuthenticatedUserId(req);
    const user = await getUserById(authenticatedUserId);
    return res.json(user ? [user] : []);
  },

  createUser: async (
    c: ApiHandlerContext<CreateUserInput>,
    _req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const created = await createUser(c.request.requestBody);
    return res.status(201).json(created);
  },

  getUserById: async (
    c: ApiHandlerContext<unknown, { userId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);

    if (authenticatedUserId !== c.request.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await getUserById(c.request.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  },

  updateUser: async (
    c: ApiHandlerContext<UpdateUserInput, { userId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);

    if (authenticatedUserId !== c.request.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await updateUser(c.request.params.userId, c.request.requestBody);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  },

  listUserWorkoutPlans: async (
    c: ApiHandlerContext<unknown, { userId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);

    if (authenticatedUserId !== c.request.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await getUserById(c.request.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { page, pageSize } = normalizePagination({
      ...(typeof req.query['page'] === 'string' ? { page: req.query['page'] } : {}),
      ...(typeof req.query['pageSize'] === 'string' ? { pageSize: req.query['pageSize'] } : {}),
    });

    return res.json(
      await listWorkoutPlansPaginated({
        userId: c.request.params.userId,
        page,
        pageSize,
      })
    );
  },

  listUserWorkoutSessions: async (
    c: ApiHandlerContext<unknown, { userId: string }>,
    req: AuthenticatedRequest,
    res: ApiResponse
  ) => {
    const authenticatedUserId = getAuthenticatedUserId(req);

    if (authenticatedUserId !== c.request.params.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await getUserById(c.request.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { page, pageSize } = normalizePagination({
      ...(typeof req.query['page'] === 'string' ? { page: req.query['page'] } : {}),
      ...(typeof req.query['pageSize'] === 'string' ? { pageSize: req.query['pageSize'] } : {}),
    });

    return res.json(
      await listWorkoutSessionsPaginated({
        userId: c.request.params.userId,
        page,
        pageSize,
      })
    );
  },
};
