export const commonHandlers = {
  notFound: (_c: any, _req: any, res: any) => {
    return res.status(404).json({ error: 'Not found' });
  },

  validationFail: (c: any, _req: any, res: any) => {
    return res.status(400).json({
      error: 'Validation failed',
      details: c.validation?.errors || [],
    });
  },
};
