import { OpenAPIBackend } from "openapi-backend";
import YAML from "yamljs";
import express from "express";
import { workoutPlanHandlers } from "../handlers/workoutPlanHandlers";

const api = new OpenAPIBackend({
  definition: YAML.load("./src/openapi/openapi.yaml"),
  handlers: workoutPlanHandlers,
  validate: true,
});

api.init();

export const apiHandler = (req: express.Request, res: express.Response) => {
  api.handleRequest(req as any, req, res);
};