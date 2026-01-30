-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "reviewedAt" TIMESTAMP(3);
