
import { supabase } from "../db/supabaseClient";

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

type CreateSessionSetInput = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

type CreateSessionExerciseInput = {
  exerciseName: string;
  sets: CreateSessionSetInput[];
};

type CreateWorkoutSessionInput = {
  planId: string;
  performedAt?: string;
  notes?: string;
  exercises: CreateSessionExerciseInput[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description?: string;
  exercises: PlanExercise[];
  createdAt: string;
  updatedAt: string;
};

type CreatePlanSetInput = {
  setNumber: number;
  targetReps: number;
  targetWeight: number;
};

type CreatePlanExerciseInput = {
  exerciseName: string;
  order: number;
  sets: CreatePlanSetInput[];
};

type CreateWorkoutPlanInput = {
  name: string;
  description?: string;
  exercises: CreatePlanExerciseInput[];
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

const now = new Date().toISOString();

const workoutSessions: WorkoutSession[] = [];
const workoutPlans: WorkoutPlan[] = [
  {
    id: "1",
    name: "Push Day",
    description: "Chest, shoulders, triceps",
    exercises: [
      {
        id: "ex-1",
        exerciseName: "Bench Press",
        order: 1,
        sets: [
          { setNumber: 1, targetReps: 8, targetWeight: 135 },
          { setNumber: 2, targetReps: 8, targetWeight: 135 }
        ]
      }
    ],
    createdAt: now,
    updatedAt: now
  }
];

export function createWorkoutSession(data: CreateWorkoutSessionInput): WorkoutSession {
  const newSession: WorkoutSession = {
    id: `session-${Date.now()}`,
    planId: data.planId,
    performedAt: data.performedAt || new Date().toISOString(),
    notes: data.notes,
    exercises: data.exercises.map((exercise) => ({
      exerciseName: exercise.exerciseName,
      sets: exercise.sets.map((setItem) => ({
        setNumber: setItem.setNumber,
        actualReps: setItem.actualReps,
        actualWeight: setItem.actualWeight
      }))
    }))
  };

  workoutSessions.push(newSession);
  return newSession;
}

export function getExerciseHistory(exerciseName: string): {
  exerciseName: string;
  history: ExerciseHistoryItem[];
} {
  const history = workoutSessions
    .filter((session) =>
      session.exercises.some((exercise) => exercise.exerciseName === exerciseName)
    )
    .map((session) => {
      const matchingExercise = session.exercises.find(
        (exercise) => exercise.exerciseName === exerciseName
      );

      return {
        performedAt: session.performedAt,
        sets: matchingExercise ? matchingExercise.sets : []
      };
    })
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  return {
    exerciseName,
    history
  };
}
const exerciseHistory: Record<string, ExerciseHistoryItem[]> = {
  "Bench Press": [
    {
      performedAt: new Date().toISOString(),
      sets: [
        { setNumber: 1, actualReps: 8, actualWeight: 135 },
        { setNumber: 2, actualReps: 8, actualWeight: 140 }
      ]
    }
  ]
};

function buildPlanExercises(inputExercises: CreatePlanExerciseInput[]): PlanExercise[] {
  return inputExercises.map((exercise, index) => ({
    id: `ex-${Date.now()}-${index + 1}`,
    exerciseName: exercise.exerciseName,
    order: exercise.order,
    sets: exercise.sets.map((setItem) => ({
      setNumber: setItem.setNumber,
      targetReps: setItem.targetReps,
      targetWeight: setItem.targetWeight
    }))
  }));
}

export function listWorkoutPlans(): WorkoutPlan[] {
  return workoutPlans;
}


export async function createWorkoutPlan(data: any) {
  // 1. Insert into workout_plans
  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      name: data.name,
      description: data.description,
    })
    .select()
    .single();

  if (planError) {
    throw new Error(planError.message);
  }

  // 2. Insert exercises
  for (const exercise of data.exercises) {
    const { data: planExercise, error: exError } = await supabase
      .from("plan_exercises")
      .insert({
        plan_id: plan.id,
        exercise_name: exercise.exerciseName,
        order_index: exercise.order,
      })
      .select()
      .single();

    if (exError) throw new Error(exError.message);

    // 3. Insert sets
    const setsToInsert = exercise.sets.map((set: any) => ({
      plan_exercise_id: planExercise.id,
      set_number: set.setNumber,
      target_reps: set.targetReps,
      target_weight: set.targetWeight,
    }));

    const { error: setError } = await supabase
      .from("plan_sets")
      .insert(setsToInsert);

    if (setError) throw new Error(setError.message);
  }

  return plan;
}

export function getWorkoutPlanById(planId: string): WorkoutPlan | undefined {
  return workoutPlans.find((plan) => plan.id === planId);
}

export function updateWorkoutPlan(
  planId: string,
  data: CreateWorkoutPlanInput
): WorkoutPlan | undefined {
  const existingPlan = workoutPlans.find((plan) => plan.id === planId);

  if (!existingPlan) {
    return undefined;
  }

  const updatedPlan: WorkoutPlan = {
    ...existingPlan,
    name: data.name,
    description: data.description,
    exercises: buildPlanExercises(data.exercises),
    updatedAt: new Date().toISOString()
  };

  const index = workoutPlans.findIndex((plan) => plan.id === planId);
  workoutPlans[index] = updatedPlan;

  return updatedPlan;
}

export function deleteWorkoutPlan(planId: string): boolean {
  const index = workoutPlans.findIndex((plan) => plan.id === planId);

  if (index === -1) {
    return false;
  }

  workoutPlans.splice(index, 1);
  return true;
}

export function listWorkoutSessions(): WorkoutSession[] {
  return workoutSessions;
}

export function getWorkoutSessionById(sessionId: string): WorkoutSession | undefined {
  return workoutSessions.find((session) => session.id === sessionId);
}