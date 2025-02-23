/*
  Warnings:

  - Changed the type of `blockchain` on the `Wallet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "blockchain",
ADD COLUMN     "blockchain" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Blockchain";
