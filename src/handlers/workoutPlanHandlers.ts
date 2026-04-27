import {
  listWorkoutPlans as listWorkoutPlansFromStore,
  createWorkoutPlan as createWorkoutPlanInStore,
  getWorkoutPlanById as getWorkoutPlanByIdFromStore,
  updateWorkoutPlan as updateWorkoutPlanInStore,
  deleteWorkoutPlan as deleteWorkoutPlanInStore,
} from '../store/workoutPlanStore';
import { CreateWorkoutPlanInput } from '../models/workoutPlanModels';
import { ApiHandlerContext, ApiRequest, ApiResponse } from '../types/api';

export const workoutPlanHandlers = {
  listWorkoutPlans: async (_c: ApiHandlerContext, _req: ApiRequest, res: ApiResponse) => {
    return res.json(await listWorkoutPlansFromStore());
  },

  createWorkoutPlan: async (
    c: ApiHandlerContext<CreateWorkoutPlanInput>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    try {
      const body = c.request.requestBody;
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
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const { planId } = c.request.params;
    const plan = await getWorkoutPlanByIdFromStore(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    return res.json(plan);
  },

  updateWorkoutPlan: async (
    c: ApiHandlerContext<CreateWorkoutPlanInput, { planId: string }>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    const { planId } = c.request.params;
    const body = c.request.requestBody;
    const updated = await updateWorkoutPlanInStore(planId, body);

    if (!updated) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    return res.json(updated);
  },

  deleteWorkoutPlan: async (
    c: ApiHandlerContext<unknown, { planId: string }>,
    _req: ApiRequest,
    res: ApiResponse
  ) => {
    try {
      const { planId } = c.request.params;
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
