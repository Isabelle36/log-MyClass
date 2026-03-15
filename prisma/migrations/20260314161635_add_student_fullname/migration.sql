-- Add as nullable first so existing rows can be backfilled.
ALTER TABLE "Student" ADD COLUMN "fullName" TEXT;

-- Backfill existing records before enforcing NOT NULL.
UPDATE "Student"
SET "fullName" = COALESCE(NULLIF("email", ''), 'Student')
WHERE "fullName" IS NULL;

ALTER TABLE "Student" ALTER COLUMN "fullName" SET NOT NULL;
