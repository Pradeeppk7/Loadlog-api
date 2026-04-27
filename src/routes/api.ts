import { Document, OpenAPIBackend, Request as OpenAPIRequest } from 'openapi-backend';
import YAML from 'yamljs';
import express from 'express';
import path from 'path';
import { workoutPlanHandlers } from '../handlers/workoutPlanHandlers';
import { workoutSessionHandlers } from '../handlers/workoutSessionHandlers';
import { exerciseHandlers } from '../handlers/exerciseHandlers';
import { commonHandlers } from '../handlers/commonHandlers';
import { aiHandlers } from '../handlers/aiHandlers';

const definitionPath = path.join(process.cwd(), 'src', 'openapi', 'openapi.yaml');
const definition = YAML.load(definitionPath) as Document;

const api = new OpenAPIBackend({
  definition,
  validate: true,
});

api.register(workoutPlanHandlers);
api.register(workoutSessionHandlers);
api.register(exerciseHandlers);
api.register(aiHandlers);
api.register(commonHandlers);
void api.init();

export const apiHandler = (req: express.Request, res: express.Response) => {
  return api.handleRequest(req as unknown as OpenAPIRequest, req, res);
};
