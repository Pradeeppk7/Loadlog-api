import { OpenAPIBackend } from "openapi-backend";
import YAML from "yamljs";
import express from "express";
import {
  listWorkoutPlans,
  createWorkoutPlan,
  getWorkoutPlanById,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getExerciseHistory
} from "../store/workoutPlanStore";

const api = new OpenAPIBackend({
  definition: YAML.load("./src/openapi/openapi.yaml"),
  handlers: {
    listWorkoutPlans: async (_c, _req, res) => {
      return res.json(listWorkoutPlans());
    },

    createWorkoutPlan: async (c, _req, res) => {
      const body = c.request.requestBody as any;
      const created = createWorkoutPlan(body);
      return res.status(201).json(created);
    },

    getWorkoutPlanById: async (c, _req, res) => {
      const { planId } = c.request.params;
      const plan = getWorkoutPlanById(planId);

      if (!plan) {
        return res.status(404).json({ error: "Workout plan not found" });
      }

      return res.json(plan);
    },

    updateWorkoutPlan: async (c, _req, res) => {
      const { planId } = c.request.params;
      const body = c.request.requestBody as any;
      const updated = updateWorkoutPlan(planId, body);

      if (!updated) {
        return res.status(404).json({ error: "Workout plan not found" });
      }

      return res.json(updated);
    },

    deleteWorkoutPlan: async (c, _req, res) => {
      const { planId } = c.request.params;
      const deleted = deleteWorkoutPlan(planId);

      if (!deleted) {
        return res.status(404).json({ error: "Workout plan not found" });
      }

      return res.json({ message: "Deleted successfully" });
    },

    getExerciseHistory: async (c, _req, res) => {
      const { exerciseName } = c.request.params;
      return res.json(getExerciseHistory(exerciseName));
    },

    notFound: (_c, _req, res) =>
      res.status(404).json({ error: "Not found" }),

    validationFail: (_c, _req, res) =>
      res.status(400).json({ error: "Validation failed" }),
  },
});

api.init();

export const apiHandler = (req: express.Request, res: express.Response) => {
  api.handleRequest(req as any, req, res);
};