-- Migration: Merge first_name + last_name into name on people
-- Date: 2026-02-08

-- 1) Add new name column
ALTER TABLE people ADD COLUMN name TEXT;

-- 2) Populate name from first_name + last_name
UPDATE people
SET name = TRIM(CONCAT(first_name, ' ', last_name));

-- 3) Enforce not-null after backfill
ALTER TABLE people ALTER COLUMN name SET NOT NULL;

-- 4) Drop old columns
ALTER TABLE people DROP COLUMN first_name;
ALTER TABLE people DROP COLUMN last_name;
