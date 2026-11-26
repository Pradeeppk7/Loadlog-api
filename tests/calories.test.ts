import {
  DEFAULT_BODY_WEIGHT_KG,
  estimateCaloriesBurned,
  estimateSessionDurationMinutes,
} from '../src/utils/calories';

describe('calorie estimation', () => {
  const session = [
    {
      exerciseName: 'Bench Press',
      sets: [
        { setNumber: 1, actualReps: 8, actualWeight: 60 },
        { setNumber: 2, actualReps: 8, actualWeight: 60 },
        { setNumber: 3, actualReps: 8, actualWeight: 60 },
      ],
    },
    {
      exerciseName: 'Squat',
      sets: [
        { setNumber: 1, actualReps: 5, actualWeight: 100 },
        { setNumber: 2, actualReps: 5, actualWeight: 100 },
      ],
    },
  ];

  it('derives duration from reps and sets', () => {
    // 34 reps * 3s + 5 sets * 90s = 552s = 9.2 minutes
    expect(estimateSessionDurationMinutes(session)).toBeCloseTo(9.2);
  });

  it('returns zero for an empty session', () => {
    expect(estimateCaloriesBurned([])).toBe(0);
    expect(estimateCaloriesBurned([{ sets: [] }])).toBe(0);
  });

  it('estimates a plausible, positive integer for a typical session', () => {
    const kcal = estimateCaloriesBurned(session);
    expect(Number.isInteger(kcal)).toBe(true);
    expect(kcal).toBeGreaterThan(40);
    expect(kcal).toBeLessThan(120);
  });

  it('burns more with heavier loads for the same volume of work', () => {
    const light = [{ sets: [{ actualReps: 10, actualWeight: 10 }] }];
    const heavy = [{ sets: [{ actualReps: 10, actualWeight: 90 }] }];
    expect(estimateCaloriesBurned(heavy)).toBeGreaterThan(estimateCaloriesBurned(light));
  });

  it('caps the intensity multiplier for very heavy loads', () => {
    const heavy = [{ sets: [{ actualReps: 5, actualWeight: 200 }] }];
    const heavier = [{ sets: [{ actualReps: 5, actualWeight: 400 }] }];
    expect(estimateCaloriesBurned(heavier)).toBe(estimateCaloriesBurned(heavy));
  });

  it('scales with body weight', () => {
    expect(estimateCaloriesBurned(session, DEFAULT_BODY_WEIGHT_KG * 1.5)).toBeGreaterThan(
      estimateCaloriesBurned(session)
    );
  });

  it('ignores negative reps and weights', () => {
    expect(estimateCaloriesBurned([{ sets: [{ actualReps: -5, actualWeight: -10 }] }])).toBe(
      estimateCaloriesBurned([{ sets: [{ actualReps: 0, actualWeight: 0 }] }])
    );
  });
});
