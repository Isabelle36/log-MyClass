ALTER TABLE "Teacher"
ALTER COLUMN "fullName" TYPE VARCHAR(80);

UPDATE "Teacher"
SET "fullName" = 'Teacher'
WHERE "fullName" IS NULL
   OR btrim("fullName") = ''
   OR char_length("fullName") < 2
   OR char_length("fullName") > 80
   OR "fullName" !~ '^[A-Za-z]+(?:[ ''-][A-Za-z]+)*$';

ALTER TABLE "Teacher"
ADD CONSTRAINT "Teacher_fullName_format_check"
CHECK ("fullName" ~ '^[A-Za-z]+(?:[ ''-][A-Za-z]+)*$');

ALTER TABLE "Teacher"
ADD CONSTRAINT "Teacher_fullName_length_check"
CHECK (char_length("fullName") BETWEEN 2 AND 80);
