CREATE TABLE IF NOT EXISTS applications (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_user_updated_idx
  ON applications (user_id, updated_at DESC);
