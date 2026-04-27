import { createUser, getUserById, listUsers, updateUser } from '../store/userStore';
import { listWorkoutPlansPaginated } from '../store/workoutPlanStore';
import { listWorkoutSessionsPaginated } from '../store/workoutSessionStore';
import { CreateUserInput, UpdateUserInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiRequest, ApiResponse } from '../types/api';
import { normalizePagination } from '../utils/pagination';

export const userHandlers = {
  listUsers: async (_c: ApiHandlerContext, _req: ApiRequest, res: ApiResponse) => {
    return res.json(await listUsers());
  },

  createUser: async (c: ApiHandlerContext<CreateUserInput>, _req: ApiRequest, res: ApiResponse) => {
    const created = await createUser(c.request.requestBody);
    return res.status(201).json(created);
  },

  getUserById: async (
    c: ApiHandlerContext<unknown, { userId: string }>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const user = await getUserById(c.request.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  },

  updateUser: async (
    c: ApiHandlerContext<UpdateUserInput, { userId: string }>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const user = await updateUser(c.request.params.userId, c.request.requestBody);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  },

  listUserWorkoutPlans: async (
    c: ApiHandlerContext<unknown, { userId: string }>,
    req: ApiRequest,
    res: ApiResponse
  ) => {
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
    req: ApiRequest,
    res: ApiResponse
  ) => {
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
