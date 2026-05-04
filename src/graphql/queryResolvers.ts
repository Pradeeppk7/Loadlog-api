import { GraphQLError } from 'graphql';
import { getWorkoutPlanById, listWorkoutPlansPaginated } from '../store/workoutPlanStore';
import { getWorkoutSessionById, listWorkoutSessionsPaginated } from '../store/workoutSessionStore';
import { getExerciseHistory } from '../store/exerciseStore';
import { getUserById, listUsers } from '../store/userStore';
import logger from '../utils/logger';
import { databaseError, forbidden, notFound, unauthorized } from './errors';

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

type GraphQLContext = {
  auth?: {
    userId: string;
    email: string;
  };
};

function requireGraphQLAuth(context: GraphQLContext = {}): { userId: string; email: string } {
  if (!context.auth) {
    unauthorized('Authentication required');
  }

  return context.auth;
}

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

  user: async ({ userId }: { userId: string }, context: GraphQLContext = {}) => {
    try {
      logger.debug('Fetching user', { userId });
      if (context.auth && context.auth.userId !== userId) {
        forbidden('You can only access your own user profile');
      }
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

  me: async (_args: Record<string, never>, context: GraphQLContext = {}) => {
    try {
      const auth = requireGraphQLAuth(context);
      logger.debug('Fetching authenticated user', { userId: auth.userId });
      const user = await getUserById(auth.userId);
      if (!user) {
        notFound('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching authenticated user', { error });
      databaseError('Failed to fetch authenticated user');
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

  myWorkoutPlans: async (
    { nameContains, page, pageSize }: Omit<WorkoutPlansArgs, 'userId'>,
    context: GraphQLContext = {}
  ) => {
    try {
      const auth = requireGraphQLAuth(context);
      logger.debug('Fetching authenticated workout plans', {
        userId: auth.userId,
        nameContains,
        page,
        pageSize,
      });
      return await listWorkoutPlansPaginated({
        userId: auth.userId,
        ...(nameContains ? { nameContains } : {}),
        ...(page !== undefined ? { page } : {}),
        ...(pageSize !== undefined ? { pageSize } : {}),
      });
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching authenticated workout plans', { error });
      databaseError('Failed to fetch authenticated workout plans');
    }
  },

  workoutPlan: async ({ planId }: { planId: string }, context: GraphQLContext = {}) => {
    try {
      logger.debug('Fetching workout plan', { planId });
      const plan = await getWorkoutPlanById(planId);
      if (!plan) {
        notFound('Workout plan not found');
      }
      if (context.auth && plan.userId && context.auth.userId !== plan.userId) {
        forbidden('You can only access your own workout plans');
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

  myWorkoutSessions: async (
    { planId, page, pageSize }: Omit<WorkoutSessionsArgs, 'userId'>,
    context: GraphQLContext = {}
  ) => {
    try {
      const auth = requireGraphQLAuth(context);
      logger.debug('Fetching authenticated workout sessions', {
        userId: auth.userId,
        planId,
        page,
        pageSize,
      });
      return await listWorkoutSessionsPaginated({
        userId: auth.userId,
        ...(planId ? { planId } : {}),
        ...(page !== undefined ? { page } : {}),
        ...(pageSize !== undefined ? { pageSize } : {}),
      });
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching authenticated workout sessions', { error });
      databaseError('Failed to fetch authenticated workout sessions');
    }
  },

  workoutSession: async ({ sessionId }: { sessionId: string }, context: GraphQLContext = {}) => {
    try {
      logger.debug('Fetching workout session', { sessionId });
      const session = await getWorkoutSessionById(sessionId);
      if (!session) {
        notFound('Workout session not found');
      }
      if (context.auth && session.userId && context.auth.userId !== session.userId) {
        forbidden('You can only access your own workout sessions');
      }
      return session;
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching workout session', { error, sessionId });
      databaseError('Failed to fetch workout session');
    }
  },

  exerciseHistory: async (
    { exerciseName }: { exerciseName: string },
    context: GraphQLContext = {}
  ) => {
    try {
      logger.debug('Fetching exercise history', { exerciseName });
      return await getExerciseHistory(exerciseName, context.auth?.userId);
    } catch (error) {
      logger.error('Error fetching exercise history', { error, exerciseName });
      databaseError('Failed to fetch exercise history');
    }
  },

  myExerciseHistory: async (
    { exerciseName }: { exerciseName: string },
    context: GraphQLContext = {}
  ) => {
    try {
      const auth = requireGraphQLAuth(context);
      logger.debug('Fetching authenticated exercise history', {
        exerciseName,
        userId: auth.userId,
      });
      return await getExerciseHistory(exerciseName, auth.userId);
    } catch (error) {
      if (error instanceof GraphQLError) throw error;
      logger.error('Error fetching exercise history', { error, exerciseName });
      databaseError('Failed to fetch exercise history');
    }
  },
};
