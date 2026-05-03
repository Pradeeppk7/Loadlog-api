import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthPayload, LoginInput, RegisterUserInput, User } from '../models/workoutPlanModels';
import {
  createUserWithPassword,
  getUserAuthByEmail,
  getUserByEmail,
  getUserById,
} from '../store/userStore';

type AuthTokenClaims = {
  sub: string;
  email: string;
};

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAuthToken(user: Pick<User, 'id' | 'email'>): string {
  const signOptions: jwt.SignOptions = {
    subject: user.id,
  };

  if (config.auth.jwtExpiresIn) {
    signOptions.expiresIn = config.auth.jwtExpiresIn as NonNullable<jwt.SignOptions['expiresIn']>;
  }

  return jwt.sign(
    { email: user.email } satisfies Omit<AuthTokenClaims, 'sub'>,
    config.auth.jwtSecret,
    signOptions
  );
}

export function verifyAuthToken(token: string): AuthTokenClaims {
  const decoded = jwt.verify(token, config.auth.jwtSecret);

  if (typeof decoded === 'string') {
    throw new Error('Invalid auth token');
  }

  const email = decoded['email'] as unknown;

  if (!decoded.sub || typeof decoded.sub !== 'string' || !email || typeof email !== 'string') {
    throw new Error('Invalid auth token');
  }

  return {
    sub: decoded.sub,
    email,
  };
}

export async function registerUser(input: RegisterUserInput): Promise<AuthPayload> {
  const [existingAuthUser, existingUser] = await Promise.all([
    getUserAuthByEmail(input.email),
    getUserByEmail(input.email),
  ]);

  if (existingAuthUser || existingUser) {
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUserWithPassword(input, passwordHash);

  return {
    user,
    token: signAuthToken(user),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthPayload> {
  const authRecord = await getUserAuthByEmail(input.email);

  if (!authRecord) {
    throw new Error('Invalid email or password');
  }

  const isValid = await verifyPassword(input.password, authRecord.passwordHash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  return {
    user: authRecord.user,
    token: signAuthToken(authRecord.user),
  };
}

export async function getAuthenticatedUser(userId: string): Promise<User | undefined> {
  return getUserById(userId);
}
