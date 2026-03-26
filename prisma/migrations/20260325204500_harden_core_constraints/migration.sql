-- Enforce format/range constraints for core entities to prevent arbitrary values.

-- StudentInvite constraints
ALTER TABLE "StudentInvite"
ADD CONSTRAINT "StudentInvite_fullName_length_check"
CHECK (char_length("fullName") BETWEEN 2 AND 80);

ALTER TABLE "StudentInvite"
ADD CONSTRAINT "StudentInvite_department_check"
CHECK ("department" IN ('BCA', 'BBA', 'B.Tech'));

ALTER TABLE "StudentInvite"
ADD CONSTRAINT "StudentInvite_year_check"
CHECK ("year" BETWEEN 1 AND 3);

ALTER TABLE "StudentInvite"
ADD CONSTRAINT "StudentInvite_rollNo_check"
CHECK ("rollNo" BETWEEN 1 AND 9999);

-- TeacherInvite constraints
ALTER TABLE "TeacherInvite"
ADD CONSTRAINT "TeacherInvite_department_check"
CHECK ("department" IN ('BCA', 'BBA', 'B.Tech'));

-- Student constraints
ALTER TABLE "Student"
ADD CONSTRAINT "Student_fullName_length_check"
CHECK (char_length("fullName") BETWEEN 2 AND 80);

ALTER TABLE "Student"
ADD CONSTRAINT "Student_department_check"
CHECK ("department" IN ('BCA', 'BBA', 'B.Tech'));

ALTER TABLE "Student"
ADD CONSTRAINT "Student_year_check"
CHECK ("year" BETWEEN 1 AND 3);

ALTER TABLE "Student"
ADD CONSTRAINT "Student_rollNo_check"
CHECK ("rollNo" BETWEEN 1 AND 9999);

ALTER TABLE "Student"
ADD CONSTRAINT "Student_academicYear_not_empty_check"
CHECK (btrim("academicYear") <> '');

-- Teacher constraints
ALTER TABLE "Teacher"
ADD CONSTRAINT "Teacher_department_check"
CHECK ("department" IN ('BCA', 'BBA', 'B.Tech'));

-- Attendance constraints
ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_latitude_check"
CHECK ("latitude" BETWEEN -90 AND 90);

ALTER TABLE "Attendance"
ADD CONSTRAINT "Attendance_longitude_check"
CHECK ("longitude" BETWEEN -180 AND 180);

-- Session constraints
ALTER TABLE "Session"
ADD CONSTRAINT "Session_department_check"
CHECK ("department" IN ('BCA', 'BBA', 'B.Tech'));

ALTER TABLE "Session"
ADD CONSTRAINT "Session_year_check"
CHECK ("year" BETWEEN 1 AND 3);

ALTER TABLE "Session"
ADD CONSTRAINT "Session_subject_not_empty_check"
CHECK (btrim("subject") <> '');

-- SuspiciousLog constraints
ALTER TABLE "SuspiciousLog"
ADD CONSTRAINT "SuspiciousLog_reason_not_empty_check"
CHECK (btrim("reason") <> '');
