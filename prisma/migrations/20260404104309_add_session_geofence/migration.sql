-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "geofenceLatitude" DOUBLE PRECISION,
ADD COLUMN     "geofenceLongitude" DOUBLE PRECISION,
ADD COLUMN     "geofenceRadiusMeters" INTEGER NOT NULL DEFAULT 10;
