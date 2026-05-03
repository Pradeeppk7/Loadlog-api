import Joi from 'joi';
import {
  CreateUserInput,
  CreateWorkoutPlanInput,
  CreateWorkoutSessionInput,
  LoginInput,
  RegisterUserInput,
  UpdateUserInput,
} from '../models/workoutPlanModels';
import { CoachChatInput } from '../services/coachChatService';

export const workoutPlanValidation = {
  create: Joi.object<CreateWorkoutPlanInput>({
    name: Joi.string().min(1).max(100).required(),
    userId: Joi.string().uuid(),
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

  update: Joi.object<CreateWorkoutPlanInput>({
    name: Joi.string().min(1).max(100),
    userId: Joi.string().uuid(),
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
  create: Joi.object<CreateWorkoutSessionInput>({
    userId: Joi.string().uuid(),
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

export const coachChatValidation = Joi.object<CoachChatInput>({
  message: Joi.string().trim().min(1).max(4000).required(),
  userId: Joi.string().uuid(),
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
    experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
  }).default({}),
});

const passwordSchema = Joi.string().min(8).max(128).required();

export const authValidation = {
  register: Joi.object<RegisterUserInput>({
    name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().trim().email().required(),
    password: passwordSchema,
    age: Joi.number().integer().min(13).max(120),
    coachProfile: Joi.object({
      goal: Joi.string().trim().max(500),
      dietaryPreferences: Joi.string().trim().max(500),
      injuriesOrLimitations: Joi.string().trim().max(500),
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    }),
  }),
  login: Joi.object<LoginInput>({
    email: Joi.string().trim().email().required(),
    password: passwordSchema,
  }),
};

export const userValidation = {
  create: Joi.object<CreateUserInput>({
    name: Joi.string().trim().min(1).max(100).required(),
    email: Joi.string().trim().email().required(),
    age: Joi.number().integer().min(13).max(120),
    coachProfile: Joi.object({
      goal: Joi.string().trim().max(500),
      dietaryPreferences: Joi.string().trim().max(500),
      injuriesOrLimitations: Joi.string().trim().max(500),
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    }),
  }),
  update: Joi.object<UpdateUserInput>({
    name: Joi.string().trim().min(1).max(100),
    email: Joi.string().trim().email(),
    age: Joi.number().integer().min(13).max(120),
    coachProfile: Joi.object({
      goal: Joi.string().trim().max(500),
      dietaryPreferences: Joi.string().trim().max(500),
      injuriesOrLimitations: Joi.string().trim().max(500),
      experienceLevel: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    }),
  }),
};

export const validateInput = <T>(schema: Joi.ObjectSchema<T>, data: unknown): T => {
  const validationResult: Joi.ValidationResult<T> = schema.validate(data, { abortEarly: false });
  const error = validationResult.error;
  const value = validationResult.value as T;

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }

  return value;
};
