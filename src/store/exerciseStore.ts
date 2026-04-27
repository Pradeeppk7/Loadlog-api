import { supabase } from '../db/supabaseClient';
import { ExerciseHistory } from '../models/workoutPlanModels';

type ExerciseHistorySet = {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
};

type ExerciseHistoryItem = {
  performedAt: string;
  sets: ExerciseHistorySet[];
};

type SessionExerciseRow = {
  id: string;
  session_id: string;
};

type WorkoutSessionRow = {
  performed_at: string;
};

type SessionSetRow = {
  set_number: number;
  actual_reps: number;
  actual_weight: number;
};

export async function getExerciseHistory(exerciseName: string): Promise<ExerciseHistory> {
  const { data: matchingExercises, error: exercisesError } = await supabase
    .from('session_exercises')
    .select('id, session_id, exercise_name')
    .eq('exercise_name', exerciseName);

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const history: ExerciseHistoryItem[] = [];

  for (const exercise of (matchingExercises || []) as SessionExerciseRow[]) {
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .select('performed_at')
      .eq('id', exercise.session_id)
      .maybeSingle<WorkoutSessionRow>();

    if (sessionError) {
      throw new Error(sessionError.message);
    }

    const { data: sets, error: setsError } = await supabase
      .from('session_sets')
      .select('*')
      .eq('session_exercise_id', exercise.id)
      .order('set_number', { ascending: true });

    if (setsError) {
      throw new Error(setsError.message);
    }

    history.push({
      performedAt: session?.performed_at || new Date().toISOString(),
      sets: ((sets || []) as SessionSetRow[]).map(setItem => ({
        setNumber: setItem.set_number,
        actualReps: setItem.actual_reps,
        actualWeight: Number(setItem.actual_weight),
      })),
    });
  }

  history.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  return {
    exerciseName,
    history,
  };
}
