type PlanSet = {
  setNumber: number;
  targetReps: number;
  targetWeight: number;
};

type PlanExercise = {
  id: string;
  exerciseName: string;
  order: number;
  sets: PlanSet[];
};

export type WorkoutPlan = {
  id: string;
  userId?: string;
  name: string;
  description?: string;
  exercises: PlanExercise[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePlanSetInput = {
  setNumber: number;
  targetReps: number;
  targetWeight: number;
};

export type CreatePlanExerciseInput = {
  exerciseName: string;
  order: number;
  sets: CreatePlanSetInput[];
};

export type CreateWorkoutPlanInput = {
  userId?: string;
  name: string;
  description?: string;
  exercises: CreatePlanExerciseInput[];
};

type SessionSet = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

type SessionExercise = {
  exerciseName: string;
  sets: SessionSet[];
};

export type WorkoutSession = {
  id: string;
  userId?: string;
  planId: string;
  performedAt: string;
  notes?: string;
  exercises: SessionExercise[];
};

export type CreateSessionSetInput = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

export type CreateSessionExerciseInput = {
  exerciseName: string;
  sets: CreateSessionSetInput[];
};

export type CreateWorkoutSessionInput = {
  userId?: string;
  planId: string;
  performedAt?: string;
  notes?: string;
  exercises: CreateSessionExerciseInput[];
};

type ExerciseHistorySet = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

type ExerciseHistoryItem = {
  performedAt: string;
  sets: ExerciseHistorySet[];
};

export type ExerciseHistory = {
  exerciseName: string;
  history: ExerciseHistoryItem[];
};

export type CoachProfile = {
  goal?: string;
  dietaryPreferences?: string;
  injuriesOrLimitations?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
};

export type User = {
  id: string;
  name: string;
  email: string;
  age?: number;
  coachProfile?: CoachProfile;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  age?: number;
  coachProfile?: CoachProfile;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  age?: number;
  coachProfile?: CoachProfile;
};

export type RegisterUserInput = CreateUserInput & {
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthPayload = {
  user: User;
  token: string;
};

export type PaginationInput = {
  page?: number;
  pageSize?: number;
};

export type PaginationMetadata = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMetadata;
};
