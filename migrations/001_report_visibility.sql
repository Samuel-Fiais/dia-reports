-- Run once against the Neon database (dia_reports / public schema).
BEGIN;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private';

ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_visibility_check;

ALTER TABLE reports
  ADD CONSTRAINT reports_visibility_check
  CHECK (visibility IN ('public', 'private'));

UPDATE reports
SET visibility = 'public'
WHERE slug LIKE 'the-foreword-%';

COMMIT;
