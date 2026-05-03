import request from 'supertest';
import type { User, WorkoutPlan, WorkoutSession } from '../src/models/workoutPlanModels';

jest.mock('../src/store/workoutPlanStore', () => ({
  listWorkoutPlansPaginated: jest.fn(),
  createWorkoutPlan: jest.fn(),
  getWorkoutPlanById: jest.fn(),
  updateWorkoutPlan: jest.fn(),
  deleteWorkoutPlan: jest.fn(),
}));

jest.mock('../src/store/workoutSessionStore', () => ({
  listWorkoutSessionsPaginated: jest.fn(),
  createWorkoutSession: jest.fn(),
  getWorkoutSessionById: jest.fn(),
}));

jest.mock('../src/store/userStore', () => ({
  listUsers: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  createUserWithPassword: jest.fn(),
  getUserAuthByEmail: jest.fn(),
  updateUser: jest.fn(),
}));

import app from '../src/index';
import { hashPassword, signAuthToken } from '../src/services/authService';
import {
  listWorkoutPlansPaginated,
  createWorkoutPlan,
  getWorkoutPlanById,
} from '../src/store/workoutPlanStore';
import {
  listWorkoutSessionsPaginated,
  createWorkoutSession,
  getWorkoutSessionById,
} from '../src/store/workoutSessionStore';
import {
  createUser,
  createUserWithPassword,
  getUserAuthByEmail,
  getUserByEmail,
  getUserById,
  updateUser,
} from '../src/store/userStore';

describe('REST API', () => {
  const workoutPlanFixture: WorkoutPlan = {
    id: 'plan-1',
    userId: '11111111-1111-1111-1111-111111111111',
    name: 'Push Day',
    description: 'Chest and shoulders',
    exercises: [
      {
        id: 'exercise-1',
        exerciseName: 'Bench Press',
        order: 1,
        sets: [{ setNumber: 1, targetReps: 8, targetWeight: 80 }],
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const workoutSessionFixture: WorkoutSession = {
    id: 'session-1',
    userId: '11111111-1111-1111-1111-111111111111',
    planId: '11111111-1111-1111-1111-111111111111',
    performedAt: '2024-01-01T00:00:00Z',
    notes: 'Felt strong',
    exercises: [
      {
        exerciseName: 'Bench Press',
        sets: [{ setNumber: 1, actualReps: 8, actualWeight: 80 }],
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

  const authHeader = () => ({
    Authorization: `Bearer ${signAuthToken(userFixture)}`,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
    expect(response.body.environment).toBe('test');
  });

  it('lists workout plans with pagination', async () => {
    (listWorkoutPlansPaginated as jest.MockedFunction<typeof listWorkoutPlansPaginated>).mockResolvedValue({
      items: [workoutPlanFixture],
      pagination: {
        page: 2,
        pageSize: 1,
        totalItems: 3,
        totalPages: 3,
      },
    });

    const response = await request(app).get('/workout-plans?page=2&pageSize=1').set(authHeader());

    expect(response.status).toBe(200);
    expect(listWorkoutPlansPaginated).toHaveBeenCalledWith({
      userId: userFixture.id,
      page: 2,
      pageSize: 1,
    });
    expect(response.body.items).toHaveLength(1);
    expect(response.body.pagination.page).toBe(2);
  });

  it('rejects invalid workout plan pagination via request validation', async () => {
    const response = await request(app).get('/workout-plans?page=0&pageSize=1').set(authHeader());

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('returns a workout plan by id', async () => {
    (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(
      workoutPlanFixture
    );

    const response = await request(app).get('/workout-plans/plan-1').set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('plan-1');
  });

  it('returns 404 when workout plan does not exist', async () => {
    (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(
      undefined
    );

    const response = await request(app).get('/workout-plans/missing-plan').set(authHeader());

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Workout plan not found');
  });

  it('creates a workout plan', async () => {
    (createWorkoutPlan as jest.MockedFunction<typeof createWorkoutPlan>).mockResolvedValue(
      workoutPlanFixture
    );

    const response = await request(app).post('/workout-plans').set(authHeader()).send({
      userId: '11111111-1111-1111-1111-111111111111',
      name: 'Push Day',
      description: 'Chest and shoulders',
      exercises: [
        {
          exerciseName: 'Bench Press',
          order: 1,
          sets: [{ setNumber: 1, targetReps: 8, targetWeight: 80 }],
        },
      ],
    });

    expect(response.status).toBe(201);
    expect(createWorkoutPlan).toHaveBeenCalled();
    expect(response.body.id).toBe('plan-1');
  });

  it('validates workout plan payloads', async () => {
    const response = await request(app).post('/workout-plans').set(authHeader()).send({
      description: 'Missing required fields',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  it('lists workout sessions with pagination', async () => {
    (listWorkoutSessionsPaginated as jest.MockedFunction<typeof listWorkoutSessionsPaginated>).mockResolvedValue({
      items: [workoutSessionFixture],
      pagination: {
        page: 1,
        pageSize: 5,
        totalItems: 1,
        totalPages: 1,
      },
    });

    const response = await request(app).get('/workout-sessions?page=1&pageSize=5').set(authHeader());

    expect(response.status).toBe(200);
    expect(listWorkoutSessionsPaginated).toHaveBeenCalledWith({
      userId: userFixture.id,
      page: 1,
      pageSize: 5,
    });
    expect(response.body.items[0].id).toBe('session-1');
  });

  it('creates a workout session', async () => {
    (createWorkoutSession as jest.MockedFunction<typeof createWorkoutSession>).mockResolvedValue(
      workoutSessionFixture
    );

    (getWorkoutPlanById as jest.MockedFunction<typeof getWorkoutPlanById>).mockResolvedValue(
      workoutPlanFixture
    );

    const response = await request(app).post('/workout-sessions').set(authHeader()).send({
      userId: '11111111-1111-1111-1111-111111111111',
      planId: '11111111-1111-1111-1111-111111111111',
      performedAt: '2024-01-01T00:00:00Z',
      notes: 'Felt strong',
      exercises: [
        {
          exerciseName: 'Bench Press',
          sets: [{ setNumber: 1, actualReps: 8, actualWeight: 80 }],
        },
      ],
    });

    expect(response.status).toBe(201);
    expect(createWorkoutSession).toHaveBeenCalled();
    expect(response.body.id).toBe('session-1');
  });

  it('returns a workout session by id', async () => {
    (getWorkoutSessionById as jest.MockedFunction<typeof getWorkoutSessionById>).mockResolvedValue(
      workoutSessionFixture
    );

    const response = await request(app).get('/workout-sessions/session-1').set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('session-1');
  });

  it('returns 404 when workout session does not exist', async () => {
    (getWorkoutSessionById as jest.MockedFunction<typeof getWorkoutSessionById>).mockResolvedValue(
      undefined
    );

    const response = await request(app).get('/workout-sessions/missing-session').set(authHeader());

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Workout session not found');
  });

  it('lists users', async () => {
    (getUserById as jest.MockedFunction<typeof getUserById>).mockResolvedValue(userFixture);

    const response = await request(app).get('/users').set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body[0].email).toBe('pradeep@example.com');
  });

  it('creates a user', async () => {
    (createUser as jest.MockedFunction<typeof createUser>).mockResolvedValue(userFixture);

    const response = await request(app).post('/users').set(authHeader()).send({
      name: 'Pradeep',
      email: 'pradeep@example.com',
      age: 24,
      coachProfile: {
        goal: 'Build muscle',
        experienceLevel: 'intermediate',
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe(userFixture.id);
  });

  it('returns user by id', async () => {
    (getUserById as jest.MockedFunction<typeof getUserById>).mockResolvedValue(userFixture);

    const response = await request(app).get(`/users/${userFixture.id}`).set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Pradeep');
  });

  it('updates a user', async () => {
    (updateUser as jest.MockedFunction<typeof updateUser>).mockResolvedValue({
      ...userFixture,
      coachProfile: {
        ...userFixture.coachProfile,
        goal: 'Lose fat',
      },
    });

    const response = await request(app).put(`/users/${userFixture.id}`).set(authHeader()).send({
      coachProfile: {
        goal: 'Lose fat',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.coachProfile.goal).toBe('Lose fat');
  });

  it('lists workout plans for a user', async () => {
    (getUserById as jest.MockedFunction<typeof getUserById>).mockResolvedValue(userFixture);
    (listWorkoutPlansPaginated as jest.MockedFunction<typeof listWorkoutPlansPaginated>).mockResolvedValue({
      items: [workoutPlanFixture],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    const response = await request(app).get(`/users/${userFixture.id}/workout-plans`).set(authHeader());

    expect(response.status).toBe(200);
    expect(listWorkoutPlansPaginated).toHaveBeenCalledWith({
      userId: userFixture.id,
      page: 1,
      pageSize: 10,
    });
  });

  it('lists workout sessions for a user', async () => {
    (getUserById as jest.MockedFunction<typeof getUserById>).mockResolvedValue(userFixture);
    (
      listWorkoutSessionsPaginated as jest.MockedFunction<typeof listWorkoutSessionsPaginated>
    ).mockResolvedValue({
      items: [workoutSessionFixture],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    const response = await request(app).get(`/users/${userFixture.id}/workout-sessions`).set(authHeader());

    expect(response.status).toBe(200);
    expect(listWorkoutSessionsPaginated).toHaveBeenCalledWith({
      userId: userFixture.id,
      page: 1,
      pageSize: 10,
    });
  });

  it('registers a user and returns a token', async () => {
    (createUserWithPassword as jest.MockedFunction<typeof createUserWithPassword>).mockResolvedValue(
      userFixture
    );
    (getUserAuthByEmail as jest.MockedFunction<typeof getUserAuthByEmail>).mockResolvedValue(
      undefined
    );
    (getUserByEmail as jest.MockedFunction<typeof getUserByEmail>).mockResolvedValue(undefined);

    const response = await request(app).post('/auth/register').send({
      name: 'Pradeep',
      email: 'pradeep@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('pradeep@example.com');
    expect(response.body.token).toBeTruthy();
  });

  it('logs in with valid credentials', async () => {
    (getUserAuthByEmail as jest.MockedFunction<typeof getUserAuthByEmail>).mockResolvedValue({
      user: userFixture,
      passwordHash: await hashPassword('password123'),
    });

    const response = await request(app).post('/auth/login').send({
      email: 'pradeep@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(userFixture.id);
    expect(response.body.token).toBeTruthy();
  });

  it('returns the authenticated user from /auth/me', async () => {
    (getUserById as jest.MockedFunction<typeof getUserById>).mockResolvedValue(userFixture);

    const response = await request(app).get('/auth/me').set(authHeader());

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(userFixture.email);
  });
});
