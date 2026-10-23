-- Admin-managed search titles, per-listing review and the check-up's market titles.
-- Every deploy runs every migration (migrate.ts), so each statement must be safe to repeat and must not undo an
-- admin's changes. Columns are added inside a DO block that checks the catalog first, so later deploys take no lock
-- on jobstreet_careers. migrate.ts splits statements at semicolons that end a line, so the semicolons inside the DO
-- block start their lines.
--
-- A search title appears in the check-up when it is not hidden and has at least one listing approved under its
-- current O*NET occupation; that rule lives in the queries, so no stored flag can drift from the approvals.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'jobstreet_careers'::regclass AND attname = 'onet_code' AND NOT attisdropped
  ) THEN
    ALTER TABLE jobstreet_careers ADD COLUMN onet_code text CHECK (onet_code ~ '^\d{2}-\d{4}\.\d{2}$')
    ; END IF
  ; IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'jobstreet_careers'::regclass AND attname = 'hidden' AND NOT attisdropped
  ) THEN
    ALTER TABLE jobstreet_careers ADD COLUMN hidden boolean NOT NULL DEFAULT false
    ; END IF
  ; IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'jobstreet_careers'::regclass AND attname = 'daily_refresh' AND NOT attisdropped
  ) THEN
    ALTER TABLE jobstreet_careers ADD COLUMN daily_refresh boolean NOT NULL DEFAULT true
    ; ALTER TABLE jobstreet_careers ALTER COLUMN daily_refresh SET DEFAULT false
    ; END IF
  ; END
$$;

-- Review and sorting read a batch's observations by run.
CREATE INDEX IF NOT EXISTS jobstreet_observations_run_idx ON jobstreet_observations (scrape_run_id);

-- Whether a listing title, exactly as JobStreet shows it, is the search title's occupation. Stored per search title
-- so its later batches reuse the answer, and cleared when the title's occupation changes. source: the search-title
-- rule (review.ts) or Claude.
CREATE TABLE IF NOT EXISTS jobstreet_title_verdicts (
  career_slug text NOT NULL REFERENCES jobstreet_careers(slug),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
  verdict text NOT NULL CHECK (verdict IN ('match', 'other', 'unsure')),
  source text NOT NULL CHECK (source IN ('search_title', 'claude')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (career_slug, title)
);

-- The admin's latest decision for each listing under a search title, from the newest batch reviewed.
CREATE TABLE IF NOT EXISTS jobstreet_listing_reviews (
  job_id text NOT NULL,
  career_slug text NOT NULL,
  approved boolean NOT NULL,
  onet_code text NOT NULL CHECK (onet_code ~ '^\d{2}-\d{4}\.\d{2}$'),
  scrape_run_id text NOT NULL REFERENCES jobstreet_scrape_runs(id),
  reviewed_by uuid REFERENCES scraper_admin_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, career_slug),
  FOREIGN KEY (job_id, career_slug) REFERENCES jobstreet_listings(job_id, career_slug)
);

CREATE INDEX IF NOT EXISTS jobstreet_listing_reviews_approved_idx
  ON jobstreet_listing_reviews (career_slug, onet_code)
  WHERE approved;

-- A batch's own decisions, counted when it is approved and withdrawn when it is rejected.
CREATE INDEX IF NOT EXISTS jobstreet_listing_reviews_run_idx ON jobstreet_listing_reviews (scrape_run_id);

-- One review per breadth batch.
CREATE TABLE IF NOT EXISTS jobstreet_run_reviews (
  scrape_run_id text PRIMARY KEY REFERENCES jobstreet_scrape_runs(id),
  status text NOT NULL CHECK (status IN ('approved', 'rejected')),
  approved_count integer NOT NULL DEFAULT 0 CHECK (approved_count >= 0),
  excluded_count integer NOT NULL DEFAULT 0 CHECK (excluded_count >= 0),
  reviewed_by uuid REFERENCES scraper_admin_users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
