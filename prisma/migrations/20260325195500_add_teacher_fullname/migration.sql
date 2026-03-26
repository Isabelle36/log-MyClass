ALTER TABLE "Teacher"
ADD COLUMN "fullName" TEXT;

UPDATE "Teacher"
SET "fullName" = COALESCE(NULLIF(split_part("email", '@', 1), ''), 'Teacher');

ALTER TABLE "Teacher"
ALTER COLUMN "fullName" SET NOT NULL;
