import { buildSchema, GraphQLError } from 'graphql';
import {
  createWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlanById,
  listWorkoutPlansPaginated,
  updateWorkoutPlan,
} from '../store/workoutPlanStore';
import {
  createWorkoutSession,
  getWorkoutSessionById,
  listWorkoutSessionsPaginated,
} from '../store/workoutSessionStore';
import { getExerciseHistory } from '../store/exerciseStore';
import { createUser, getUserById, listUsers, updateUser } from '../store/userStore';
import { getCoachChatReply } from '../services/coachChatService';
import {
  CreateUserInput,
  CreateWorkoutPlanInput,
  CreateWorkoutSessionInput,
  UpdateUserInput,
} from '../models/workoutPlanModels';
import {
  coachChatValidation,
  userValidation,
  validateInput,
  workoutPlanValidation,
  workoutSessionValidation,
} from '../utils/validation';
import logger from '../utils/logger';

export const schema = buildSchema(`
  type PlanSet {
    setNumber: Int!
    targetReps: Int!
    targetWeight: Float!
  }

  type PlanExercise {
    id: ID!
    exerciseName: String!
    order: Int!
    sets: [PlanSet!]!
  }

  type WorkoutPlan {
    id: ID!
    userId: ID
    name: String!
    description: String
    exercises: [PlanExercise!]!
    createdAt: String!
    updatedAt: String!
  }

  input CreatePlanSetInput {
    setNumber: Int!
    targetReps: Int!
    targetWeight: Float!
  }

  input CreatePlanExerciseInput {
    exerciseName: String!
    order: Int!
    sets: [CreatePlanSetInput!]!
  }

  input CreateWorkoutPlanInput {
    userId: ID
    name: String!
    description: String
    exercises: [CreatePlanExerciseInput!]!
  }

  type SessionSet {
    setNumber: Int!
    actualReps: Int!
    actualWeight: Float!
  }

  type SessionExercise {
    exerciseName: String!
    sets: [SessionSet!]!
  }

  type WorkoutSession {
    id: ID!
    userId: ID
    planId: ID!
    performedAt: String!
    notes: String
    exercises: [SessionExercise!]!
  }

  input CreateSessionSetInput {
    setNumber: Int!
    actualReps: Int!
    actualWeight: Float!
  }

  input CreateSessionExerciseInput {
    exerciseName: String!
    sets: [CreateSessionSetInput!]!
  }

  input CreateWorkoutSessionInput {
    userId: ID
    planId: ID!
    performedAt: String
    notes: String
    exercises: [CreateSessionExerciseInput!]!
  }

  type CoachProfile {
    goal: String
    dietaryPreferences: String
    injuriesOrLimitations: String
    experienceLevel: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    coachProfile: CoachProfile
    createdAt: String!
    updatedAt: String!
  }

  input CoachProfileInput {
    goal: String
    dietaryPreferences: String
    injuriesOrLimitations: String
    experienceLevel: String
  }

  input CreateUserInput {
    name: String!
    email: String!
    age: Int
    coachProfile: CoachProfileInput
  }

  input UpdateUserInput {
    name: String
    email: String
    age: Int
    coachProfile: CoachProfileInput
  }

  input CoachChatMessageInput {
    role: String!
    content: String!
  }

  input CoachChatInput {
    message: String!
    userId: ID
    history: [CoachChatMessageInput!]
    profile: CoachProfileInput
  }

  type CoachChatPayload {
    reply: String!
    model: String!
  }

  type ExerciseHistorySet {
    setNumber: Int!
    actualReps: Int!
    actualWeight: Float!
  }

  type ExerciseHistoryItem {
    performedAt: String!
    sets: [ExerciseHistorySet!]!
  }

  type ExerciseHistory {
    exerciseName: String!
    history: [ExerciseHistoryItem!]!
  }

  type DeleteWorkoutPlanPayload {
    success: Boolean!
  }

  type PaginationMetadata {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
  }

  type WorkoutPlanPage {
    items: [WorkoutPlan!]!
    pagination: PaginationMetadata!
  }

  type WorkoutSessionPage {
    items: [WorkoutSession!]!
    pagination: PaginationMetadata!
  }

  type Query {
    users: [User!]!
    user(userId: ID!): User
    workoutPlans(nameContains: String, userId: ID, page: Int, pageSize: Int): WorkoutPlanPage!
    workoutPlan(planId: ID!): WorkoutPlan
    workoutSessions(planId: ID, userId: ID, page: Int, pageSize: Int): WorkoutSessionPage!
    workoutSession(sessionId: ID!): WorkoutSession
    exerciseHistory(exerciseName: String!): ExerciseHistory!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(userId: ID!, input: UpdateUserInput!): User!
    createWorkoutPlan(input: CreateWorkoutPlanInput!): WorkoutPlan!
    updateWorkoutPlan(planId: ID!, input: CreateWorkoutPlanInput!): WorkoutPlan!
    deleteWorkoutPlan(planId: ID!): DeleteWorkoutPlanPayload!
    createWorkoutSession(input: CreateWorkoutSessionInput!): WorkoutSession!
    coachChat(input: CoachChatInput!): CoachChatPayload!
  }
`);

function notFound(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  });
}

function validationError(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: 'VALIDATION_ERROR' },
  });
}

function databaseError(message: string): never {
  logger.error('Database error', { error: message });
  throw new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL_ERROR' },
  });
}

export const rootValue = {
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

  workoutPlans: async ({
    nameContains,
    userId,
    page,
    pageSize,
  }: {
    nameContains?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  }) => {
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

  workoutSessions: async ({
    planId,
    userId,
    page,
    pageSize,
  }: {
    planId?: string;
    userId?: string;
    page?: number;
    pageSize?: number;
  }) => {
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
