-- A role has 1 to 6 corners (#74, #152), so a check-up holds that many levels, each from 0 to 3. 0001 created the
-- column check for exactly 6 levels without a name, which Postgres names national_checkups_corner_levels_check.
-- Every deploy runs every migration, so this replaces the check only while it still requires 6 levels: later runs
-- take no lock and scan nothing. migrate.ts and seed.ts split statements at semicolons that end a line, so the
-- semicolons inside the DO block start their lines.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'national_checkups'::regclass
      AND conname = 'national_checkups_corner_levels_check'
      AND pg_get_constraintdef(oid) LIKE '%jsonb_array_length(corner_levels) = 6%'
  ) THEN
    ALTER TABLE national_checkups DROP CONSTRAINT national_checkups_corner_levels_check
    ; ALTER TABLE national_checkups ADD CONSTRAINT national_checkups_corner_levels_check CHECK (
      jsonb_typeof(corner_levels) = 'array'
      AND jsonb_array_length(corner_levels) BETWEEN 1 AND 6
      AND NOT jsonb_path_exists(corner_levels, '$[*] ? (@.type() != "number" || !(@ == 0 || @ == 1 || @ == 2 || @ == 3))')
    )
    ; END IF
  ; END
$$;
