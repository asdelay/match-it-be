-- DropForeignKey
ALTER TABLE "public"."ResetToken" DROP CONSTRAINT "ResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TokenData" DROP CONSTRAINT "TokenData_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "TokenData" ADD CONSTRAINT "TokenData_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetToken" ADD CONSTRAINT "ResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
