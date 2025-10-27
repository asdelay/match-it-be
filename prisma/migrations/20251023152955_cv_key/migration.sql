/*
  Warnings:

  - You are about to drop the column `cvUrl` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "cvUrl",
ADD COLUMN     "cvKey" TEXT;
