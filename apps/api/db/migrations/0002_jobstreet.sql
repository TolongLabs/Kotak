CREATE TABLE IF NOT EXISTS jobstreet_careers (
  slug text PRIMARY KEY,
  title text NOT NULL,
  search_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobstreet_scrape_runs (
  id text PRIMARY KEY,
  career_slug text NOT NULL REFERENCES jobstreet_careers(slug),
  mode text NOT NULL CHECK (mode IN ('breadth', 'depth')),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'success', 'partial', 'failed')),
  source text NOT NULL CHECK (source IN ('manual', 'schedule', 'local_import')),
  scheduled_for date,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  report jsonb,
  error text
);

CREATE INDEX IF NOT EXISTS jobstreet_scrape_runs_created_at_idx
  ON jobstreet_scrape_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS jobstreet_scrape_runs_queue_idx
  ON jobstreet_scrape_runs (status, created_at)
  WHERE status = 'queued';
CREATE UNIQUE INDEX IF NOT EXISTS jobstreet_scrape_runs_one_active_per_career_idx
  ON jobstreet_scrape_runs (career_slug)
  WHERE status IN ('queued', 'running');
CREATE UNIQUE INDEX IF NOT EXISTS jobstreet_scrape_runs_daily_idx
  ON jobstreet_scrape_runs (career_slug, scheduled_for)
  WHERE source = 'schedule';

CREATE TABLE IF NOT EXISTS jobstreet_listings (
  job_id text NOT NULL,
  career_slug text NOT NULL REFERENCES jobstreet_careers(slug),
  latest_payload jsonb NOT NULL,
  latest_seen_at timestamptz NOT NULL,
  latest_detail jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, career_slug)
);

CREATE INDEX IF NOT EXISTS jobstreet_listings_career_latest_idx
  ON jobstreet_listings (career_slug, latest_seen_at DESC);

CREATE TABLE IF NOT EXISTS jobstreet_observations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id text NOT NULL,
  career_slug text NOT NULL REFERENCES jobstreet_careers(slug),
  scrape_run_id text NOT NULL REFERENCES jobstreet_scrape_runs(id),
  observed_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  UNIQUE (job_id, career_slug, scrape_run_id, observed_at),
  FOREIGN KEY (job_id, career_slug) REFERENCES jobstreet_listings(job_id, career_slug)
);

CREATE INDEX IF NOT EXISTS jobstreet_observations_career_observed_idx
  ON jobstreet_observations (career_slug, observed_at DESC);

CREATE TABLE IF NOT EXISTS jobstreet_detail_attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id text NOT NULL,
  career_slug text NOT NULL REFERENCES jobstreet_careers(slug),
  scrape_run_id text NOT NULL REFERENCES jobstreet_scrape_runs(id),
  attempted_at timestamptz NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('fetched', 'unavailable', 'failed')),
  payload jsonb NOT NULL,
  UNIQUE (job_id, career_slug, scrape_run_id, attempted_at),
  FOREIGN KEY (job_id, career_slug) REFERENCES jobstreet_listings(job_id, career_slug)
);

CREATE INDEX IF NOT EXISTS jobstreet_detail_attempts_career_idx
  ON jobstreet_detail_attempts (career_slug, attempted_at DESC);

INSERT INTO jobstreet_careers (slug, title, search_url) VALUES
  ('software-engineer', 'Software Engineer', 'https://my.jobstreet.com/software-engineer-jobs'),
  ('front-end-developer', 'Front-End Developer', 'https://my.jobstreet.com/front-end-developer-jobs'),
  ('design-systems-developer', 'Design Systems Developer', 'https://my.jobstreet.com/design-systems-developer-jobs'),
  ('accessibility-engineer', 'Accessibility Engineer', 'https://my.jobstreet.com/accessibility-engineer-jobs')
ON CONFLICT (slug) DO NOTHING;
