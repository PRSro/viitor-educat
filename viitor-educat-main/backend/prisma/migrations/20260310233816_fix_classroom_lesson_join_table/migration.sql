-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT IF EXISTS "Lesson_classroomId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Lesson_classroomId_idx";

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN IF EXISTS "classroomId";

-- CreateTable
CREATE TABLE IF NOT EXISTS "ClassroomLesson" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassroomLesson_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ClassroomLesson_classroomId_idx" ON "ClassroomLesson"("classroomId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ClassroomLesson_classroomId_lessonId_key" ON "ClassroomLesson"("classroomId", "lessonId");

-- AddForeignKey
ALTER TABLE "ClassroomLesson" ADD CONSTRAINT "ClassroomLesson_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomLesson" ADD CONSTRAINT "ClassroomLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
