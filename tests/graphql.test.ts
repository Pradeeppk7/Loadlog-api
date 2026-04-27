import { rootValue } from '../src/graphql/schema';

// Mock the store functions
jest.mock('../src/store/workoutPlanStore', () => ({
  listWorkoutPlansFiltered: jest.fn(),
  getWorkoutPlanById: jest.fn(),
  createWorkoutPlan: jest.fn(),
  updateWorkoutPlan: jest.fn(),
  deleteWorkoutPlan: jest.fn(),
}));

jest.mock('../src/store/workoutSessionStore', () => ({
  listWorkoutSessionsFiltered: jest.fn(),
  createWorkoutSession: jest.fn(),
}));

jest.mock('../src/store/exerciseStore', () => ({
  getExerciseHistory: jest.fn(),
}));

import {
  listWorkoutPlansFiltered,
  getWorkoutPlanById,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from '../src/store/workoutPlanStore';

import {
  listWorkoutSessionsFiltered,
  createWorkoutSession,
} from '../src/store/workoutSessionStore';

import { getExerciseHistory } from '../src/store/exerciseStore';

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('workoutPlans', () => {
    it('should return filtered workout plans', async () => {
      const mockPlans = [
        {
          id: '1',
          name: 'Test Plan',
          description: 'Test description',
          exercises: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
      ];

      (listWorkoutPlansFiltered as jest.MockedFunction<typeof listWorkoutPlansFiltered>).mockResolvedValue(mockPlans);

      const result = await rootValue.workoutPlans({ nameContains: 'test' });

      expect(listWorkoutPlansFiltered).toHaveBeenCalledWith({ nameContains: 'test' });
      expect(result).toEqual(mockPlans);
    });
  });

  describe('workoutPlan', () => {
    it('should return a workout plan by id', async () => {
      const mockPlan = {
        id: '1',
        name: 'Test Plan',
        exercises: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(mockPlan);

      const result = await rootValue.workoutPlan({ planId: '1' });

      expect(getWorkoutPlanById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPlan);
    });

    it('should throw error for non-existent plan', async () => {
      (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(null);

      await expect(rootValue.workoutPlan({ planId: '999' })).rejects.toThrow('Workout plan not found');
    });
  });

  describe('createWorkoutPlan', () => {
    it('should create a workout plan with valid input', async () => {
      const input = {
        name: 'Test Plan',
        description: 'Test description',
        exercises: [
          {
            exerciseName: 'Bench Press',
            order: 1,
            sets: [
              { setNumber: 1, targetReps: 10, targetWeight: 100 },
            ],
          },
        ],
      };

      const mockPlan = { id: '1', ...input };

      (createWorkoutPlan as jest.MockedFunction<typeof createWorkoutPlan>).mockResolvedValue(mockPlan);

      const result = await rootValue.createWorkoutPlan({ input });

      expect(createWorkoutPlan).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockPlan);
    });

    it('should throw validation error for invalid input', async () => {
      const invalidInput = { name: '' }; // Invalid: empty name

      await expect(rootValue.createWorkoutPlan({ input: invalidInput })).rejects.toThrow('Validation error');
    });
  });

  describe('updateWorkoutPlan', () => {
    it('should update a workout plan', async () => {
      const input = { name: 'Updated Plan' };
      const mockPlan = { id: '1', name: 'Updated Plan' };

      (updateWorkoutPlan as jest.MockedFunction<typeof updateWorkoutPlan>).mockResolvedValue(mockPlan);

      const result = await rootValue.updateWorkoutPlan({ planId: '1', input });

      expect(updateWorkoutPlan).toHaveBeenCalledWith('1', input);
      expect(result).toEqual(mockPlan);
    });

    it('should throw error for non-existent plan', async () => {
      (updateWorkoutPlan as jest.MockedFunction<typeof updateWorkoutPlan>).mockResolvedValue(null);

      await expect(rootValue.updateWorkoutPlan({ planId: '999', input: { name: 'Test' } }))
        .rejects.toThrow('Workout plan not found');
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

      await expect(rootValue.deleteWorkoutPlan({ planId: '999' }))
        .rejects.toThrow('Workout plan not found');
    });
  });

  describe('workoutSessions', () => {
    it('should return filtered workout sessions', async () => {
      const mockSessions = [{ id: '1', planId: '1' }];

      (listWorkoutSessionsFiltered as jest.MockedFunction<typeof listWorkoutSessionsFiltered>).mockResolvedValue(mockSessions);

      const result = await rootValue.workoutSessions({ planId: '1' });

      expect(listWorkoutSessionsFiltered).toHaveBeenCalledWith({ planId: '1' });
      expect(result).toEqual(mockSessions);
    });
  });

  describe('createWorkoutSession', () => {
    it('should create a workout session', async () => {
      const input = {
        planId: '1',
        performedAt: '2024-01-01T00:00:00Z',
        exercises: [
          {
            exerciseName: 'Bench Press',
            sets: [
              { setNumber: 1, actualReps: 10, actualWeight: 100 },
            ],
          },
        ],
      };

      const mockSession = { id: '1', ...input };

      (createWorkoutSession as jest.MockedFunction<typeof createWorkoutSession>).mockResolvedValue(mockSession);

      const result = await rootValue.createWorkoutSession({ input });

      expect(createWorkoutSession).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockSession);
    });
  });

  describe('exerciseHistory', () => {
    it('should return exercise history', async () => {
      const mockHistory = {
        exerciseName: 'Bench Press',
        history: [],
      };

      (getExerciseHistory as jest.MockedFunction<typeof getExerciseHistory>).mockResolvedValue(mockHistory);

      const result = await rootValue.exerciseHistory({ exerciseName: 'Bench Press' });

      expect(getExerciseHistory).toHaveBeenCalledWith('Bench Press');
      expect(result).toEqual(mockHistory);
    });
  });
});