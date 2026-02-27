import { prisma } from '../models/prisma.js';
import { redisService } from '../core/services/redisService.js';

const CACHE_TTL = 300;

function cacheKey(teacherId: string, suffix: string): string {
  return `analytics:${teacherId}:${suffix}`;
}

export async function getLessonCompletionRates(teacherId: string, page: number = 1, limit: number = 20) {
  const cacheKeyValue = cacheKey(teacherId, `lessons:${page}:${limit}`);
  const cached = await redisService.get<any>(cacheKeyValue);
  if (cached) return cached;

  const skip = (page - 1) * limit;

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        courseId: true,
        course: { select: { title: true } },
        _count: {
          select: {
            completions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    }),
    prisma.lesson.count({ where: { teacherId } })
  ]);

  const courseIds = [...new Set(lessons.filter(l => l.courseId).map(l => l.courseId!))];
  const enrollmentsByCourse = await prisma.enrollment.groupBy({
    by: ['courseId'],
    where: { courseId: { in: courseIds } },
    _count: { id: true }
  });

  const enrollmentsMap = new Map(enrollmentsByCourse.map(e => [e.courseId, e._count.id]));

  const result = {
    lessons: lessons.map(l => ({
      lessonId: l.id,
      title: l.title,
      courseTitle: l.course?.title || 'Standalone',
      completions: l._count.completions,
      enrolledStudents: l.courseId ? (enrollmentsMap.get(l.courseId) || 0) : 0
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  await redisService.set(cacheKeyValue, result, CACHE_TTL);
  return result;
}

export async function getLessonDropoff(teacherId: string, lessonId: string) {
  const cacheKeyValue = cacheKey(teacherId, `dropoff:${lessonId}`);
  const cached = await redisService.get<any>(cacheKeyValue);
  if (cached) return cached;

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, teacherId },
    select: { id: true, title: true }
  });

  if (!lesson) {
    throw new Error('Lesson not found or access denied');
  }

  const lessonCompletions = await prisma.lessonCompletion.findMany({
    where: { lessonId },
    select: {
      completedAt: true,
      student: {
        select: {
          enrollments: {
            where: { course: { teacherId } },
            select: { progress: true, completedAt: true }
          }
        }
      }
    }
  });

  const enrollmentCount = lessonCompletions.length;
  const completedCount = lessonCompletions.filter(lc => lc.completedAt !== null).length;

  const enrollments = await prisma.enrollment.findMany({
    where: { 
      course: { teacherId, lessons: { some: { id: lessonId } } } 
    },
    select: { progress: true }
  });

  const distribution = [
    { range: '0-25%', count: 0 },
    { range: '26-50%', count: 0 },
    { range: '51-75%', count: 0 },
    { range: '76-99%', count: 0 },
    { range: '100%', count: completedCount }
  ];

  enrollments.forEach(e => {
    const p = e.progress;
    if (p <= 25) distribution[0].count++;
    else if (p <= 50) distribution[1].count++;
    else if (p <= 75) distribution[2].count++;
    else if (p < 100) distribution[3].count++;
  });

  const result = {
    lessonId: lesson.id,
    title: lesson.title,
    totalStudents: enrollmentCount,
    completedCount,
    completionRate: enrollmentCount > 0 ? Math.round((completedCount / enrollmentCount) * 100) : 0,
    distribution
  };

  await redisService.set(cacheKeyValue, result, CACHE_TTL);
  return result;
}

export async function getWeeklyActiveStudents(teacherId: string, weeks: number = 8) {
  const cacheKeyValue = cacheKey(teacherId, `active:${weeks}`);
  const cached = await redisService.get<any>(cacheKeyValue);
  if (cached) return cached;

  const weekData = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const uniqueStudents = await prisma.lessonCompletion.groupBy({
      by: ['studentId'],
      where: {
        completedAt: { gte: weekStart, lt: weekEnd },
        lesson: { teacherId }
      }
    });

    weekData.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      activeStudents: uniqueStudents.length
    });
  }

  const result = { weeklyActive: weekData };
  await redisService.set(cacheKeyValue, result, CACHE_TTL);
  return result;
}

export async function getQuizPerformance(teacherId: string, page: number = 1, limit: number = 20) {
  const cacheKeyValue = cacheKey(teacherId, `quizzes:${page}:${limit}`);
  const cached = await redisService.get<any>(cacheKeyValue);
  if (cached) return cached;

  const skip = (page - 1) * limit;

  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        courseId: true,
        course: { select: { title: true } },
        _count: { select: { attempts: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip
    }),
    prisma.quiz.count({ where: { teacherId } })
  ]);

  const quizIds = quizzes.map(q => q.id);

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: { in: quizIds } },
    select: { quizId: true, score: true, maxScore: true }
  });

  const attemptsByQuiz = new Map<string, { totalScore: number; count: number }>();
  attempts.forEach(a => {
    const existing = attemptsByQuiz.get(a.quizId) || { totalScore: 0, count: 0 };
    existing.totalScore += a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
    existing.count++;
    attemptsByQuiz.set(a.quizId, existing);
  });

  const result = {
    quizzes: quizzes.map(q => {
      const stats = attemptsByQuiz.get(q.id) || { totalScore: 0, count: 0 };
      return {
        quizId: q.id,
        title: q.title,
        courseTitle: q.course?.title || 'Standalone',
        totalAttempts: q._count.attempts,
        averageScore: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
        hasAttempts: stats.count > 0
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };

  await redisService.set(cacheKeyValue, result, CACHE_TTL);
  return result;
}

export async function invalidateTeacherCache(teacherId: string) {
  const pattern = `analytics:${teacherId}:*`;
  const keys = await redisService.keys(pattern);
  await Promise.all(keys.map(key => redisService.del(key)));
}
