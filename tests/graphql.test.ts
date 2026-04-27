import { rootValue } from '../src/graphql/schema';

// Mock the store functions
jest.mock('../src/store/workoutPlanStore', () => ({
  listWorkoutPlansPaginated: jest.fn(),
  getWorkoutPlanById: jest.fn(),
  createWorkoutPlan: jest.fn(),
  updateWorkoutPlan: jest.fn(),
  deleteWorkoutPlan: jest.fn(),
}));

jest.mock('../src/store/workoutSessionStore', () => ({
  listWorkoutSessionsPaginated: jest.fn(),
  getWorkoutSessionById: jest.fn(),
  createWorkoutSession: jest.fn(),
}));

jest.mock('../src/store/exerciseStore', () => ({
  getExerciseHistory: jest.fn(),
}));

jest.mock('../src/store/userStore', () => ({
  listUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock('../src/services/coachChatService', () => ({
  getCoachChatReply: jest.fn(),
}));

import {
  listWorkoutPlansPaginated,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from '../src/store/workoutPlanStore';

import {
  listWorkoutSessionsPaginated,
  createWorkoutSession,
} from '../src/store/workoutSessionStore';

import { getExerciseHistory } from '../src/store/exerciseStore';
import { createUser, getUserById, listUsers, updateUser } from '../src/store/userStore';
import { getCoachChatReply } from '../src/services/coachChatService';
import { User, WorkoutPlan, WorkoutSession } from '../src/models/workoutPlanModels';

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createPlanInput = {
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Test Plan',
    description: 'Test description',
    exercises: [
      {
        exerciseName: 'Bench Press',
        order: 1,
        sets: [{ setNumber: 1, targetReps: 10, targetWeight: 100 }],
      },
    ],
  };

  const workoutPlanFixture: WorkoutPlan = {
    id: '1',
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Test Plan',
    description: 'Test description',
    exercises: [
      {
        id: 'exercise-1',
        exerciseName: 'Bench Press',
        order: 1,
        sets: [{ setNumber: 1, targetReps: 10, targetWeight: 100 }],
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const updatePlanInput = {
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Updated Plan',
    exercises: [
      {
        exerciseName: 'Row',
        order: 1,
        sets: [{ setNumber: 1, targetReps: 10, targetWeight: 50 }],
      },
    ],
  };

  const updatedWorkoutPlanFixture: WorkoutPlan = {
    id: '1',
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Updated Plan',
    exercises: [
      {
        id: 'exercise-2',
        exerciseName: 'Row',
        order: 1,
        sets: [{ setNumber: 1, targetReps: 10, targetWeight: 50 }],
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  const createSessionInput = {
    userId: '11111111-1111-1111-1111-111111111111',
    planId: '11111111-1111-1111-1111-111111111111',
    performedAt: '2024-01-01T00:00:00Z',
    exercises: [
      {
        exerciseName: 'Bench Press',
        sets: [{ setNumber: 1, actualReps: 10, actualWeight: 100 }],
      },
    ],
  };

  const workoutSessionFixture: WorkoutSession = {
    id: '1',
    userId: '11111111-1111-1111-1111-111111111111',
    planId: '11111111-1111-1111-1111-111111111111',
    performedAt: '2024-01-01T00:00:00Z',
    exercises: [
      {
        exerciseName: 'Bench Press',
        sets: [{ setNumber: 1, actualReps: 10, actualWeight: 100 }],
      },
    ],
  };

  const userFixture: User = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Pradeep',
    email: 'pradeep@example.com',
    age: 24,
    coachProfile: {
      goal: 'Build muscle',
      dietaryPreferences: 'High protein',
      injuriesOrLimitations: 'None',
      experienceLevel: 'intermediate',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('users', () => {
    it('should return users', async () => {
      (listUsers as jest.MockedFunction<typeof listUsers>).mockResolvedValue([userFixture]);

      const result = await rootValue.users();

      expect(listUsers).toHaveBeenCalled();
      expect(result).toEqual([userFixture]);
    });
  });

  describe('user', () => {
    it('should return a user by id', async () => {
      (getUserById as jest.MockedFunction<typeof getUserById>).mockResolvedValue(userFixture);

      const result = await rootValue.user({ userId: userFixture.id });

      expect(getUserById).toHaveBeenCalledWith(userFixture.id);
      expect(result).toEqual(userFixture);
    });
  });

  describe('workoutPlans', () => {
    it('should return filtered workout plans', async () => {
      const mockPlans = {
        items: [workoutPlanFixture],
        pagination: {
          page: 2,
          pageSize: 1,
          totalItems: 3,
          totalPages: 3,
        },
      };

      (
        listWorkoutPlansPaginated as jest.MockedFunction<typeof listWorkoutPlansPaginated>
      ).mockResolvedValue(mockPlans);

      const result = await rootValue.workoutPlans({
        nameContains: 'test',
        userId: userFixture.id,
        page: 2,
        pageSize: 1,
      });

      expect(listWorkoutPlansPaginated).toHaveBeenCalledWith({
        nameContains: 'test',
        userId: userFixture.id,
        page: 2,
        pageSize: 1,
      });
      expect(result).toEqual(mockPlans);
    });
  });

  describe('workoutPlan', () => {
    it('should return a workout plan by id', async () => {
      const mockPlan = workoutPlanFixture;

      (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(
        mockPlan
      );

      const result = await rootValue.workoutPlan({ planId: '1' });

      expect(getWorkoutPlanById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPlan);
    });

    it('should throw error for non-existent plan', async () => {
      (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(
        undefined
      );

      await expect(rootValue.workoutPlan({ planId: '999' })).rejects.toThrow(
        'Workout plan not found'
      );
    });
  });

  describe('createWorkoutPlan', () => {
    it('should create a workout plan with valid input', async () => {
      const input = createPlanInput;
      const mockPlan = workoutPlanFixture;

      (createWorkoutPlan as jest.MockedFunction<typeof createWorkoutPlan>).mockResolvedValue(
        mockPlan
      );

      const result = await rootValue.createWorkoutPlan({ input });

      expect(createWorkoutPlan).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockPlan);
    });

    it('should throw validation error for invalid input', async () => {
      const invalidInput = { name: '' }; // Invalid: empty name

      await expect(rootValue.createWorkoutPlan({ input: invalidInput })).rejects.toThrow(
        'Validation error'
      );
    });
  });

  describe('updateWorkoutPlan', () => {
    it('should update a workout plan', async () => {
      const input = updatePlanInput;
      const mockPlan = updatedWorkoutPlanFixture;

      (updateWorkoutPlan as jest.MockedFunction<typeof updateWorkoutPlan>).mockResolvedValue(
        mockPlan
      );

      const result = await rootValue.updateWorkoutPlan({ planId: '1', input });

      expect(updateWorkoutPlan).toHaveBeenCalledWith('1', input);
      expect(result).toEqual(mockPlan);
    });

    it('should throw error for non-existent plan', async () => {
      const input = updatePlanInput;
      (updateWorkoutPlan as jest.MockedFunction<typeof updateWorkoutPlan>).mockResolvedValue(
        undefined
      );

      await expect(rootValue.updateWorkoutPlan({ planId: '999', input })).rejects.toThrow(
        'Workout plan not found'
      );
    });
  });

  describe('deleteWorkoutPlan', () => {
    it('should delete a workout plan', async () => {
      (deleteWorkoutPlan as jest.MockedFunction<typeof deleteWorkoutPlan>).mockResolvedValue(true);

      const result = await rootValue.deleteWorkoutPlan({ planId: '1' });

      expect(deleteWorkoutPlan).toHaveBeenCalledWith('1');
      expect(result).toEqual({ success: true });
    });

    it('should throw error for non-existent plan', async () => {
      (deleteWorkoutPlan as jest.MockedFunction<typeof deleteWorkoutPlan>).mockResolvedValue(false);

      await expect(rootValue.deleteWorkoutPlan({ planId: '999' })).rejects.toThrow(
        'Workout plan not found'
      );
    });
  });

  describe('workoutSessions', () => {
    it('should return filtered workout sessions', async () => {
      const mockSessions = {
        items: [
          {
            id: '1',
            userId: userFixture.id,
            planId: '11111111-1111-1111-1111-111111111111',
            performedAt: '2024-01-01T00:00:00Z',
            exercises: [],
          },
        ],
        pagination: {
          page: 1,
          pageSize: 5,
          totalItems: 1,
          totalPages: 1,
        },
      };

      (
        listWorkoutSessionsPaginated as jest.MockedFunction<typeof listWorkoutSessionsPaginated>
      ).mockResolvedValue(mockSessions);

      const result = await rootValue.workoutSessions({
        planId: '1',
        userId: userFixture.id,
        page: 1,
        pageSize: 5,
      });

      expect(listWorkoutSessionsPaginated).toHaveBeenCalledWith({
        planId: '1',
        userId: userFixture.id,
        page: 1,
        pageSize: 5,
      });
      expect(result).toEqual(mockSessions);
    });
  });

  describe('createWorkoutSession', () => {
    it('should create a workout session', async () => {
      const input = createSessionInput;
      const mockSession = workoutSessionFixture;

      (createWorkoutSession as jest.MockedFunction<typeof createWorkoutSession>).mockResolvedValue(
        mockSession
      );

      const result = await rootValue.createWorkoutSession({ input });

      expect(createWorkoutSession).toHaveBeenCalledWith({
        ...input,
        performedAt: new Date('2024-01-01T00:00:00Z'),
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('exerciseHistory', () => {
    it('should return exercise history', async () => {
      const mockHistory = {
        exerciseName: 'Bench Press',
        history: [],
      };

      (getExerciseHistory as jest.MockedFunction<typeof getExerciseHistory>).mockResolvedValue(
        mockHistory
      );

      const result = await rootValue.exerciseHistory({ exerciseName: 'Bench Press' });

      expect(getExerciseHistory).toHaveBeenCalledWith('Bench Press');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      (createUser as jest.MockedFunction<typeof createUser>).mockResolvedValue(userFixture);

      const result = await rootValue.createUser({
        input: {
          name: 'Pradeep',
          email: 'pradeep@example.com',
          age: 24,
          coachProfile: {
            goal: 'Build muscle',
            experienceLevel: 'intermediate',
          },
        },
      });

      expect(createUser).toHaveBeenCalled();
      expect(result).toEqual(userFixture);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      (updateUser as jest.MockedFunction<typeof updateUser>).mockResolvedValue(userFixture);

      const result = await rootValue.updateUser({
        userId: userFixture.id,
        input: {
          name: 'Pradeep Kumar',
        },
      });

      expect(updateUser).toHaveBeenCalled();
      expect(result).toEqual(userFixture);
    });
  });

  describe('coachChat', () => {
    it('should return a coach reply', async () => {
      (getCoachChatReply as jest.MockedFunction<typeof getCoachChatReply>).mockResolvedValue(
        'Keep protein high and train consistently.'
      );

      const result = await rootValue.coachChat({
        input: {
          message: 'How do I build muscle?',
          userId: userFixture.id,
        },
      });

      expect(getCoachChatReply).toHaveBeenCalledWith({
        message: 'How do I build muscle?',
        userId: userFixture.id,
        history: [],
        profile: {},
      });
      expect(result.reply).toContain('protein');
    });
  });
});
