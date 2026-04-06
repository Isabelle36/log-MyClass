# LogMyClass

Smart attendance platform for colleges using QR sessions, geofence verification, and role-based dashboards.

## Overview

LogMyClass is a full-stack Next.js application designed for college attendance workflows.

It supports three roles:
- Admin: Manage teachers, students, attendance logs, and invites
- Teacher: Create attendance sessions, share QR links, view live attendance, invite/upload students
- Student: Join through invite flow and mark attendance by scanning session QR

The app uses Clerk for authentication and Prisma + PostgreSQL for data persistence.

## Key Features

- Invite-only onboarding for Teachers and Students
- Role-based access control (Admin, Teacher, Student)
- QR-based attendance session creation
- Location-aware attendance marking using geofence checks
- Session expiry and duplicate attendance protection
- Teacher dashboard with recent and live attendance data
- Admin dashboard for full user and attendance governance
- CSV/XLSX student upload and invite generation
- Attendance warning emails via SMTP

## Tech Stack

- Framework: Next.js 16 (App Router) + React 19 + TypeScript
- Auth: Clerk
- Database: PostgreSQL (Neon) + Prisma ORM
- UI: Tailwind CSS, Radix UI, custom component library
- Utilities: Nodemailer, XLSX, Recharts, Sonner

## Project Structure

- app
	- api: role-based route handlers
	- admin: admin dashboard and management pages
	- teacher: teacher portal and attendance controls
	- student: student dashboard and invite flow
	- scan: QR scan attendance clients
- lib
	- auth helpers, user sync, curriculum helpers, prisma client
- prisma
	- schema and migrations
- components
	- shared UI components

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL database (local or hosted)
- Clerk account and keys

## Local Setup

1. Install dependencies

	 npm install

2. Create your environment file

	 Copy .env.example values from the section below into a local .env file.

3. Generate Prisma client

	 npx prisma generate

4. Run database migrations

	 npx prisma migrate deploy

	 For local development with a fresh database, you can also use:

	 npx prisma migrate dev

5. Start development server

	 npm run dev

6. Open app

	 http://localhost:3000

## Scripts

- npm run dev: start local dev server
- npm run dev:lan: start dev server on 0.0.0.0:3000 for LAN testing
- npm run build: generate Prisma client and create production build
- npm run start: run production server
- npm run lint: run ESLint

## Environment Variables

Use these keys in your .env file.

Database
- DATABASE_URL
- DIRECT_URL

Clerk
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY

Admin setup (optional, if used in your setup flow)
- ADMIN_SETUP_KEY_HASH
- SETUP_RATE_LIMIT_ENABLED
- SETUP_RATE_LIMIT_MAX_ATTEMPTS
- SETUP_RATE_LIMIT_WINDOW_MS

SMTP (attendance warning emails)
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM

Geofence tuning (optional)
- CAMPUS_LATITUDE
- CAMPUS_LONGITUDE
- GEOFENCE_RADIUS_METERS
- GEOFENCE_GRACE_METERS
- MIN_EFFECTIVE_SESSION_GEOFENCE_METERS
- MAX_ACCURACY_GRACE_METERS
- DEFAULT_SESSION_GEOFENCE_METERS

Important security note:
If secrets were ever committed, rotate all exposed credentials immediately (database, Clerk, SMTP).

## Attendance Flow Summary

Teacher flow
1. Teacher creates a session with subject, class/year, duration, and radius.
2. App stores session geofence center from teacher location.
3. Teacher shares QR/scan URL with students.

Student flow
1. Student scans QR or opens scan URL.
2. Student location is sent with optional GPS accuracy.
3. API validates:
	 - session exists and is active
	 - student belongs to matching class/year
	 - geofence distance check passes
	 - attendance does not already exist for that session
4. Attendance record is created.

## Role and Access Notes

- Route protection is handled by Clerk middleware plus server-side role checks.
- Role metadata is synchronized into Prisma user records.
- Invite links are used for controlled onboarding.

## Deployment Notes

- Ensure production environment variables are configured.
- Run prisma generate during build (already included in npm run build).
- Use SSL-enabled database URL for production.
- Configure Clerk allowed domains and redirect URLs.

## Troubleshooting

- Build fails on Prisma client:
	Run npx prisma generate and verify DATABASE_URL.

- Attendance location errors despite same classroom:
	Increase session radius and review geofence grace settings.

- Invite sign-up not working:
	Verify invite token validity, email match, and Clerk redirect config.

- SMTP emails not sending:
	Check SMTP credentials, provider restrictions, and from address.

## License

This project is currently private/internal. Add a formal license if you plan to open-source it.
