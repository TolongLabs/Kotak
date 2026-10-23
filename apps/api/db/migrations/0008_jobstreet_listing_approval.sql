-- When a listing's standing approval was made (#276), so depth runs can describe approved ads first. The runner's
-- database role reads jobstreet_listings but none of the review tables, and this column tells it only which of its
-- own listings are approved. It holds the review's reviewed_at while an approval stands under the search title's
-- current occupation, and is null otherwise. The admin route syncs it in every transaction that changes a title's
-- reviews, and the nightly cron syncs every title. Only the runner's depth order reads it; the check-up and the
-- job-ad market read the reviews.
--
-- Every deploy runs every migration (migrate.ts), so the column is added inside a DO block that checks the catalog
-- first, as in 0006, and the update below changes only rows that disagree with the reviews. migrate.ts splits
-- statements at semicolons that end a line, so the semicolons inside the DO block start their lines.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'jobstreet_listings'::regclass AND attname = 'approved_at' AND NOT attisdropped
  ) THEN
    ALTER TABLE jobstreet_listings ADD COLUMN approved_at timestamptz
    ; END IF
  ; END
$$;

-- Backfill from the approvals that stand now, and repair any drift, for example from an approval made by an API
-- version that did not set the column yet. This is SYNC_APPROVED_AT from src/scrapers/jobstreet/schedule.ts for every
-- search title: it never waits for a row lock, because SKIP LOCKED passes over listings a runner save or an admin's
-- approval holds, so it can't deadlock with them. The nightly cron syncs a listing it skipped.
WITH standing AS (
  SELECT listing.job_id, listing.career_slug, review.reviewed_at AS approved_at
  FROM jobstreet_listings listing
  JOIN jobstreet_careers career ON career.slug = listing.career_slug
  LEFT JOIN jobstreet_listing_reviews review
    ON review.job_id = listing.job_id AND review.career_slug = listing.career_slug
    AND review.approved AND review.onet_code = career.onet_code
  WHERE listing.approved_at IS DISTINCT FROM review.reviewed_at
  FOR NO KEY UPDATE OF listing SKIP LOCKED
)
UPDATE jobstreet_listings listing SET approved_at = standing.approved_at
FROM standing
WHERE listing.job_id = standing.job_id AND listing.career_slug = standing.career_slug;
