-- Add explicit attendance status to support both present/absent records.
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT');

ALTER TABLE "Attendance"
ADD COLUMN "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT';
