import { GraphQLError } from 'graphql';
import {
  CreateUserInput,
  CreateWorkoutPlanInput,
  CreateWorkoutSessionInput,
  UpdateUserInput,
} from '../models/workoutPlanModels';
import { getCoachChatReply } from '../services/coachChatService';
import { createWorkoutPlan, deleteWorkoutPlan, updateWorkoutPlan } from '../store/workoutPlanStore';
import { createWorkoutSession } from '../store/workoutSessionStore';
import { createUser, updateUser } from '../store/userStore';
import {
  coachChatValidation,
  userValidation,
  validateInput,
  workoutPlanValidation,
  workoutSessionValidation,
} from '../utils/validation';
import logger from '../utils/logger';
import { databaseError, notFound, validationError } from './errors';

export const mutationResolvers = {
  createWorkoutPlan: async ({ input }: { input: unknown }) => {
    try {
      logger.debug('Creating workout plan');
      const validatedInput = validateInput<CreateWorkoutPlanInput>(
        workoutPlanValidation.create,
        input
      );
      const plan = await createWorkoutPlan(validatedInput);
      logger.info('Workout plan created successfully', { planId: plan.id });
      return plan;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.message.includes('Validation error')) {
        validationError(error.message);
      }
      logger.error('Error creating workout plan', { error, input });
      databaseError('Failed to create workout plan');
    }
  },

  updateWorkoutPlan: async ({ planId, input }: { planId: string; input: unknown }) => {
    try {
      logger.debug('Updating workout plan', { planId });
      const validatedInput = validateInput<CreateWorkoutPlanInput>(
        workoutPlanValidation.update,
        input
      );
      const plan = await updateWorkoutPlan(planId, validatedInput);

      if (!plan) {
        notFound('Workout plan not found');
      }

      logger.info('Workout plan updated successfully', { planId });
      return plan;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.message.includes('Validation error')) {
        validationError(error.message);
      }
      logger.error('Error updating workout plan', { error, planId, input });
      databaseError('Failed to update workout plan');
    }
  },

  deleteWorkoutPlan: async ({ planId }: { planId: string }) => {
    try {
      logger.debug('Deleting workout plan', { planId });
      const deleted = await deleteWorkoutPlan(planId);

      if (!deleted) {
        notFound('Workout plan not found');
      }

      logger.info('Workout plan deleted successfully', { planId });
      return { success: true };
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error deleting workout plan', { error, planId });
      databaseError('Failed to delete workout plan');
    }
  },

  createWorkoutSession: async ({ input }: { input: unknown }) => {
    try {
      logger.debug('Creating workout session');
      const validatedInput = validateInput<CreateWorkoutSessionInput>(
        workoutSessionValidation.create,
        input
      );
      const session = await createWorkoutSession(validatedInput);
      logger.info('Workout session created successfully', { sessionId: session.id });
      return session;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.message.includes('Validation error')) {
        validationError(error.message);
      }
      logger.error('Error creating workout session', { error, input });
      databaseError('Failed to create workout session');
    }
  },

  createUser: async ({ input }: { input: unknown }) => {
    try {
      const validatedInput = validateInput<CreateUserInput>(userValidation.create, input);
      return await createUser(validatedInput);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.message.includes('Validation error')) {
        validationError(error.message);
      }
      logger.error('Error creating user', { error, input });
      databaseError('Failed to create user');
    }
  },

  updateUser: async ({ userId, input }: { userId: string; input: unknown }) => {
    try {
      const validatedInput = validateInput<UpdateUserInput>(userValidation.update, input);
      const user = await updateUser(userId, validatedInput);
      if (!user) {
        notFound('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.message.includes('Validation error')) {
        validationError(error.message);
      }
      logger.error('Error updating user', { error, userId, input });
      databaseError('Failed to update user');
    }
  },

  coachChat: async ({ input }: { input: unknown }) => {
    try {
      const validatedInput = validateInput(coachChatValidation, input);
      const reply = await getCoachChatReply(validatedInput);
      return {
        reply,
        model: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
      };
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      if (error instanceof Error && error.message.includes('Validation error')) {
        validationError(error.message);
      }
      logger.error('Error generating coach chat reply', { error, input });
      databaseError('Failed to generate coach chat reply');
    }
  },
};
