import { supabase } from '../db/supabaseClient';
import {
  CreateUserInput,
  RegisterUserInput,
  UpdateUserInput,
  User,
} from '../models/workoutPlanModels';

type UserRow = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  password_hash: string | null;
  goal: string | null;
  dietary_preferences: string | null;
  injuries_or_limitations: string | null;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null;
  created_at: string;
  updated_at: string;
};

export type UserAuthRecord = {
  user: User;
  passwordHash: string;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.age !== null ? { age: row.age } : {}),
    ...(row.goal || row.dietary_preferences || row.injuries_or_limitations || row.experience_level
      ? {
          coachProfile: {
            ...(row.goal ? { goal: row.goal } : {}),
            ...(row.dietary_preferences ? { dietaryPreferences: row.dietary_preferences } : {}),
            ...(row.injuries_or_limitations
              ? { injuriesOrLimitations: row.injuries_or_limitations }
              : {}),
            ...(row.experience_level ? { experienceLevel: row.experience_level } : {}),
          },
        }
      : {}),
  };
}

function mapUserInput(input: CreateUserInput | UpdateUserInput) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.age !== undefined ? { age: input.age } : {}),
    ...(input.coachProfile?.goal !== undefined ? { goal: input.coachProfile.goal } : {}),
    ...(input.coachProfile?.dietaryPreferences !== undefined
      ? { dietary_preferences: input.coachProfile.dietaryPreferences }
      : {}),
    ...(input.coachProfile?.injuriesOrLimitations !== undefined
      ? { injuries_or_limitations: input.coachProfile.injuriesOrLimitations }
      : {}),
    ...(input.coachProfile?.experienceLevel !== undefined
      ? { experience_level: input.coachProfile.experienceLevel }
      : {}),
  };
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as UserRow[]).map(mapUser);
}

export async function getUserById(userId: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle<UserRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapUser(data) : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle<UserRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapUser(data) : undefined;
}

export async function getUserAuthByEmail(email: string): Promise<UserAuthRecord | undefined> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle<UserRow>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !data.password_hash) {
    return undefined;
  }

  return {
    user: mapUser(data),
    passwordHash: data.password_hash,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...mapUserInput(input),
      email: input.email.toLowerCase(),
    })
    .select('*')
    .single<UserRow>();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create user');
  }

  return mapUser(data);
}

export async function createUserWithPassword(
  input: RegisterUserInput,
  passwordHash: string
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...mapUserInput(input),
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
    })
    .select('*')
    .single<UserRow>();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create user');
  }

  return mapUser(data);
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput
): Promise<User | undefined> {
  const existing = await getUserById(userId);

  if (!existing) {
    return undefined;
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      ...mapUserInput(input),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single<UserRow>();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update user');
  }

  return mapUser(data);
}
