-- The runner renews heartbeat_at every minute while a scrape runs. Checked in the catalog first so later deploys take
-- no lock on jobstreet_scrape_runs; the semicolons inside the DO block start their lines for migrate.ts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'jobstreet_scrape_runs'::regclass AND attname = 'heartbeat_at' AND NOT attisdropped
  ) THEN
    ALTER TABLE jobstreet_scrape_runs ADD COLUMN heartbeat_at timestamptz
    ; END IF
  ; END
$$;
