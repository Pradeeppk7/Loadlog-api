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
import { WorkoutPlan, WorkoutSession } from '../src/models/workoutPlanModels';

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createPlanInput = {
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
    planId: '11111111-1111-1111-1111-111111111111',
    performedAt: '2024-01-01T00:00:00Z',
    exercises: [
      {
        exerciseName: 'Bench Press',
        sets: [{ setNumber: 1, actualReps: 10, actualWeight: 100 }],
      },
    ],
  };

  describe('workoutPlans', () => {
    it('should return filtered workout plans', async () => {
      const mockPlans = [workoutPlanFixture];

      (
        listWorkoutPlansFiltered as jest.MockedFunction<typeof listWorkoutPlansFiltered>
      ).mockResolvedValue(mockPlans);

      const result = await rootValue.workoutPlans({ nameContains: 'test' });

      expect(listWorkoutPlansFiltered).toHaveBeenCalledWith({ nameContains: 'test' });
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
      const mockSessions: WorkoutSession[] = [
        {
          id: '1',
          planId: '11111111-1111-1111-1111-111111111111',
          performedAt: '2024-01-01T00:00:00Z',
          exercises: [],
        },
      ];

      (
        listWorkoutSessionsFiltered as jest.MockedFunction<typeof listWorkoutSessionsFiltered>
      ).mockResolvedValue(mockSessions);

      const result = await rootValue.workoutSessions({ planId: '1' });

      expect(listWorkoutSessionsFiltered).toHaveBeenCalledWith({ planId: '1' });
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
});
