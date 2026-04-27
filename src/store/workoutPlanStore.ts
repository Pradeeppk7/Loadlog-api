import { supabase } from '../db/supabaseClient';
import { WorkoutPlan, CreateWorkoutPlanInput } from '../models/workoutPlanModels';

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

function mapPlanSets(rows: any[]): PlanSet[] {
  return (rows || []).map(row => ({
    setNumber: row.set_number,
    targetReps: row.target_reps,
    targetWeight: Number(row.target_weight),
  }));
}

async function buildWorkoutPlan(plan: any): Promise<WorkoutPlan> {
  const { data: exercises, error: exercisesError } = await supabase
    .from('plan_exercises')
    .select('*')
    .eq('plan_id', plan.id)
    .order('order_index', { ascending: true });

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const formattedExercises: PlanExercise[] = [];

  for (const exercise of exercises || []) {
    const { data: sets, error: setsError } = await supabase
      .from('plan_sets')
      .select('*')
      .eq('plan_exercise_id', exercise.id)
      .order('set_number', { ascending: true });

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

export async function listWorkoutPlans(): Promise<WorkoutPlan[]> {
  return listWorkoutPlansFiltered();
}

export async function listWorkoutPlansFiltered(filters?: {
  nameContains?: string;
}): Promise<WorkoutPlan[]> {
  let query = supabase.from('workout_plans').select('*').order('created_at', { ascending: true });

  if (filters?.nameContains) {
    query = query.ilike('name', `%${filters.nameContains}%`);
  }

  const { data: plans, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const result: WorkoutPlan[] = [];

  for (const plan of plans || []) {
    result.push(await buildWorkoutPlan(plan));
  }

  return result;
}

export async function createWorkoutPlan(data: CreateWorkoutPlanInput): Promise<WorkoutPlan> {
  const { data: plan, error: planError } = await supabase
    .from('workout_plans')
    .insert({
      name: data.name,
      description: data.description,
    })
    .select()
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message || 'Failed to create workout plan');
  }

  for (const exercise of data.exercises) {
    const { data: planExercise, error: exerciseError } = await supabase
      .from('plan_exercises')
      .insert({
        plan_id: plan.id,
        exercise_name: exercise.exerciseName,
        order_index: exercise.order,
      })
      .select()
      .single();

    if (exerciseError || !planExercise) {
      throw new Error(exerciseError?.message || 'Failed to create plan exercise');
    }

    const setsToInsert = exercise.sets.map(setItem => ({
      plan_exercise_id: planExercise.id,
      set_number: setItem.setNumber,
      target_reps: setItem.targetReps,
      target_weight: setItem.targetWeight,
    }));

    const { error: setsError } = await supabase.from('plan_sets').insert(setsToInsert);

    if (setsError) {
      throw new Error(setsError.message);
    }
  }

  return (await getWorkoutPlanById(plan.id)) as WorkoutPlan;
}

export async function getWorkoutPlanById(planId: string): Promise<WorkoutPlan | undefined> {
  const { data: plan, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', planId)
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
    .from('workout_plans')
    .update({
      name: data.name,
      description: data.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { data: existingExercises, error: existingExercisesError } = await supabase
    .from('plan_exercises')
    .select('id')
    .eq('plan_id', planId);

  if (existingExercisesError) {
    throw new Error(existingExercisesError.message);
  }

  for (const exercise of existingExercises || []) {
    const { error: deleteSetsError } = await supabase
      .from('plan_sets')
      .delete()
      .eq('plan_exercise_id', exercise.id);

    if (deleteSetsError) {
      throw new Error(deleteSetsError.message);
    }
  }

  const { error: deleteExercisesError } = await supabase
    .from('plan_exercises')
    .delete()
    .eq('plan_id', planId);

  if (deleteExercisesError) {
    throw new Error(deleteExercisesError.message);
  }

  for (const exercise of data.exercises) {
    const { data: planExercise, error: exerciseError } = await supabase
      .from('plan_exercises')
      .insert({
        plan_id: planId,
        exercise_name: exercise.exerciseName,
        order_index: exercise.order,
      })
      .select()
      .single();

    if (exerciseError || !planExercise) {
      throw new Error(exerciseError?.message || 'Failed to recreate plan exercise');
    }

    const setsToInsert = exercise.sets.map(setItem => ({
      plan_exercise_id: planExercise.id,
      set_number: setItem.setNumber,
      target_reps: setItem.targetReps,
      target_weight: setItem.targetWeight,
    }));

    const { error: setsError } = await supabase.from('plan_sets').insert(setsToInsert);

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
    .from('plan_exercises')
    .select('id')
    .eq('plan_id', planId);

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  for (const exercise of exercises || []) {
    const { error: deleteSetsError } = await supabase
      .from('plan_sets')
      .delete()
      .eq('plan_exercise_id', exercise.id);

    if (deleteSetsError) {
      throw new Error(deleteSetsError.message);
    }
  }

  const { error: deleteExercisesError } = await supabase
    .from('plan_exercises')
    .delete()
    .eq('plan_id', planId);

  if (deleteExercisesError) {
    throw new Error(deleteExercisesError.message);
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('plan_id', planId);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  for (const session of sessions || []) {
    const { data: sessionExercises, error: sessionExercisesError } = await supabase
      .from('session_exercises')
      .select('id')
      .eq('session_id', session.id);

    if (sessionExercisesError) {
      throw new Error(sessionExercisesError.message);
    }

    for (const sessionExercise of sessionExercises || []) {
      const { error: deleteSessionSetsError } = await supabase
        .from('session_sets')
        .delete()
        .eq('session_exercise_id', sessionExercise.id);

      if (deleteSessionSetsError) {
        throw new Error(deleteSessionSetsError.message);
      }
    }

    const { error: deleteSessionExercisesError } = await supabase
      .from('session_exercises')
      .delete()
      .eq('session_id', session.id);

    if (deleteSessionExercisesError) {
      throw new Error(deleteSessionExercisesError.message);
    }
  }

  const { error: deleteSessionsError } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('plan_id', planId);

  if (deleteSessionsError) {
    throw new Error(deleteSessionsError.message);
  }

  const { error: deletePlanError } = await supabase.from('workout_plans').delete().eq('id', planId);

  if (deletePlanError) {
    throw new Error(deletePlanError.message);
  }

  return true;
}
