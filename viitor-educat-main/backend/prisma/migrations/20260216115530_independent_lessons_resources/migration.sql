/*
  Warnings:

  - You are about to drop the column `courseId` on the `ExternalResource` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `ExternalResource` table. All the data in the column will be lost.
  - You are about to drop the column `courseId` on the `Flashcard` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExternalResource" DROP CONSTRAINT "ExternalResource_courseId_fkey";

-- DropForeignKey
ALTER TABLE "ExternalResource" DROP CONSTRAINT "ExternalResource_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Flashcard" DROP CONSTRAINT "Flashcard_courseId_fkey";

-- DropForeignKey
ALTER TABLE "Flashcard" DROP CONSTRAINT "Flashcard_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Lesson" DROP CONSTRAINT "Lesson_courseId_fkey";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "ExternalResource" DROP COLUMN "courseId",
DROP COLUMN "lessonId";

-- AlterTable
ALTER TABLE "Flashcard" DROP COLUMN "courseId";

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'private';

-- CreateTable
CREATE TABLE "_CourseToExternalResource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ArticleToExternalResource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ExternalResourceToLesson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CourseToExternalResource_AB_unique" ON "_CourseToExternalResource"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseToExternalResource_B_index" ON "_CourseToExternalResource"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleToExternalResource_AB_unique" ON "_ArticleToExternalResource"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleToExternalResource_B_index" ON "_ArticleToExternalResource"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ExternalResourceToLesson_AB_unique" ON "_ExternalResourceToLesson"("A", "B");

-- CreateIndex
CREATE INDEX "_ExternalResourceToLesson_B_index" ON "_ExternalResourceToLesson"("B");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToExternalResource" ADD CONSTRAINT "_CourseToExternalResource_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToExternalResource" ADD CONSTRAINT "_CourseToExternalResource_B_fkey" FOREIGN KEY ("B") REFERENCES "ExternalResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToExternalResource" ADD CONSTRAINT "_ArticleToExternalResource_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArticleToExternalResource" ADD CONSTRAINT "_ArticleToExternalResource_B_fkey" FOREIGN KEY ("B") REFERENCES "ExternalResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExternalResourceToLesson" ADD CONSTRAINT "_ExternalResourceToLesson_A_fkey" FOREIGN KEY ("A") REFERENCES "ExternalResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExternalResourceToLesson" ADD CONSTRAINT "_ExternalResourceToLesson_B_fkey" FOREIGN KEY ("B") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
