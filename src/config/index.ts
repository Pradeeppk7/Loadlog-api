import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  gemini: {
    apiKey: string | undefined;
    model: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  return value;
}

const config: Config = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  auth: {
    jwtSecret: validateEnvVar('JWT_SECRET', process.env['JWT_SECRET']),
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
  },
  supabase: {
    url: validateEnvVar('SUPABASE_URL', process.env['SUPABASE_URL']),
    anonKey: validateEnvVar('SUPABASE_ANON_KEY', process.env['SUPABASE_ANON_KEY']),
  },
  gemini: {
    apiKey: process.env['GEMINI_API_KEY'],
    model: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
  },
  cors: {
    allowedOrigins: [
      'https://frontend-load-log.vercel.app',
      'https://loadlog-api.onrender.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://localhost:5174',
    ],
  },
  isDevelopment: process.env['NODE_ENV'] === 'development',
  isProduction: process.env['NODE_ENV'] === 'production',
  isTest: process.env['NODE_ENV'] === 'test',
};

export default config;
