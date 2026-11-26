-- Adds an optional calories burned figure to each workout session.
-- Run this against the Supabase project (SQL editor or supabase db push).
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS calories_burned INTEGER
  CHECK (calories_burned IS NULL OR calories_burned >= 0);

COMMENT ON COLUMN workout_sessions.calories_burned IS 'Estimated calories burned during the session (kcal), entered by the user.';
