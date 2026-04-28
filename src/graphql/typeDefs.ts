export const typeDefs = `
  type PlanSet {
    setNumber: Int!
    targetReps: Int!
    targetWeight: Float!
  }

  type PlanExercise {
    id: ID!
    exerciseName: String!
    order: Int!
    sets: [PlanSet!]!
  }

  type WorkoutPlan {
    id: ID!
    userId: ID
    name: String!
    description: String
    exercises: [PlanExercise!]!
    createdAt: String!
    updatedAt: String!
  }

  input CreatePlanSetInput {
    setNumber: Int!
    targetReps: Int!
    targetWeight: Float!
  }

  input CreatePlanExerciseInput {
    exerciseName: String!
    order: Int!
    sets: [CreatePlanSetInput!]!
  }

  input CreateWorkoutPlanInput {
    userId: ID
    name: String!
    description: String
    exercises: [CreatePlanExerciseInput!]!
  }

  type SessionSet {
    setNumber: Int!
    actualReps: Int!
    actualWeight: Float!
  }

  type SessionExercise {
    exerciseName: String!
    sets: [SessionSet!]!
  }

  type WorkoutSession {
    id: ID!
    userId: ID
    planId: ID!
    performedAt: String!
    notes: String
    exercises: [SessionExercise!]!
  }

  input CreateSessionSetInput {
    setNumber: Int!
    actualReps: Int!
    actualWeight: Float!
  }

  input CreateSessionExerciseInput {
    exerciseName: String!
    sets: [CreateSessionSetInput!]!
  }

  input CreateWorkoutSessionInput {
    userId: ID
    planId: ID!
    performedAt: String
    notes: String
    exercises: [CreateSessionExerciseInput!]!
  }

  type CoachProfile {
    goal: String
    dietaryPreferences: String
    injuriesOrLimitations: String
    experienceLevel: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    coachProfile: CoachProfile
    createdAt: String!
    updatedAt: String!
  }

  input CoachProfileInput {
    goal: String
    dietaryPreferences: String
    injuriesOrLimitations: String
    experienceLevel: String
  }

  input CreateUserInput {
    name: String!
    email: String!
    age: Int
    coachProfile: CoachProfileInput
  }

  input UpdateUserInput {
    name: String
    email: String
    age: Int
    coachProfile: CoachProfileInput
  }

  input CoachChatMessageInput {
    role: String!
    content: String!
  }

  input CoachChatInput {
    message: String!
    userId: ID
    history: [CoachChatMessageInput!]
    profile: CoachProfileInput
  }

  type CoachChatPayload {
    reply: String!
    model: String!
  }

  type ExerciseHistorySet {
    setNumber: Int!
    actualReps: Int!
    actualWeight: Float!
  }

  type ExerciseHistoryItem {
    performedAt: String!
    sets: [ExerciseHistorySet!]!
  }

  type ExerciseHistory {
    exerciseName: String!
    history: [ExerciseHistoryItem!]!
  }

  type DeleteWorkoutPlanPayload {
    success: Boolean!
  }

  type PaginationMetadata {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
  }

  type WorkoutPlanPage {
    items: [WorkoutPlan!]!
    pagination: PaginationMetadata!
  }

  type WorkoutSessionPage {
    items: [WorkoutSession!]!
    pagination: PaginationMetadata!
  }

  type Query {
    users: [User!]!
    user(userId: ID!): User
    workoutPlans(nameContains: String, userId: ID, page: Int, pageSize: Int): WorkoutPlanPage!
    workoutPlan(planId: ID!): WorkoutPlan
    workoutSessions(planId: ID, userId: ID, page: Int, pageSize: Int): WorkoutSessionPage!
    workoutSession(sessionId: ID!): WorkoutSession
    exerciseHistory(exerciseName: String!): ExerciseHistory!
  }

  type Mutation {
    createUser(input: CreateUserInput!): User!
    updateUser(userId: ID!, input: UpdateUserInput!): User!
    createWorkoutPlan(input: CreateWorkoutPlanInput!): WorkoutPlan!
    updateWorkoutPlan(planId: ID!, input: CreateWorkoutPlanInput!): WorkoutPlan!
    deleteWorkoutPlan(planId: ID!): DeleteWorkoutPlanPayload!
    createWorkoutSession(input: CreateWorkoutSessionInput!): WorkoutSession!
    coachChat(input: CoachChatInput!): CoachChatPayload!
  }
`;
