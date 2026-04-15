import {
  createWorkoutSession as createWorkoutSessionInStore,
  listWorkoutSessions as listWorkoutSessionsFromStore,
  getWorkoutSessionById as getWorkoutSessionByIdFromStore,
} from "../store/workoutSessionStore";

export const workoutSessionHandlers = {
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
};