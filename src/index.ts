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
import {
  securityMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  requestLogger,
} from './middleware/security';
import { errorHandler } from './middleware/errorHandler';

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
  workoutPlans {
    id
    name
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
        <button type="button" data-query="query {&#10;  workoutPlans {&#10;    id&#10;    name&#10;  }&#10;}">List Plans</button>
        <button type="button" data-query="query {&#10;  workoutPlans(nameContains: &quot;Push&quot;) {&#10;    id&#10;    name&#10;    description&#10;    exercises {&#10;      exerciseName&#10;      order&#10;    }&#10;  }&#10;}">Filter Plans</button>
        <button type="button" data-query="query {&#10;  workoutPlan(planId: &quot;plan-id-here&quot;) {&#10;    id&#10;    name&#10;    description&#10;    createdAt&#10;    updatedAt&#10;    exercises {&#10;      id&#10;      exerciseName&#10;      order&#10;      sets {&#10;        setNumber&#10;        targetReps&#10;        targetWeight&#10;      }&#10;    }&#10;  }&#10;}">Get Plan By ID</button>
        <button type="button" data-query="query {&#10;  workoutSessions {&#10;    id&#10;    planId&#10;    performedAt&#10;  }&#10;}">List Sessions</button>
        <button type="button" data-query="query {&#10;  workoutSessions(planId: &quot;plan-id-here&quot;) {&#10;    id&#10;    planId&#10;    performedAt&#10;    notes&#10;  }&#10;}">Filter Sessions</button>
        <button type="button" data-query="query {&#10;  workoutSession(sessionId: &quot;session-id-here&quot;) {&#10;    id&#10;    planId&#10;    performedAt&#10;    notes&#10;    exercises {&#10;      exerciseName&#10;      sets {&#10;        setNumber&#10;        actualReps&#10;        actualWeight&#10;      }&#10;    }&#10;  }&#10;}">Get Session By ID</button>
        <button type="button" data-query="query {&#10;  exerciseHistory(exerciseName: &quot;Bench Press&quot;) {&#10;    exerciseName&#10;    history {&#10;      performedAt&#10;    }&#10;  }&#10;}">Exercise History</button>
        <button type="button" data-query="mutation {&#10;  createWorkoutPlan( input: {&#10;    name: &quot;Push Day A&quot;&#10;    description: &quot;Chest, shoulders, triceps&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Bench Press&quot;&#10;        order: 1&#10;        sets: [&#10;          { setNumber: 1, targetReps: 8, targetWeight: 80 }&#10;          { setNumber: 2, targetReps: 8, targetWeight: 80 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    name&#10;    createdAt&#10;  }&#10;}">Create Plan</button>
        <button type="button" data-query="mutation {&#10;  updateWorkoutPlan( planId: &quot;plan-id-here&quot;, input: {&#10;    name: &quot;Push Day A Updated&quot;&#10;    description: &quot;Updated plan details&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Incline Bench Press&quot;&#10;        order: 1&#10;        sets: [&#10;          { setNumber: 1, targetReps: 10, targetWeight: 60 }&#10;          { setNumber: 2, targetReps: 8, targetWeight: 65 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    name&#10;    updatedAt&#10;  }&#10;}">Update Plan</button>
        <button type="button" data-query="mutation {&#10;  deleteWorkoutPlan(planId: &quot;plan-id-here&quot;) {&#10;    success&#10;  }&#10;}">Delete Plan</button>
        <button type="button" data-query="mutation {&#10;  createWorkoutSession(input: {&#10;    planId: &quot;plan-id-here&quot;&#10;    performedAt: &quot;2026-04-27T18:30:00.000Z&quot;&#10;    notes: &quot;Solid session&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Bench Press&quot;&#10;        sets: [&#10;          { setNumber: 1, actualReps: 8, actualWeight: 80 }&#10;          { setNumber: 2, actualReps: 7, actualWeight: 80 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    planId&#10;    performedAt&#10;  }&#10;}">Create Session</button>
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
const coachHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LoadLog Coach</title>
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
          radial-gradient(circle at top right, rgba(14, 165, 233, 0.2), transparent 30%),
          radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.18), transparent 30%),
          linear-gradient(160deg, #081018 0%, #0f172a 50%, #132238 100%);
        color: #e2e8f0;
      }
      .page {
        max-width: 1180px;
        margin: 0 auto;
        padding: 24px;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 16px;
        margin-bottom: 16px;
      }
      .card {
        background: rgba(8, 15, 28, 0.84);
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 18px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
      }
      .hero-copy {
        padding: 22px;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 30px;
      }
      p {
        margin: 0;
        color: #bfd2ea;
        line-height: 1.6;
      }
      .tips {
        padding: 22px;
      }
      .tips strong, .panel-title strong {
        display: block;
        margin-bottom: 10px;
        font-size: 14px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .tips ul {
        margin: 0;
        padding-left: 18px;
        color: #d7e5f8;
      }
      .panel {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 16px;
      }
      .sidebar, .chatbox {
        min-height: 620px;
      }
      .sidebar {
        padding: 18px;
      }
      .field {
        margin-bottom: 14px;
      }
      label {
        display: block;
        margin-bottom: 6px;
        font-size: 13px;
        color: #cbd5e1;
      }
      input, textarea {
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
        padding: 12px;
        font: inherit;
        outline: none;
      }
      textarea {
        resize: vertical;
      }
      .chatbox {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .panel-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.14);
      }
      .messages {
        flex: 1;
        padding: 18px;
        overflow-y: auto;
      }
      .message {
        max-width: 85%;
        margin-bottom: 14px;
        padding: 14px 16px;
        border-radius: 16px;
        white-space: pre-wrap;
        line-height: 1.6;
      }
      .message.user {
        margin-left: auto;
        background: linear-gradient(135deg, #0ea5e9, #38bdf8);
        color: #062033;
      }
      .message.assistant {
        background: rgba(15, 23, 42, 0.96);
        border: 1px solid rgba(125, 211, 252, 0.16);
      }
      .composer {
        padding: 16px 18px 18px;
        border-top: 1px solid rgba(148, 163, 184, 0.14);
      }
      .composer textarea {
        min-height: 120px;
      }
      .actions {
        display: flex;
        gap: 10px;
        margin-top: 12px;
      }
      button {
        border: 0;
        border-radius: 12px;
        padding: 11px 16px;
        font: inherit;
        cursor: pointer;
        background: #22c55e;
        color: #062212;
      }
      button.secondary {
        background: #cbd5e1;
        color: #0f172a;
      }
      .quick-prompts {
        margin-top: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .quick-prompts button {
        background: #1e293b;
        color: #dbeafe;
        border: 1px solid rgba(148, 163, 184, 0.16);
      }
      .status {
        font-size: 13px;
        color: #94a3b8;
        min-height: 20px;
      }
      @media (max-width: 940px) {
        .hero, .panel {
          grid-template-columns: 1fr;
        }
        .sidebar, .chatbox {
          min-height: auto;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div class="card hero-copy">
          <h1>LoadLog Coach</h1>
          <p>Ask about workouts, recovery, protein targets, meal ideas, fat loss, muscle gain, and training form. The assistant uses your LoadLog plans and sessions when relevant.</p>
        </div>
        <div class="card tips">
          <strong>Suggested Topics</strong>
          <ul>
            <li>Build a weekly workout split</li>
            <li>Protein and calorie guidance</li>
            <li>Plateau troubleshooting</li>
            <li>Pre-workout and post-workout nutrition</li>
            <li>General customer fitness questions</li>
          </ul>
        </div>
      </section>
      <section class="panel">
        <aside class="card sidebar">
          <div class="field">
            <label for="name">Name</label>
            <input id="name" type="text" placeholder="Optional" />
          </div>
          <div class="field">
            <label for="goal">Goal</label>
            <textarea id="goal" rows="3" placeholder="Example: lose fat while keeping strength"></textarea>
          </div>
          <div class="field">
            <label for="diet">Dietary Preferences</label>
            <textarea id="diet" rows="3" placeholder="Example: vegetarian, high protein, lactose free"></textarea>
          </div>
          <div class="field">
            <label for="limitations">Injuries or Limitations</label>
            <textarea id="limitations" rows="3" placeholder="Example: shoulder pain during overhead pressing"></textarea>
          </div>
          <div class="quick-prompts">
            <button type="button" data-prompt="Make me a simple 3-day beginner workout split with progressive overload advice.">3-Day Split</button>
            <button type="button" data-prompt="How much protein should I eat each day if I want to build muscle?">Protein Help</button>
            <button type="button" data-prompt="My bench press has stalled. What should I change in training and recovery?">Bench Plateau</button>
            <button type="button" data-prompt="Give me a one-day high-protein vegetarian meal plan.">Meal Plan</button>
          </div>
        </aside>
        <section class="card chatbox">
          <div class="panel-title">
            <strong>Coach Chat</strong>
            <span class="status" id="status">Ready</span>
          </div>
          <div class="messages" id="messages">
            <div class="message assistant">I’m your LoadLog Coach. Ask a training, recovery, or nutrition question.</div>
          </div>
          <div class="composer">
            <textarea id="messageInput" placeholder="Ask about your workouts, meals, recovery, or any customer fitness doubt..."></textarea>
            <div class="actions">
              <button id="sendButton" type="button">Send</button>
              <button id="clearChat" type="button" class="secondary">Clear Chat</button>
            </div>
          </div>
        </section>
      </section>
    </div>
    <script>
      const statusNode = document.getElementById("status");
      const messagesNode = document.getElementById("messages");
      const messageInput = document.getElementById("messageInput");
      const sendButton = document.getElementById("sendButton");
      const clearChatButton = document.getElementById("clearChat");
      const history = [];

      function setStatus(text) {
        statusNode.textContent = text;
      }

      function appendMessage(role, content) {
        const item = document.createElement("div");
        item.className = "message " + role;
        item.textContent = content;
        messagesNode.appendChild(item);
        messagesNode.scrollTop = messagesNode.scrollHeight;
      }

      function getProfile() {
        return {
          name: document.getElementById("name").value.trim(),
          goal: document.getElementById("goal").value.trim(),
          dietaryPreferences: document.getElementById("diet").value.trim(),
          injuriesOrLimitations: document.getElementById("limitations").value.trim(),
        };
      }

      async function sendMessage() {
        const message = messageInput.value.trim();

        if (!message) {
          return;
        }

        appendMessage("user", message);
        history.push({ role: "user", content: message });
        messageInput.value = "";
        setStatus("Thinking...");

        try {
          const response = await fetch("/ai/coach-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              history: history.slice(0, -1),
              profile: getProfile(),
            }),
          });
          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.details || payload.error || "Request failed");
          }

          appendMessage("assistant", payload.reply);
          history.push({ role: "assistant", content: payload.reply });
          setStatus("Ready");
        } catch (error) {
          const messageText = error instanceof Error ? error.message : String(error);
          appendMessage("assistant", "Error: " + messageText);
          history.push({ role: "assistant", content: "Error: " + messageText });
          setStatus("Failed");
        }
      }

      sendButton.addEventListener("click", () => {
        sendMessage();
      });

      messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendMessage();
        }
      });

      clearChatButton.addEventListener("click", () => {
        history.length = 0;
        messagesNode.innerHTML = "";
        appendMessage("assistant", "I’m your LoadLog Coach. Ask a training, recovery, or nutrition question.");
        setStatus("Ready");
      });

      document.querySelectorAll("[data-prompt]").forEach((button) => {
        button.addEventListener("click", () => {
          messageInput.value = button.getAttribute("data-prompt");
          messageInput.focus();
        });
      });
    </script>
  </body>
</html>`;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.get('/coach', (_req, res) => {
  res.type('html').send(coachHtml);
});
app.get('/graphql', (_req, res) => {
  res.type('html').send(graphiqlHtml);
});
app.post('/graphql', createHandler({ schema, rootValue }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

app.use(apiHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

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

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, {
    environment: config.nodeEnv,
    coachEndpoint: `http://localhost:${config.port}/coach`,
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

export default app;
