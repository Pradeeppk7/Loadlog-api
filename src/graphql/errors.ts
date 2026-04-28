import { GraphQLError } from 'graphql';
import logger from '../utils/logger';

export function notFound(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  });
}

export function validationError(message: string): never {
  throw new GraphQLError(message, {
    extensions: { code: 'VALIDATION_ERROR' },
  });
}

export function databaseError(message: string): never {
  logger.error('Database error', { error: message });
  throw new GraphQLError('Internal server error', {
    extensions: { code: 'INTERNAL_ERROR' },
  });
}
