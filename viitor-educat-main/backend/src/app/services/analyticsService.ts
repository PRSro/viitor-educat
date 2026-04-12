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

  const result = {
    lessons: lessons.map(l => ({
      lessonId: l.id,
      title: l.title,
      completions: l._count.completions
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
    existing.totalScore += (a.maxScore ?? 0) > 0 ? ((a.score ?? 0) / (a.maxScore ?? 1)) * 100 : 0;
    existing.count++;
    attemptsByQuiz.set(a.quizId, existing);
  });

  const result = {
    quizzes: quizzes.map(q => {
      const stats = attemptsByQuiz.get(q.id) || { totalScore: 0, count: 0 };
      return {
        quizId: q.id,
        title: q.title,
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
  if (keys.length > 0) {
    await Promise.all(keys.map(key => redisService.del(key)));
  }
}
