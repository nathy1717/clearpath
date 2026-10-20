CREATE UNIQUE INDEX IF NOT EXISTS applications_id_user_idx
  ON applications (id, user_id);

CREATE TABLE IF NOT EXISTS application_documents (
  id text PRIMARY KEY,
  application_id text NOT NULL,
  user_id text NOT NULL,
  filename text NOT NULL,
  content_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
  document_role text NOT NULL CHECK (document_role IN ('opportunity_notice', 'supporting_evidence')),
  blob_url text NOT NULL,
  extracted_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT application_documents_owner_fk
    FOREIGN KEY (application_id, user_id)
    REFERENCES applications (id, user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS application_documents_owner_idx
  ON application_documents (application_id, user_id, created_at);

CREATE TABLE IF NOT EXISTS user_daily_limits (
  user_id text NOT NULL,
  action text NOT NULL,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, action, usage_date)
);
