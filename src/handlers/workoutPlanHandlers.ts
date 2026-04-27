import {
  listWorkoutPlans as listWorkoutPlansFromStore,
  createWorkoutPlan as createWorkoutPlanInStore,
  getWorkoutPlanById as getWorkoutPlanByIdFromStore,
  updateWorkoutPlan as updateWorkoutPlanInStore,
  deleteWorkoutPlan as deleteWorkoutPlanInStore,
} from '../store/workoutPlanStore';

export const workoutPlanHandlers = {
  listWorkoutPlans: async (_c: any, _req: any, res: any) => {
    return res.json(await listWorkoutPlansFromStore());
  },

  createWorkoutPlan: async (c: any, _req: any, res: any) => {
    try {
      const body = c.request.requestBody;
      const created = await createWorkoutPlanInStore(body);
      return res.status(201).json(created);
    } catch (error: any) {
      console.error('createWorkoutPlan error:', error);
      return res.status(500).json({
        error: 'Failed to create workout plan',
        details: error.message,
      });
    }
  },

  getWorkoutPlanById: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const plan = await getWorkoutPlanByIdFromStore(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    return res.json(plan);
  },

  updateWorkoutPlan: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const body = c.request.requestBody;
    const updated = await updateWorkoutPlanInStore(planId, body);

    if (!updated) {
      return res.status(404).json({ error: 'Workout plan not found' });
    }

    return res.json(updated);
  },

  deleteWorkoutPlan: async (c: any, _req: any, res: any) => {
    try {
      const { planId } = c.request.params;
      const deleted = await deleteWorkoutPlanInStore(planId);

      if (!deleted) {
        return res.status(404).json({ error: 'Workout plan not found' });
      }

      return res.json({ message: 'Deleted successfully' });
    } catch (error: any) {
      console.error('deleteWorkoutPlan error:', error);
      return res.status(500).json({
        error: 'Failed to delete workout plan',
        details: error.message,
      });
    }
  },
};
