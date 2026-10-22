-- National view check-ups (#34). One row per finished check-up holds only the O*NET role code, the 6
-- corner levels and the date: no names, user IDs, timestamps or free text. The id is an insertion-ordered
-- identity so the summary can aggregate whole blocks of 10 rows; it never leaves the database.
-- Retention (proposed): delete real rows 12 months after created_date, and drop the table when the
-- prototype is retired.
--   DELETE FROM national_checkups WHERE NOT is_sample AND created_date < CURRENT_DATE - INTERVAL '12 months';

CREATE TABLE IF NOT EXISTS national_checkups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  onet_role_code text NOT NULL CHECK (onet_role_code ~ '^[0-9]{2}-[0-9]{4}\.[0-9]{2}$'),
  corner_levels jsonb NOT NULL CHECK (
    jsonb_typeof(corner_levels) = 'array'
    AND jsonb_array_length(corner_levels) = 6
    AND NOT jsonb_path_exists(corner_levels, '$[*] ? (@.type() != "number" || !(@ == 0 || @ == 1 || @ == 2 || @ == 3))')
  ),
  is_sample boolean NOT NULL DEFAULT false,
  created_date date NOT NULL DEFAULT CURRENT_DATE
);
