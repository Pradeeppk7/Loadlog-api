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

type ExerciseHistorySet = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

type ExerciseHistoryItem = {
  performedAt: string;
  sets: ExerciseHistorySet[];
};

function mapPlanSets(rows: any[]): PlanSet[] {
  return (rows || []).map((row) => ({
    setNumber: row.set_number,
    targetReps: row.target_reps,
    targetWeight: Number(row.target_weight),
  }));
}

function mapSessionSets(rows: any[]): SessionSet[] {
  return (rows || []).map((row) => ({
    setNumber: row.set_number,
    actualReps: row.actual_reps,
    actualWeight: Number(row.actual_weight),
  }));
}

async function buildWorkoutPlan(plan: any): Promise<WorkoutPlan> {
  const { data: exercises, error: exercisesError } = await supabase
    .from("plan_exercises")
    .select("*")
    .eq("plan_id", plan.id)
    .order("order_index", { ascending: true });

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const formattedExercises: PlanExercise[] = [];

  for (const exercise of exercises || []) {
    const { data: sets, error: setsError } = await supabase
      .from("plan_sets")
      .select("*")
      .eq("plan_exercise_id", exercise.id)
      .order("set_number", { ascending: true });

    if (setsError) {
      throw new Error(setsError.message);
    }

    formattedExercises.push({
      id: exercise.id,
      exerciseName: exercise.exercise_name,
      order: exercise.order_index,
      sets: mapPlanSets(sets || []),
    });
  }

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description || undefined,
    exercises: formattedExercises,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

async function buildWorkoutSession(session: any): Promise<WorkoutSession> {
  const { data: exercises, error: exercisesError } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", session.id);

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const formattedExercises: SessionExercise[] = [];

  for (const exercise of exercises || []) {
    const { data: sets, error: setsError } = await supabase
      .from("session_sets")
      .select("*")
      .eq("session_exercise_id", exercise.id)
      .order("set_number", { ascending: true });

    if (setsError) {
      throw new Error(setsError.message);
    }

    formattedExercises.push({
      exerciseName: exercise.exercise_name,
      sets: mapSessionSets(sets || []),
    });
  }

  return {
    id: session.id,
    planId: session.plan_id,
    performedAt: session.performed_at,
    notes: session.notes || undefined,
    exercises: formattedExercises,
  };
}

export async function listWorkoutPlans(): Promise<WorkoutPlan[]> {
  const { data: plans, error } = await supabase
    .from("workout_plans")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const result: WorkoutPlan[] = [];

  for (const plan of plans || []) {
    result.push(await buildWorkoutPlan(plan));
  }

  return result;
}

export async function createWorkoutPlan(
  data: CreateWorkoutPlanInput
): Promise<WorkoutPlan> {
  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      name: data.name,
      description: data.description,
    })
    .select()
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message || "Failed to create workout plan");
  }

  for (const exercise of data.exercises) {
    const { data: planExercise, error: exerciseError } = await supabase
      .from("plan_exercises")
      .insert({
        plan_id: plan.id,
        exercise_name: exercise.exerciseName,
        order_index: exercise.order,
      })
      .select()
      .single();

    if (exerciseError || !planExercise) {
      throw new Error(exerciseError?.message || "Failed to create plan exercise");
    }

    const setsToInsert = exercise.sets.map((setItem) => ({
      plan_exercise_id: planExercise.id,
      set_number: setItem.setNumber,
      target_reps: setItem.targetReps,
      target_weight: setItem.targetWeight,
    }));

    const { error: setsError } = await supabase
      .from("plan_sets")
      .insert(setsToInsert);

    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  return await getWorkoutPlanById(plan.id) as WorkoutPlan;
}

export async function getWorkoutPlanById(
  planId: string
): Promise<WorkoutPlan | undefined> {
  const { data: plan, error } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!plan) {
    return undefined;
  }

  return await buildWorkoutPlan(plan);
}

export async function updateWorkoutPlan(
  planId: string,
  data: CreateWorkoutPlanInput
): Promise<WorkoutPlan | undefined> {
  const existing = await getWorkoutPlanById(planId);

  if (!existing) {
    return undefined;
  }

  const { error: updateError } = await supabase
    .from("workout_plans")
    .update({
      name: data.name,
      description: data.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: existingExercises, error: existingExercisesError } = await supabase
    .from("plan_exercises")
    .select("id")
    .eq("plan_id", planId);

  if (existingExercisesError) {
    throw new Error(existingExercisesError.message);
  }

  for (const exercise of existingExercises || []) {
    const { error: deleteSetsError } = await supabase
      .from("plan_sets")
      .delete()
      .eq("plan_exercise_id", exercise.id);

    if (deleteSetsError) {
      throw new Error(deleteSetsError.message);
    }
  }

  const { error: deleteExercisesError } = await supabase
    .from("plan_exercises")
    .delete()
    .eq("plan_id", planId);

  if (deleteExercisesError) {
    throw new Error(deleteExercisesError.message);
  }

  for (const exercise of data.exercises) {
    const { data: planExercise, error: exerciseError } = await supabase
      .from("plan_exercises")
      .insert({
        plan_id: planId,
        exercise_name: exercise.exerciseName,
        order_index: exercise.order,
      })
      .select()
      .single();

    if (exerciseError || !planExercise) {
      throw new Error(exerciseError?.message || "Failed to recreate plan exercise");
    }

    const setsToInsert = exercise.sets.map((setItem) => ({
      plan_exercise_id: planExercise.id,
      set_number: setItem.setNumber,
      target_reps: setItem.targetReps,
      target_weight: setItem.targetWeight,
    }));

    const { error: setsError } = await supabase
      .from("plan_sets")
      .insert(setsToInsert);

    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  return await getWorkoutPlanById(planId);
}

export async function deleteWorkoutPlan(planId: string): Promise<boolean> {
  const existing = await getWorkoutPlanById(planId);

  if (!existing) {
    return false;
  }

  const { data: exercises, error: exercisesError } = await supabase
    .from("plan_exercises")
    .select("id")
    .eq("plan_id", planId);

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  for (const exercise of exercises || []) {
    const { error: deleteSetsError } = await supabase
      .from("plan_sets")
      .delete()
      .eq("plan_exercise_id", exercise.id);

    if (deleteSetsError) {
      throw new Error(deleteSetsError.message);
    }
  }

  const { error: deleteExercisesError } = await supabase
    .from("plan_exercises")
    .delete()
    .eq("plan_id", planId);

  if (deleteExercisesError) {
    throw new Error(deleteExercisesError.message);
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("plan_id", planId);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  for (const session of sessions || []) {
    const { data: sessionExercises, error: sessionExercisesError } = await supabase
      .from("session_exercises")
      .select("id")
      .eq("session_id", session.id);

    if (sessionExercisesError) {
      throw new Error(sessionExercisesError.message);
    }

    for (const sessionExercise of sessionExercises || []) {
      const { error: deleteSessionSetsError } = await supabase
        .from("session_sets")
        .delete()
        .eq("session_exercise_id", sessionExercise.id);

      if (deleteSessionSetsError) {
        throw new Error(deleteSessionSetsError.message);
      }
    }

    const { error: deleteSessionExercisesError } = await supabase
      .from("session_exercises")
      .delete()
      .eq("session_id", session.id);

    if (deleteSessionExercisesError) {
      throw new Error(deleteSessionExercisesError.message);
    }
  }

  const { error: deleteSessionsError } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("plan_id", planId);

  if (deleteSessionsError) {
    throw new Error(deleteSessionsError.message);
  }

  const { error: deletePlanError } = await supabase
    .from("workout_plans")
    .delete()
    .eq("id", planId);

  if (deletePlanError) {
    throw new Error(deletePlanError.message);
  }

  return true;
}

export async function createWorkoutSession(
  data: CreateWorkoutSessionInput
): Promise<WorkoutSession> {
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      plan_id: data.planId,
      performed_at: data.performedAt || new Date().toISOString(),
      notes: data.notes,
    })
    .select()
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message || "Failed to create workout session");
  }

  for (const exercise of data.exercises) {
    const { data: sessionExercise, error: exerciseError } = await supabase
      .from("session_exercises")
      .insert({
        session_id: session.id,
        exercise_name: exercise.exerciseName,
      })
      .select()
      .single();

    if (exerciseError || !sessionExercise) {
      throw new Error(exerciseError?.message || "Failed to create session exercise");
    }

    const setsToInsert = exercise.sets.map((setItem) => ({
      session_exercise_id: sessionExercise.id,
      set_number: setItem.setNumber,
      actual_reps: setItem.actualReps,
      actual_weight: setItem.actualWeight,
    }));

    const { error: setsError } = await supabase
      .from("session_sets")
      .insert(setsToInsert);

    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  return await getWorkoutSessionById(session.id) as WorkoutSession;
}

export async function listWorkoutSessions(): Promise<WorkoutSession[]> {
  const { data: sessions, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .order("performed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const result: WorkoutSession[] = [];

  for (const session of sessions || []) {
    result.push(await buildWorkoutSession(session));
  }

  return result;
}

export async function getWorkoutSessionById(
  sessionId: string
): Promise<WorkoutSession | undefined> {
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!session) {
    return undefined;
  }

  return await buildWorkoutSession(session);
}

export async function getExerciseHistory(
  exerciseName: string
): Promise<{ exerciseName: string; history: ExerciseHistoryItem[] }> {
  const { data: matchingExercises, error: exercisesError } = await supabase
    .from("session_exercises")
    .select("id, session_id, exercise_name")
    .eq("exercise_name", exerciseName);

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const history: ExerciseHistoryItem[] = [];

  for (const exercise of matchingExercises || []) {
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("performed_at")
      .eq("id", exercise.session_id)
      .maybeSingle();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    const { data: sets, error: setsError } = await supabase
      .from("session_sets")
      .select("*")
      .eq("session_exercise_id", exercise.id)
      .order("set_number", { ascending: true });

    if (setsError) {
      throw new Error(setsError.message);
    }

    history.push({
      performedAt: session?.performed_at || new Date().toISOString(),
      sets: (sets || []).map((setItem) => ({
        setNumber: setItem.set_number,
        actualReps: setItem.actual_reps,
        actualWeight: Number(setItem.actual_weight),
      })),
    });
  }

  history.sort(
    (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );

  return {
    exerciseName,
    history,
  };
}
