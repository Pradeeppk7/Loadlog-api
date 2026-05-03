import express from 'express';
import { JsonObject } from 'swagger-ui-express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { createHandler } from 'graphql-http/lib/use/express';
import { apiHandler } from './routes/api';
import { rootValue, schema } from './graphql/schema';
import config from './config';
import logger from './utils/logger';
import { authHandlers } from './handlers/authHandlers';
import {
  securityMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  requestLogger,
} from './middleware/security';
import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

const openapiDocument = YAML.load(path.join(__dirname, 'openapi', 'openapi.yaml')) as JsonObject;
const graphiqlHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LoadLog GraphQL</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: Consolas, "Courier New", monospace;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top left, #1f3a5f 0, transparent 28%),
          linear-gradient(160deg, #0b1220 0%, #111827 55%, #162033 100%);
        color: #e5eefc;
      }
      .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
      }
      .header {
        margin-bottom: 20px;
      }
      .header h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      .header p {
        margin: 0;
        color: #b3c2db;
      }
      .grid {
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 16px;
      }
      .panel {
        background: rgba(9, 14, 25, 0.82);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      }
      .panel-header strong {
        font-size: 14px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .actions {
        display: flex;
        gap: 10px;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 10px 14px;
        font: inherit;
        color: #08111f;
        background: #7dd3fc;
        cursor: pointer;
      }
      button.secondary {
        background: #cbd5e1;
      }
      textarea, pre {
        width: 100%;
        min-height: 520px;
        margin: 0;
        padding: 16px;
        border: 0;
        outline: none;
        resize: vertical;
        background: transparent;
        color: #f8fafc;
        font: 14px/1.5 Consolas, "Courier New", monospace;
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
      }
      .examples {
        margin-top: 16px;
        padding: 16px;
        background: rgba(9, 14, 25, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
      }
      .examples strong {
        display: block;
        margin-bottom: 10px;
      }
      .examples button {
        margin-right: 10px;
        margin-bottom: 10px;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
        textarea, pre {
          min-height: 320px;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <h1>LoadLog GraphQL</h1>
        <p>Use this page to send GraphQL queries to <code>POST /graphql</code>.</p>
      </div>
      <div class="grid">
        <section class="panel">
          <div class="panel-header">
            <strong>Query</strong>
            <div class="actions">
              <button id="run" type="button">Run Query</button>
              <button id="clear" type="button" class="secondary">Clear</button>
            </div>
          </div>
          <textarea id="queryEditor">query {
  users {
    id
    name
    email
    coachProfile {
      goal
      experienceLevel
    }
  }
}</textarea>
        </section>
        <section class="panel">
          <div class="panel-header">
            <strong>Response</strong>
          </div>
          <pre id="resultViewer">Run a query to see the response.</pre>
        </section>
      </div>
      <div class="examples">
        <strong>Examples</strong>
        <button type="button" data-query="query {&#10;  users {&#10;    id&#10;    name&#10;    email&#10;    coachProfile {&#10;      goal&#10;      experienceLevel&#10;    }&#10;  }&#10;}">List Users</button>
        <button type="button" data-query="query {&#10;  user(userId: &quot;user-id-here&quot;) {&#10;    id&#10;    name&#10;    email&#10;    age&#10;    coachProfile {&#10;      goal&#10;      dietaryPreferences&#10;      injuriesOrLimitations&#10;      experienceLevel&#10;    }&#10;  }&#10;}">Get User</button>
        <button type="button" data-query="query {&#10;  workoutPlans {&#10;    items {&#10;      id&#10;      name&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">List Plans</button>
        <button type="button" data-query="query {&#10;  workoutPlans(nameContains: &quot;Push&quot;, userId: &quot;user-id-here&quot;, page: 1, pageSize: 5) {&#10;    items {&#10;      id&#10;      userId&#10;      name&#10;      description&#10;      exercises {&#10;        exerciseName&#10;        order&#10;      }&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">Filter Plans</button>
        <button type="button" data-query="query {&#10;  workoutPlan(planId: &quot;plan-id-here&quot;) {&#10;    id&#10;    name&#10;    description&#10;    createdAt&#10;    updatedAt&#10;    exercises {&#10;      id&#10;      exerciseName&#10;      order&#10;      sets {&#10;        setNumber&#10;        targetReps&#10;        targetWeight&#10;      }&#10;    }&#10;  }&#10;}">Get Plan By ID</button>
        <button type="button" data-query="query {&#10;  workoutSessions {&#10;    items {&#10;      id&#10;      planId&#10;      performedAt&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">List Sessions</button>
        <button type="button" data-query="query {&#10;  workoutSessions(planId: &quot;plan-id-here&quot;, userId: &quot;user-id-here&quot;, page: 1, pageSize: 5) {&#10;    items {&#10;      id&#10;      userId&#10;      planId&#10;      performedAt&#10;      notes&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">Filter Sessions</button>
        <button type="button" data-query="query {&#10;  workoutSession(sessionId: &quot;session-id-here&quot;) {&#10;    id&#10;    planId&#10;    performedAt&#10;    notes&#10;    exercises {&#10;      exerciseName&#10;      sets {&#10;        setNumber&#10;        actualReps&#10;        actualWeight&#10;      }&#10;    }&#10;  }&#10;}">Get Session By ID</button>
        <button type="button" data-query="query {&#10;  exerciseHistory(exerciseName: &quot;Bench Press&quot;) {&#10;    exerciseName&#10;    history {&#10;      performedAt&#10;    }&#10;  }&#10;}">Exercise History</button>
        <button type="button" data-query="mutation {&#10;  createUser(input: {&#10;    name: &quot;Pradeep&quot;&#10;    email: &quot;pradeep@example.com&quot;&#10;    age: 24&#10;    coachProfile: {&#10;      goal: &quot;Build muscle&quot;&#10;      dietaryPreferences: &quot;High protein&quot;&#10;      injuriesOrLimitations: &quot;None&quot;&#10;      experienceLevel: &quot;intermediate&quot;&#10;    }&#10;  }) {&#10;    id&#10;    name&#10;    email&#10;  }&#10;}">Create User</button>
        <button type="button" data-query="mutation {&#10;  createWorkoutPlan( input: {&#10;    userId: &quot;user-id-here&quot;&#10;    name: &quot;Push Day A&quot;&#10;    description: &quot;Chest, shoulders, triceps&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Bench Press&quot;&#10;        order: 1&#10;        sets: [&#10;          { setNumber: 1, targetReps: 8, targetWeight: 80 }&#10;          { setNumber: 2, targetReps: 8, targetWeight: 80 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    userId&#10;    name&#10;    createdAt&#10;  }&#10;}">Create Plan</button>
        <button type="button" data-query="mutation {&#10;  updateWorkoutPlan( planId: &quot;plan-id-here&quot;, input: {&#10;    userId: &quot;user-id-here&quot;&#10;    name: &quot;Push Day A Updated&quot;&#10;    description: &quot;Updated plan details&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Incline Bench Press&quot;&#10;        order: 1&#10;        sets: [&#10;          { setNumber: 1, targetReps: 10, targetWeight: 60 }&#10;          { setNumber: 2, targetReps: 8, targetWeight: 65 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    userId&#10;    name&#10;    updatedAt&#10;  }&#10;}">Update Plan</button>
        <button type="button" data-query="mutation {&#10;  deleteWorkoutPlan(planId: &quot;plan-id-here&quot;) {&#10;    success&#10;  }&#10;}">Delete Plan</button>
        <button type="button" data-query="mutation {&#10;  createWorkoutSession(input: {&#10;    userId: &quot;user-id-here&quot;&#10;    planId: &quot;plan-id-here&quot;&#10;    performedAt: &quot;2026-04-27T18:30:00.000Z&quot;&#10;    notes: &quot;Solid session&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Bench Press&quot;&#10;        sets: [&#10;          { setNumber: 1, actualReps: 8, actualWeight: 80 }&#10;          { setNumber: 2, actualReps: 7, actualWeight: 80 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    userId&#10;    planId&#10;    performedAt&#10;  }&#10;}">Create Session</button>
        <button type="button" data-query="mutation {&#10;  coachChat(input: {&#10;    userId: &quot;user-id-here&quot;&#10;    message: &quot;Give me a workout and nutrition suggestion for this week.&quot;&#10;    profile: {&#10;      goal: &quot;Build muscle&quot;&#10;      dietaryPreferences: &quot;High protein&quot;&#10;      injuriesOrLimitations: &quot;None&quot;&#10;      experienceLevel: &quot;intermediate&quot;&#10;    }&#10;  }) {&#10;    reply&#10;    model&#10;  }&#10;}">Coach Chat</button>
      </div>
    </div>
    <script>
      const queryEditor = document.getElementById("queryEditor");
      const resultViewer = document.getElementById("resultViewer");
      const runButton = document.getElementById("run");
      const clearButton = document.getElementById("clear");

      async function runQuery() {
        resultViewer.textContent = "Loading...";
        const response = await fetch("/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryEditor.value }),
        });
        const payload = await response.json();
        resultViewer.textContent = JSON.stringify(payload, null, 2);
      }

      runButton.addEventListener("click", () => {
        runQuery().catch((error) => {
          resultViewer.textContent = error.message;
        });
      });

      clearButton.addEventListener("click", () => {
        resultViewer.textContent = "Run a query to see the response.";
      });

      document.querySelectorAll("[data-query]").forEach((button) => {
        button.addEventListener("click", () => {
          queryEditor.value = button.getAttribute("data-query");
        });
      });
    </script>
  </body>
</html>`;

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
  app.post('/graphql', createHandler({ schema, rootValue }));
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
