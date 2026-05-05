import express from 'express';
import { JsonObject } from 'swagger-ui-express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { createHandler } from 'graphql-http/lib/use/express';
import { apiHandler } from './routes/api';
import { graphiqlHtml } from './graphql/graphiqlHtml';
import { rootValue, schema } from './graphql/schema';
import config from './config';
import logger from './utils/logger';
import { authHandlers } from './handlers/authHandlers';
import { verifyAuthToken } from './services/authService';
import {
  securityMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  requestLogger,
} from './middleware/security';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

function getGraphQLAuthContext(req: express.Request) {
  const authorizationHeader = req.header('authorization');

  if (!authorizationHeader) {
    return {};
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return {};
  }

  try {
    const claims = verifyAuthToken(token);
    return {
      auth: {
        userId: claims.sub,
        email: claims.email,
      },
    };
  } catch {
    return {};
  }
}

const openapiDocument = YAML.load(path.join(__dirname, 'openapi', 'openapi.yaml')) as JsonObject;

export function createApp() {
  const app = express();

  // Security middleware
  app.use(securityMiddleware);

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  app.use(rateLimitMiddleware());

  // CORS middleware
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get('/graphql', (_req, res) => {
    res.type('html').send(graphiqlHtml);
  });
  app.post(
    '/graphql',
    createHandler({
      schema,
      rootValue,
      context: req => getGraphQLAuthContext(req.raw as express.Request),
    })
  );
  app.post('/auth/register', authHandlers.register);
  app.post('/auth/login', authHandlers.login);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    });
  });

  app.use(requireAuth);
  app.get('/auth/me', authHandlers.me);
  app.use(apiHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
}

const app = createApp();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

if (!config.isTest) {
  const server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`, {
      environment: config.nodeEnv,
      graphqlEndpoint: `http://localhost:${config.port}/graphql`,
      docsEndpoint: `http://localhost:${config.port}/docs`,
      healthEndpoint: `http://localhost:${config.port}/health`,
    });
  });

  // Handle server errors
  server.on('error', error => {
    logger.error('Server error:', error);
    process.exit(1);
  });
}

export default app;
