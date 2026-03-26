ALTER TABLE "StudentInvite"
DROP CONSTRAINT IF EXISTS "StudentInvite_department_check";

ALTER TABLE "StudentInvite"
ADD CONSTRAINT "StudentInvite_department_check"
CHECK ("department" IN ('BCA', 'BBA'));

ALTER TABLE "TeacherInvite"
DROP CONSTRAINT IF EXISTS "TeacherInvite_department_check";

ALTER TABLE "TeacherInvite"
ADD CONSTRAINT "TeacherInvite_department_check"
CHECK ("department" IN ('BCA', 'BBA'));

ALTER TABLE "Student"
DROP CONSTRAINT IF EXISTS "Student_department_check";

ALTER TABLE "Student"
ADD CONSTRAINT "Student_department_check"
CHECK ("department" IN ('BCA', 'BBA'));

ALTER TABLE "Teacher"
DROP CONSTRAINT IF EXISTS "Teacher_department_check";

ALTER TABLE "Teacher"
ADD CONSTRAINT "Teacher_department_check"
CHECK ("department" IN ('BCA', 'BBA'));

ALTER TABLE "Session"
DROP CONSTRAINT IF EXISTS "Session_department_check";

ALTER TABLE "Session"
ADD CONSTRAINT "Session_department_check"
CHECK ("department" IN ('BCA', 'BBA'));
