export const graphiqlHtml = `<!DOCTYPE html>
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
      .auth-panel {
        display: grid;
        gap: 10px;
        padding: 16px;
        background: rgba(9, 14, 25, 0.72);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
        backdrop-filter: blur(10px);
      }
      .auth-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: end;
      }
      .auth-panel label {
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #b3c2db;
      }
      .auth-panel input {
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 12px;
        padding: 12px 14px;
        background: rgba(15, 23, 42, 0.9);
        color: #f8fafc;
        font: 14px/1.4 Consolas, "Courier New", monospace;
        outline: none;
      }
      .auth-panel p {
        margin: 0;
        font-size: 12px;
        color: #b3c2db;
      }
      .auth-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        background: rgba(15, 23, 42, 0.9);
        color: #e5eefc;
        white-space: nowrap;
      }
      .auth-status-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #f87171;
        box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.16);
      }
      .auth-status.authenticated .auth-status-dot {
        background: #4ade80;
        box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.16);
      }
      .auth-hint {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }
      .auth-hint code {
        color: #f8fafc;
      }
      .auth-example {
        margin: 0;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.72);
        color: #cbd5e1;
        font-size: 12px;
        line-height: 1.5;
        white-space: pre-wrap;
      }
      .auth-example code {
        color: #f8fafc;
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
      .examples p {
        margin: 0 0 12px;
        color: #b3c2db;
        font-size: 12px;
      }
      .examples button {
        margin-right: 10px;
        margin-bottom: 10px;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .auth-row {
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
        <p>Use this page to send GraphQL queries to <code>POST /graphql</code>. Authenticated examples below work best after you paste a bearer token.</p>
      </div>
      <section class="auth-panel">
        <div class="auth-row">
          <div>
            <label for="authToken">Authorization Header</label>
            <input id="authToken" type="text" placeholder="Bearer eyJ..." />
          </div>
          <div id="authStatus" class="auth-status" aria-live="polite">
            <span class="auth-status-dot"></span>
            <span id="authStatusText">No token attached</span>
          </div>
        </div>
        <div class="auth-hint">
          <p>Get a token from <code>POST /auth/login</code> or <code>POST /auth/register</code>, then paste <code>Bearer &lt;token&gt;</code> here.</p>
        </div>
        <pre class="auth-example">Example
1. Login response token:
   <code>{ "token": "eyJhbGciOi..." }</code>
2. Paste here:
   <code>Bearer eyJhbGciOi...</code>
3. Run:
   <code>query {
  me {
    id
    name
    email
  }
}</code></pre>
      </section>
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
        <p>Examples marked with <code>(Auth)</code> need a bearer token in the Authorization Header box.</p>
        <button type="button" data-query="query {&#10;  me {&#10;    id&#10;    name&#10;    email&#10;    coachProfile {&#10;      goal&#10;      experienceLevel&#10;    }&#10;  }&#10;}">Me (Auth)</button>
        <button type="button" data-query="query {&#10;  users {&#10;    id&#10;    name&#10;    email&#10;    coachProfile {&#10;      goal&#10;      experienceLevel&#10;    }&#10;  }&#10;}">List Users</button>
        <button type="button" data-query="query {&#10;  user(userId: &quot;user-id-here&quot;) {&#10;    id&#10;    name&#10;    email&#10;    age&#10;    coachProfile {&#10;      goal&#10;      dietaryPreferences&#10;      injuriesOrLimitations&#10;      experienceLevel&#10;    }&#10;  }&#10;}">Get User</button>
        <button type="button" data-query="query {&#10;  myWorkoutPlans(page: 1, pageSize: 5) {&#10;    items {&#10;      id&#10;      name&#10;      description&#10;      exercises {&#10;        exerciseName&#10;        sets {&#10;          setNumber&#10;          targetReps&#10;          targetWeight&#10;        }&#10;      }&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">My Plans (Auth)</button>
        <button type="button" data-query="query {&#10;  workoutPlans {&#10;    items {&#10;      id&#10;      name&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">List Plans</button>
        <button type="button" data-query="query {&#10;  workoutPlans(nameContains: &quot;Push&quot;, userId: &quot;user-id-here&quot;, page: 1, pageSize: 5) {&#10;    items {&#10;      id&#10;      userId&#10;      name&#10;      description&#10;      exercises {&#10;        exerciseName&#10;        order&#10;      }&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">Filter Plans</button>
        <button type="button" data-query="query {&#10;  workoutPlan(planId: &quot;plan-id-here&quot;) {&#10;    id&#10;    name&#10;    description&#10;    createdAt&#10;    updatedAt&#10;    exercises {&#10;      id&#10;      exerciseName&#10;      order&#10;      sets {&#10;        setNumber&#10;        targetReps&#10;        targetWeight&#10;      }&#10;    }&#10;  }&#10;}">Get Plan By ID</button>
        <button type="button" data-query="query {&#10;  myWorkoutSessions(page: 1, pageSize: 5) {&#10;    items {&#10;      id&#10;      planId&#10;      performedAt&#10;      notes&#10;      exercises {&#10;        exerciseName&#10;      }&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">My Sessions (Auth)</button>
        <button type="button" data-query="query {&#10;  workoutSessions {&#10;    items {&#10;      id&#10;      planId&#10;      performedAt&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">List Sessions</button>
        <button type="button" data-query="query {&#10;  workoutSessions(planId: &quot;plan-id-here&quot;, userId: &quot;user-id-here&quot;, page: 1, pageSize: 5) {&#10;    items {&#10;      id&#10;      userId&#10;      planId&#10;      performedAt&#10;      notes&#10;    }&#10;    pagination {&#10;      page&#10;      pageSize&#10;      totalItems&#10;      totalPages&#10;    }&#10;  }&#10;}">Filter Sessions</button>
        <button type="button" data-query="query {&#10;  workoutSession(sessionId: &quot;session-id-here&quot;) {&#10;    id&#10;    planId&#10;    performedAt&#10;    notes&#10;    exercises {&#10;      exerciseName&#10;      sets {&#10;        setNumber&#10;        actualReps&#10;        actualWeight&#10;      }&#10;    }&#10;  }&#10;}">Get Session By ID</button>
        <button type="button" data-query="query {&#10;  myExerciseHistory(exerciseName: &quot;Bench Press&quot;) {&#10;    exerciseName&#10;    history {&#10;      performedAt&#10;      sets {&#10;        setNumber&#10;        actualReps&#10;        actualWeight&#10;      }&#10;    }&#10;  }&#10;}">My Exercise History (Auth)</button>
        <button type="button" data-query="query {&#10;  exerciseHistory(exerciseName: &quot;Bench Press&quot;) {&#10;    exerciseName&#10;    history {&#10;      performedAt&#10;    }&#10;  }&#10;}">Exercise History</button>
        <button type="button" data-query="mutation {&#10;  createUser(input: {&#10;    name: &quot;Pradeep&quot;&#10;    email: &quot;pradeep@example.com&quot;&#10;    age: 24&#10;    coachProfile: {&#10;      goal: &quot;Build muscle&quot;&#10;      dietaryPreferences: &quot;High protein&quot;&#10;      injuriesOrLimitations: &quot;None&quot;&#10;      experienceLevel: &quot;intermediate&quot;&#10;    }&#10;  }) {&#10;    id&#10;    name&#10;    email&#10;  }&#10;}">Create User</button>
        <button type="button" data-query="mutation {&#10;  createWorkoutPlan( input: {&#10;    name: &quot;Push Day A&quot;&#10;    description: &quot;Chest, shoulders, triceps&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Bench Press&quot;&#10;        order: 1&#10;        sets: [&#10;          { setNumber: 1, targetReps: 8, targetWeight: 80 }&#10;          { setNumber: 2, targetReps: 8, targetWeight: 80 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    userId&#10;    name&#10;    createdAt&#10;  }&#10;}">Create Plan (Auth)</button>
        <button type="button" data-query="mutation {&#10;  updateWorkoutPlan( planId: &quot;plan-id-here&quot;, input: {&#10;    name: &quot;Push Day A Updated&quot;&#10;    description: &quot;Updated plan details&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Incline Bench Press&quot;&#10;        order: 1&#10;        sets: [&#10;          { setNumber: 1, targetReps: 10, targetWeight: 60 }&#10;          { setNumber: 2, targetReps: 8, targetWeight: 65 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    userId&#10;    name&#10;    updatedAt&#10;  }&#10;}">Update Plan (Auth)</button>
        <button type="button" data-query="mutation {&#10;  deleteWorkoutPlan(planId: &quot;plan-id-here&quot;) {&#10;    success&#10;  }&#10;}">Delete Plan (Auth)</button>
        <button type="button" data-query="mutation {&#10;  createWorkoutSession(input: {&#10;    planId: &quot;plan-id-here&quot;&#10;    performedAt: &quot;2026-04-27T18:30:00.000Z&quot;&#10;    notes: &quot;Solid session&quot;&#10;    exercises: [&#10;      {&#10;        exerciseName: &quot;Bench Press&quot;&#10;        sets: [&#10;          { setNumber: 1, actualReps: 8, actualWeight: 80 }&#10;          { setNumber: 2, actualReps: 7, actualWeight: 80 }&#10;        ]&#10;      }&#10;    ]&#10;  }) {&#10;    id&#10;    userId&#10;    planId&#10;    performedAt&#10;  }&#10;}">Create Session (Auth)</button>
        <button type="button" data-query="mutation {&#10;  coachChat(input: {&#10;    message: &quot;Give me a workout and nutrition suggestion for this week.&quot;&#10;    history: [&#10;      { role: &quot;user&quot;, content: &quot;I trained push yesterday.&quot; }&#10;      { role: &quot;assistant&quot;, content: &quot;Focus on pull or legs today for recovery balance.&quot; }&#10;    ]&#10;    profile: {&#10;      goal: &quot;Build muscle&quot;&#10;      dietaryPreferences: &quot;High protein&quot;&#10;      injuriesOrLimitations: &quot;None&quot;&#10;      experienceLevel: &quot;intermediate&quot;&#10;    }&#10;  }) {&#10;    reply&#10;    model&#10;  }&#10;}">Coach Chat</button>
      </div>
    </div>
    <script>
      const queryEditor = document.getElementById("queryEditor");
      const resultViewer = document.getElementById("resultViewer");
      const runButton = document.getElementById("run");
      const clearButton = document.getElementById("clear");
      const authTokenInput = document.getElementById("authToken");
      const authStatus = document.getElementById("authStatus");
      const authStatusText = document.getElementById("authStatusText");
      const AUTH_STORAGE_KEY = "loadlog-graphql-token";
      const AUTH_REQUIRED_PATTERN = /\\b(me|myWorkoutPlans|myWorkoutSessions|myExerciseHistory)\\b|\\b(createWorkoutPlan|updateWorkoutPlan|deleteWorkoutPlan|createWorkoutSession)\\b/;

      function hasBearerToken(value) {
        return /^Bearer\\s+\\S+$/i.test(value.trim());
      }

      function updateAuthStatus() {
        const authToken = authTokenInput.value.trim();
        const authenticated = hasBearerToken(authToken);
        authStatus.classList.toggle("authenticated", authenticated);
        authStatusText.textContent = authenticated
          ? "Bearer token attached"
          : authToken
            ? "Token format should be: Bearer <token>"
            : "No token attached";
      }

      const storedToken = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedToken) {
        authTokenInput.value = storedToken;
      }
      updateAuthStatus();

      authTokenInput.addEventListener("input", () => {
        localStorage.setItem(AUTH_STORAGE_KEY, authTokenInput.value.trim());
        updateAuthStatus();
      });

      async function runQuery() {
        const authToken = authTokenInput.value.trim();
        if (AUTH_REQUIRED_PATTERN.test(queryEditor.value) && !hasBearerToken(authToken)) {
          resultViewer.textContent = JSON.stringify(
            {
              errors: [
                {
                  message: "This query needs authentication. Paste Bearer <token> in the Authorization Header box first.",
                  extensions: { code: "UNAUTHENTICATED" }
                }
              ]
            },
            null,
            2
          );
          authTokenInput.focus();
          return;
        }

        resultViewer.textContent = "Loading...";
        const headers = { "Content-Type": "application/json" };
        if (authToken) {
          headers["Authorization"] = authToken;
        }
        const response = await fetch("/graphql", {
          method: "POST",
          headers,
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
