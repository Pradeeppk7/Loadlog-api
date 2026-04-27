import Joi from 'joi';

export const workoutPlanValidation = {
  create: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).allow(''),
    exercises: Joi.array()
      .items(
        Joi.object({
          exerciseName: Joi.string().min(1).max(100).required(),
          order: Joi.number().integer().min(1).required(),
          sets: Joi.array()
            .items(
              Joi.object({
                setNumber: Joi.number().integer().min(1).required(),
                targetReps: Joi.number().integer().min(1).max(100).required(),
                targetWeight: Joi.number().min(0).max(1000).required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(100),
    description: Joi.string().max(500).allow(''),
    exercises: Joi.array().items(
      Joi.object({
        exerciseName: Joi.string().min(1).max(100).required(),
        order: Joi.number().integer().min(1).required(),
        sets: Joi.array()
          .items(
            Joi.object({
              setNumber: Joi.number().integer().min(1).required(),
              targetReps: Joi.number().integer().min(1).max(100).required(),
              targetWeight: Joi.number().min(0).max(1000).required(),
            })
          )
          .min(1)
          .required(),
      })
    ),
  }),
};

export const workoutSessionValidation = {
  create: Joi.object({
    planId: Joi.string().uuid().required(),
    performedAt: Joi.date().iso().allow(null),
    notes: Joi.string().max(1000).allow(''),
    exercises: Joi.array()
      .items(
        Joi.object({
          exerciseName: Joi.string().min(1).max(100).required(),
          sets: Joi.array()
            .items(
              Joi.object({
                setNumber: Joi.number().integer().min(1).required(),
                actualReps: Joi.number().integer().min(0).max(100).required(),
                actualWeight: Joi.number().min(0).max(1000).required(),
              })
            )
            .min(1)
            .required(),
        })
      )
      .min(1)
      .required(),
  }),
};

export const coachChatValidation = Joi.object({
  message: Joi.string().trim().min(1).max(4000).required(),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant').required(),
        content: Joi.string().trim().min(1).max(4000).required(),
      })
    )
    .max(20)
    .default([]),
  profile: Joi.object({
    name: Joi.string().trim().max(100),
    goal: Joi.string().trim().max(500),
    dietaryPreferences: Joi.string().trim().max(500),
    injuriesOrLimitations: Joi.string().trim().max(500),
  }).default({}),
});

export const validateInput = <T>(schema: Joi.ObjectSchema<T>, data: unknown): T => {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }

  return value;
};
