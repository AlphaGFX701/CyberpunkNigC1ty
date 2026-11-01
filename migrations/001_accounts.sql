BEGIN;
-- techcare:statement
CREATE TABLE IF NOT EXISTS techcare_players (
  user_id text PRIMARY KEY,
  name varchar(32) NOT NULL CHECK (length(trim(name)) > 0),
  case_data jsonb NOT NULL DEFAULT '{"version":1,"completed":[],"currentArea":"base"}'::jsonb,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  generation bigint NOT NULL DEFAULT 0 CHECK (generation >= 0),
  initialized boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- techcare:statement
-- App data is available only to the server connection role, never public Data API users.
REVOKE ALL ON techcare_players FROM PUBLIC;
-- techcare:statement
ALTER TABLE techcare_players ENABLE ROW LEVEL SECURITY;
-- techcare:statement
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN
    REVOKE ALL ON techcare_players FROM anonymous;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON techcare_players FROM authenticated;
  END IF;
END $$;
-- techcare:statement
COMMIT;
