import {
  listWorkoutPlans,
  createWorkoutPlan,
  getWorkoutPlanById,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getExerciseHistory,
  createWorkoutSession,
  listWorkoutSessions,
  getWorkoutSessionById,
} from "../store/workoutPlanStore";

export const workoutPlanHandlers = {
  listWorkoutPlans: async (_c: any, _req: any, res: any) => {
    return res.json(listWorkoutPlans());
  },

    createWorkoutSession: async (c: any, _req: any, res: any) => {
    const body = c.request.requestBody as any;
    const created = createWorkoutSession(body);
    return res.status(201).json(created);
  },

  createWorkoutPlan: async (c: any, _req: any, res: any) => {
    const body = c.request.requestBody as any;
    const created = createWorkoutPlan(body);
    return res.status(201).json(created);
  },

  getWorkoutPlanById: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const plan = getWorkoutPlanById(planId);

    if (!plan) {
      return res.status(404).json({ error: "Workout plan not found" });
    }

    return res.json(plan);
  },

  updateWorkoutPlan: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const body = c.request.requestBody as any;
    const updated = updateWorkoutPlan(planId, body);

    if (!updated) {
      return res.status(404).json({ error: "Workout plan not found" });
    }

    return res.json(updated);
  },

  deleteWorkoutPlan: async (c: any, _req: any, res: any) => {
    const { planId } = c.request.params;
    const deleted = deleteWorkoutPlan(planId);

    if (!deleted) {
      return res.status(404).json({ error: "Workout plan not found" });
    }

    return res.json({ message: "Deleted successfully" });
  },

  getExerciseHistory: async (c: any, _req: any, res: any) => {
    const { exerciseName } = c.request.params;
    return res.json(getExerciseHistory(exerciseName));
  },

  notFound: (_c: any, _req: any, res: any) => {
    return res.status(404).json({ error: "Not found" });
  },

  validationFail: (c: any, _req: any, res: any) => {
    return res.status(400).json({
      error: "Validation failed",
      details: c.validation?.errors || c.validation?.schema || []
    });
  },

  listWorkoutSessions: async (_c: any, _req: any, res: any) => {
    return res.json(listWorkoutSessions());
  },

  getWorkoutSessionById: async (c: any, _req: any, res: any) => {
    const { sessionId } = c.request.params;
    const session = getWorkoutSessionById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Workout session not found" });
    }

    return res.json(session);
  },
};