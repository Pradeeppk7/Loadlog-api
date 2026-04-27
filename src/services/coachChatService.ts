import config from '../config';
import { WorkoutPlan, WorkoutSession } from '../models/workoutPlanModels';
import { listWorkoutPlansFiltered } from '../store/workoutPlanStore';
import { listWorkoutSessionsFiltered } from '../store/workoutSessionStore';
import logger from '../utils/logger';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CoachProfile {
  name?: string;
  goal?: string;
  dietaryPreferences?: string;
  injuriesOrLimitations?: string;
}

export interface CoachChatInput {
  message: string;
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

async function getTrainingContext(): Promise<string> {
  try {
    const [plans, sessions] = await Promise.all([
      listWorkoutPlansFiltered(),
      listWorkoutSessionsFiltered(),
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

function buildSystemPrompt(profile: CoachProfile | undefined, trainingContext: string): string {
  const profileLines = [
    profile?.name ? `Customer name: ${profile.name}` : undefined,
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
    'Keep answers concise, actionable, and encouraging without sounding promotional.',
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

function extractText(response: GeminiResponse): string | undefined {
  const parts = response.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map(part => part.text || '')
    .join('')
    .trim();

  return text || undefined;
}

export async function getCoachChatReply(input: CoachChatInput): Promise<string> {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const trainingContext = await getTrainingContext();
  const systemPrompt = buildSystemPrompt(input.profile, trainingContext);
  const contents = buildConversation(input, systemPrompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.gemini.apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      }),
    }
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Gemini request failed');
  }

  const text = extractText(payload);

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}
