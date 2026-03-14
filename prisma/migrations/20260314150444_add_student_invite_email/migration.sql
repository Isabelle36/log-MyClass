/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `StudentInvite` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "StudentInvite" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvite_email_key" ON "StudentInvite"("email");
