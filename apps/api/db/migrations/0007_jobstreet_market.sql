-- The job-ad market (#271): the skills, tools and languages each JobStreet listing's text mentions, matched in
-- Postgres against the vocabulary in apps/api/src/market/skills.ts. text_md5 is the hash of the text that was
-- matched, so a listing is matched again only when its text or the vocabulary changes. Rows go with their listing.
-- The runner's database role gets no access to this table; its startup check refuses any it could use.
CREATE TABLE IF NOT EXISTS jobstreet_listing_skills (
  job_id text NOT NULL,
  career_slug text NOT NULL,
  skills text[] NOT NULL,
  text_md5 text NOT NULL CHECK (text_md5 ~ '^[0-9a-f]{32}$'),
  vocabulary_version text NOT NULL,
  matched_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, career_slug),
  FOREIGN KEY (job_id, career_slug) REFERENCES jobstreet_listings(job_id, career_slug) ON DELETE CASCADE
);
