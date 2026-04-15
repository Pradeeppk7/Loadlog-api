import { supabase } from "../db/supabaseClient";
import { WorkoutSession, CreateWorkoutSessionInput } from "../models/workoutPlanModels";

type SessionSet = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

type SessionExercise = {
  exerciseName: string;
  sets: SessionSet[];
};

function mapSessionSets(rows: any[]): SessionSet[] {
  return (rows || []).map((row) => ({
    setNumber: row.set_number,
    actualReps: row.actual_reps,
    actualWeight: Number(row.actual_weight),
  }));
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