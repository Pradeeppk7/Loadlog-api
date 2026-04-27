import { buildSchema, GraphQLError } from 'graphql';
import {
  createWorkoutPlan,
  deleteWorkoutPlan,
  getWorkoutPlanById,
  listWorkoutPlansFiltered,
  updateWorkoutPlan,
} from '../store/workoutPlanStore';
import {
  createWorkoutSession,
  getWorkoutSessionById,
  listWorkoutSessionsFiltered,
} from '../store/workoutSessionStore';
import { getExerciseHistory } from '../store/exerciseStore';
import { validateInput, workoutPlanValidation, workoutSessionValidation } from '../utils/validation';
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
    planId: ID!
    performedAt: String
    notes: String
    exercises: [CreateSessionExerciseInput!]!
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

  type Query {
    workoutPlans(nameContains: String): [WorkoutPlan!]!
    workoutPlan(planId: ID!): WorkoutPlan
    workoutSessions(planId: ID): [WorkoutSession!]!
    workoutSession(sessionId: ID!): WorkoutSession
    exerciseHistory(exerciseName: String!): ExerciseHistory!
  }

  type Mutation {
    createWorkoutPlan(input: CreateWorkoutPlanInput!): WorkoutPlan!
    updateWorkoutPlan(planId: ID!, input: CreateWorkoutPlanInput!): WorkoutPlan!
    deleteWorkoutPlan(planId: ID!): DeleteWorkoutPlanPayload!
    createWorkoutSession(input: CreateWorkoutSessionInput!): WorkoutSession!
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
  workoutPlans: async ({ nameContains }: { nameContains?: string }) => {
    try {
      logger.debug('Fetching workout plans', { nameContains });
      return await listWorkoutPlansFiltered(nameContains ? { nameContains } : {});
    } catch (error) {
      logger.error('Error fetching workout plans', { error, nameContains });
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

  workoutSessions: async ({ planId }: { planId?: string }) => {
    try {
      logger.debug('Fetching workout sessions', { planId });
      return await listWorkoutSessionsFiltered(planId ? { planId } : {});
    } catch (error) {
      logger.error('Error fetching workout sessions', { error, planId });
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

  createWorkoutPlan: async ({ input }: { input: any }) => {
    try {
      logger.debug('Creating workout plan', { input });
      const validatedInput = validateInput(workoutPlanValidation.create, input);
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

  updateWorkoutPlan: async ({ planId, input }: { planId: string; input: any }) => {
    try {
      logger.debug('Updating workout plan', { planId, input });
      const validatedInput = validateInput(workoutPlanValidation.update, input);
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

  createWorkoutSession: async ({ input }: { input: any }) => {
    try {
      logger.debug('Creating workout session', { input });
      const validatedInput = validateInput(workoutSessionValidation.create, input);
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
};
