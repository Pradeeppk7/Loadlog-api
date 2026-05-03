import config from '../config';
import { CoachProfile, WorkoutPlan, WorkoutSession } from '../models/workoutPlanModels';
import { listWorkoutPlansFiltered } from '../store/workoutPlanStore';
import { listWorkoutSessionsFiltered } from '../store/workoutSessionStore';
import { getUserById } from '../store/userStore';
import logger from '../utils/logger';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CoachChatInput {
  message: string;
  userId?: string;
  history?: ChatMessage[];
  profile?: CoachProfile;
}

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiCandidate {
  finishReason?: string;
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
}

function formatPlanSummary(plan: WorkoutPlan): string {
  const exercises = plan.exercises
    .slice(0, 4)
    .map(exercise => {
      const sets = exercise.sets
        .slice(0, 3)
        .map(setItem => `${setItem.setNumber}:${setItem.targetReps}x${setItem.targetWeight}`)
        .join(', ');

      return `${exercise.order}. ${exercise.exerciseName} [${sets}]`;
    })
    .join(' | ');

  return `Plan "${plan.name}" (${plan.id}): ${exercises}`;
}

function formatSessionSummary(session: WorkoutSession): string {
  const exercises = session.exercises
    .slice(0, 3)
    .map(exercise => {
      const sets = exercise.sets
        .slice(0, 3)
        .map(setItem => `${setItem.setNumber}:${setItem.actualReps}x${setItem.actualWeight}`)
        .join(', ');

      return `${exercise.exerciseName} [${sets}]`;
    })
    .join(' | ');

  return `Session ${session.id} on ${session.performedAt} for plan ${session.planId}: ${exercises}`;
}

async function getTrainingContext(userId?: string): Promise<string> {
  try {
    const [plans, sessions] = await Promise.all([
      listWorkoutPlansFiltered(userId ? { userId } : {}),
      listWorkoutSessionsFiltered(userId ? { userId } : {}),
    ]);

    const recentPlans = plans.slice(0, 3).map(formatPlanSummary);
    const recentSessions = sessions.slice(0, 5).map(formatSessionSummary);

    return [
      recentPlans.length > 0
        ? `Current workout plans:\n- ${recentPlans.join('\n- ')}`
        : 'Current workout plans: none found.',
      recentSessions.length > 0
        ? `Recent workout sessions:\n- ${recentSessions.join('\n- ')}`
        : 'Recent workout sessions: none found.',
    ].join('\n\n');
  } catch (error) {
    logger.warn('Unable to load training context for coach chat', { error });
    return 'Workout data context is currently unavailable.';
  }
}

function buildSystemPrompt(
  userName: string | undefined,
  profile: CoachProfile | undefined,
  trainingContext: string
): string {
  const profileLines = [
    userName ? `Customer name: ${userName}` : undefined,
    profile?.goal ? `Primary goal: ${profile.goal}` : undefined,
    profile?.dietaryPreferences ? `Dietary preferences: ${profile.dietaryPreferences}` : undefined,
    profile?.injuriesOrLimitations
      ? `Injuries or limitations: ${profile.injuriesOrLimitations}`
      : undefined,
  ].filter(Boolean);

  return [
    'You are LoadLog Coach, a supportive personal trainer and nutrition specialist.',
    'Answer fitness, recovery, workout planning, and nutrition questions clearly and practically.',
    'Use the workout context when it is relevant. If the user asks something unrelated, answer briefly and steer back to health and training support.',
    'Do not claim to be a doctor. For medical conditions, eating disorders, severe pain, chest pain, fainting, or supplement safety concerns, advise the user to contact a qualified medical professional.',
    'Do not invent customer data. If context is missing, say so and ask a focused follow-up question.',
    'Keep answers as short as possible while still fully answering the question.',
    'Use plain text only. Prefer 1 to 3 short sentences. Avoid lists unless the user explicitly asks for them.',
    'Always end with a complete sentence. Do not trail off or stop mid-thought.',
    profileLines.length > 0
      ? `Customer profile:\n- ${profileLines.join('\n- ')}`
      : 'Customer profile: not provided.',
    trainingContext,
  ].join('\n\n');
}

function buildConversation(input: CoachChatInput, systemPrompt: string): GeminiContent[] {
  const history = (input.history || []).slice(-20);
  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [{ text: systemPrompt }],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'Understood. I will act as LoadLog Coach and answer as a personal trainer and nutrition specialist.',
        },
      ],
    },
  ];

  for (const item of history) {
    contents.push({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: input.message }],
  });

  return contents;
}

function extractCandidate(response: GeminiResponse): { text?: string; finishReason?: string } {
  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const text = parts
    .map(part => part.text || '')
    .join('')
    .trim();
  const result: { text?: string; finishReason?: string } = {};

  if (text) {
    result.text = text;
  }

  if (candidate?.finishReason) {
    result.finishReason = candidate.finishReason;
  }

  return result;
}

async function requestGemini(
  contents: GeminiContent[],
  maxOutputTokens: number
): Promise<GeminiResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.gemini.apiKey!,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens,
        },
      }),
    }
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Gemini request failed');
  }

  return payload;
}

export async function getCoachChatReply(input: CoachChatInput): Promise<string> {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const storedUser = input.userId ? await getUserById(input.userId) : undefined;
  const mergedProfile = {
    ...(storedUser?.coachProfile || {}),
    ...(input.profile || {}),
  };
  const trainingContext = await getTrainingContext(input.userId);
  const systemPrompt = buildSystemPrompt(storedUser?.name, mergedProfile, trainingContext);
  const contents = buildConversation(input, systemPrompt);
  const initialPayload = await requestGemini(contents, 1200);
  const initialCandidate = extractCandidate(initialPayload);

  if (!initialCandidate.text) {
    throw new Error('Gemini returned an empty response');
  }

  if (initialCandidate.finishReason !== 'MAX_TOKENS') {
    return initialCandidate.text;
  }

  logger.warn('Coach chat response hit max tokens, requesting continuation', {
    model: config.gemini.model,
  });

  const continuationPayload = await requestGemini(
    [
      ...contents,
      {
        role: 'model',
        parts: [{ text: initialCandidate.text }],
      },
      {
        role: 'user',
        parts: [
          {
            text: 'Continue exactly where you stopped. Do not repeat earlier text. Finish the answer completely.',
          },
        ],
      },
    ],
    800
  );
  const continuationCandidate = extractCandidate(continuationPayload);

  return `${initialCandidate.text}${continuationCandidate.text ? `\n${continuationCandidate.text}` : ''}`;
}
