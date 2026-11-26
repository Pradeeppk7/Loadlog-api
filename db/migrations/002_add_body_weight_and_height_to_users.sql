-- Adds optional body weight and height to users, collected at registration.
-- Run this against the Supabase project (SQL editor or supabase db push).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS body_weight_kg NUMERIC(5, 1)
  CHECK (body_weight_kg IS NULL OR (body_weight_kg >= 20 AND body_weight_kg <= 400)),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5, 1)
  CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 300));

COMMENT ON COLUMN users.body_weight_kg IS 'Body weight in kilograms; used to personalise calorie estimates.';
COMMENT ON COLUMN users.height_cm IS 'Height in centimetres.';
