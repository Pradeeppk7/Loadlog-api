import { ApiHandlerContext, ApiRequest, ApiResponse } from '../types/api';

export const commonHandlers = {
  notFound: (_c: ApiHandlerContext, _req: ApiRequest, res: ApiResponse) => {
    return res.status(404).json({ error: 'Not found' });
  },

  validationFail: (c: ApiHandlerContext, _req: ApiRequest, res: ApiResponse) => {
    return res.status(400).json({
      error: 'Validation failed',
      details: c.validation?.errors || [],
    });
  },
};
