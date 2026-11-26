/**
 * Estimates calories burned for a resistance-training session from its logged sets.
 *
 * Approach (MET based, see the Compendium of Physical Activities):
 *   kcal = MET x 3.5 x bodyWeightKg / 200 x durationMinutes
 *
 * - Duration is derived from the work: ~3 seconds per rep plus ~90 seconds of rest per set.
 * - MET scales from 3.5 (light weight training) to 6.0 (vigorous) with the average load
 *   lifted per rep relative to body weight.
 * - Body weight is not stored on the user yet, so a 70 kg default is used.
 */

export const DEFAULT_BODY_WEIGHT_KG = 70;
const SECONDS_PER_REP = 3;
const REST_SECONDS_PER_SET = 90;
const MIN_MET = 3.5;
const MAX_MET = 6;

type EstimableSet = {
  actualReps: number;
  actualWeight: number;
};

type EstimableExercise = {
  sets: EstimableSet[];
};

export function estimateSessionDurationMinutes(exercises: EstimableExercise[]): number {
  let totalSets = 0;
  let totalReps = 0;

  for (const exercise of exercises) {
    for (const setItem of exercise.sets) {
      totalSets += 1;
      totalReps += Math.max(0, setItem.actualReps);
    }
  }

  return (totalReps * SECONDS_PER_REP + totalSets * REST_SECONDS_PER_SET) / 60;
}

export function estimateCaloriesBurned(
  exercises: EstimableExercise[],
  bodyWeightKg: number = DEFAULT_BODY_WEIGHT_KG
): number {
  let totalReps = 0;
  let totalVolume = 0;

  for (const exercise of exercises) {
    for (const setItem of exercise.sets) {
      const reps = Math.max(0, setItem.actualReps);
      totalReps += reps;
      totalVolume += reps * Math.max(0, setItem.actualWeight);
    }
  }

  const durationMinutes = estimateSessionDurationMinutes(exercises);
  if (durationMinutes <= 0) {
    return 0;
  }

  const averageLoadPerRep = totalReps > 0 ? totalVolume / totalReps : 0;
  const loadRatio = averageLoadPerRep / bodyWeightKg;
  const met = Math.min(MAX_MET, Math.max(MIN_MET, MIN_MET + loadRatio * 2.5));

  return Math.round((met * 3.5 * bodyWeightKg * durationMinutes) / 200);
}
