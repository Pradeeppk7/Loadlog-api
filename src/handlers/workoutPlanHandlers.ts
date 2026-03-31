import {
  listWorkoutPlans as listWorkoutPlansFromStore,
  createWorkoutPlan as createWorkoutPlanInStore,
  getWorkoutPlanById as getWorkoutPlanByIdFromStore,
  updateWorkoutPlan as updateWorkoutPlanInStore,
  deleteWorkoutPlan as deleteWorkoutPlanInStore,
  getExerciseHistory as getExerciseHistoryFromStore,
  createWorkoutSession as createWorkoutSessionInStore,
  listWorkoutSessions as listWorkoutSessionsFromStore,
  getWorkoutSessionById as getWorkoutSessionByIdFromStore,
} from "../store/workoutPlanStore";

export const workoutPlanHandlers = {
  listWorkoutPlans: async (_c: any, _req: any, res: any) => {
    return res.json(await listWorkoutPlansFromStore());
  },

  createWorkoutPlan: async (c: any, _req: any, res: any) => {
    try {
      const body = c.request.requestBody as any;
      const created = await createWorkoutPlanInStore(body);
      return res.status(201).json(created);
    } catch (error: any) {
      console.error("createWorkoutPlan error:", error);
      return res.status(500).json({
        error: "Failed to create workout plan",
        details: error.message,
      });
    }
  },

  getWorkoutPlanById: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const plan = await getWorkoutPlanByIdFromStore(planId);

    if (!plan) {
      return res.status(404).json({ error: "Workout plan not found" });
    }

    return res.json(plan);
  },

  updateWorkoutPlan: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const body = c.request.requestBody as any;
    const updated = await updateWorkoutPlanInStore(planId, body);

    if (!updated) {
      return res.status(404).json({ error: "Workout plan not found" });
    }

    return res.json(updated);
  },

  deleteWorkoutPlan: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const deleted = await deleteWorkoutPlanInStore(planId);

    if (!deleted) {
      return res.status(404).json({ error: "Workout plan not found" });
    }

    return res.json({ message: "Deleted successfully" });
  },

  getExerciseHistory: async (c: any, _req: any, res: any) => {
    const { exerciseName } = c.request.params;
    return res.json(await getExerciseHistoryFromStore(exerciseName));
  },

  createWorkoutSession: async (c: any, _req: any, res: any) => {
    const body = c.request.requestBody as any;
    const created = await createWorkoutSessionInStore(body);
    return res.status(201).json(created);
  },

  listWorkoutSessions: async (_c: any, _req: any, res: any) => {
    return res.json(await listWorkoutSessionsFromStore());
  },

  getWorkoutSessionById: async (c: any, _req: any, res: any) => {
    const { sessionId } = c.request.params;
    const session = await getWorkoutSessionByIdFromStore(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Workout session not found" });
    }

    return res.json(session);
  },

  notFound: (_c: any, _req: any, res: any) => {
    return res.status(404).json({ error: "Not found" });
  },

  validationFail: (c: any, _req: any, res: any) => {
    return res.status(400).json({
      error: "Validation failed",
      details: c.validation?.errors || [],
    });
  },
};