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
    ]
  }
];

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

export function listWorkoutPlans(): WorkoutPlan[] {
  return workoutPlans;
}

export function createWorkoutPlan(data: Omit<WorkoutPlan, "id">): WorkoutPlan {
  const newPlan: WorkoutPlan = {
    id: Date.now().toString(),
    ...data
  };

  workoutPlans.push(newPlan);
  return newPlan;
}

export function getWorkoutPlanById(planId: string): WorkoutPlan | undefined {
  return workoutPlans.find((plan) => plan.id === planId);
}

export function updateWorkoutPlan(
  planId: string,
  data: Omit<WorkoutPlan, "id">
): WorkoutPlan | undefined {
  const index = workoutPlans.findIndex((plan) => plan.id === planId);

  if (index === -1) {
    return undefined;
  }

  const updatedPlan: WorkoutPlan = {
    id: planId,
    ...data
  };

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

export function getExerciseHistory(exerciseName: string): {
  exerciseName: string;
  history: ExerciseHistoryItem[];
} {
  return {
    exerciseName,
    history: exerciseHistory[exerciseName] || []
  };
}