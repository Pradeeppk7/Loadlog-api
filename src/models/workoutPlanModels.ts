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
