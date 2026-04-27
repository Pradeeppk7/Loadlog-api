import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';

export type ApiHandlerContext<RequestBody = unknown, Params = Record<string, string>> = Context<
  RequestBody,
  Params
>;

export type ApiRequest = Request;
export type ApiResponse = Response;
