# Task: Show all attendance logs (including ABSENT) recent→oldest by default in admin, matching per-student view with edit icons for ABSENT

## Steps:
- [x] Step 1: Update backend `/api/admin/students/attendance/route.ts` to generate full session history for "all students" (no studentId): fetch recent sessions → unique students → synthesize ABSENT where missing.
- [x] Step 2: Minor UI polish in `AdminStudentsManager.tsx` (bulk-excuse disable for "all", text updates).
- [x] Step 3.1: Fix edit endpoint `[attendanceId]/route.ts` to handle synthetic ABSENT IDs (create record if `id` format `session:student`).
- [ ] Step 3.2: Test edits work for both real & synthetic ABSENT.

Current: Done
