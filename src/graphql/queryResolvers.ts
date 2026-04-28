import { GraphQLError } from 'graphql';
import { getWorkoutPlanById, listWorkoutPlansPaginated } from '../store/workoutPlanStore';
import { getWorkoutSessionById, listWorkoutSessionsPaginated } from '../store/workoutSessionStore';
import { getExerciseHistory } from '../store/exerciseStore';
import { getUserById, listUsers } from '../store/userStore';
import logger from '../utils/logger';
import { databaseError, notFound } from './errors';

type WorkoutPlansArgs = {
  nameContains?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
};

type WorkoutSessionsArgs = {
  planId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
};

export const queryResolvers = {
  users: async () => {
    try {
      logger.debug('Fetching users');
      return await listUsers();
    } catch (error) {
      logger.error('Error fetching users', { error });
      databaseError('Failed to fetch users');
    }
  },

  user: async ({ userId }: { userId: string }) => {
    try {
      logger.debug('Fetching user', { userId });
      const user = await getUserById(userId);
      if (!user) {
        notFound('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching user', { error, userId });
      databaseError('Failed to fetch user');
    }
  },

  workoutPlans: async ({ nameContains, userId, page, pageSize }: WorkoutPlansArgs) => {
    try {
      logger.debug('Fetching workout plans', { nameContains, userId, page, pageSize });
      return await listWorkoutPlansPaginated({
        ...(nameContains ? { nameContains } : {}),
        ...(userId ? { userId } : {}),
        ...(page !== undefined ? { page } : {}),
        ...(pageSize !== undefined ? { pageSize } : {}),
      });
    } catch (error) {
      logger.error('Error fetching workout plans', { error, nameContains, userId, page, pageSize });
      databaseError('Failed to fetch workout plans');
    }
  },

  workoutPlan: async ({ planId }: { planId: string }) => {
    try {
      logger.debug('Fetching workout plan', { planId });
      const plan = await getWorkoutPlanById(planId);
      if (!plan) {
        notFound('Workout plan not found');
      }
      return plan;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching workout plan', { error, planId });
      databaseError('Failed to fetch workout plan');
    }
  },

  workoutSessions: async ({ planId, userId, page, pageSize }: WorkoutSessionsArgs) => {
    try {
      logger.debug('Fetching workout sessions', { planId, userId, page, pageSize });
      return await listWorkoutSessionsPaginated({
        ...(planId ? { planId } : {}),
        ...(userId ? { userId } : {}),
        ...(page !== undefined ? { page } : {}),
        ...(pageSize !== undefined ? { pageSize } : {}),
      });
    } catch (error) {
      logger.error('Error fetching workout sessions', { error, planId, userId, page, pageSize });
      databaseError('Failed to fetch workout sessions');
    }
  },

  workoutSession: async ({ sessionId }: { sessionId: string }) => {
    try {
      logger.debug('Fetching workout session', { sessionId });
      const session = await getWorkoutSessionById(sessionId);
      if (!session) {
        notFound('Workout session not found');
      }
      return session;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching workout session', { error, sessionId });
      databaseError('Failed to fetch workout session');
    }
  },

  exerciseHistory: async ({ exerciseName }: { exerciseName: string }) => {
    try {
      logger.debug('Fetching exercise history', { exerciseName });
      return await getExerciseHistory(exerciseName);
    } catch (error) {
      logger.error('Error fetching exercise history', { error, exerciseName });
      databaseError('Failed to fetch exercise history');
    }
  },
};
