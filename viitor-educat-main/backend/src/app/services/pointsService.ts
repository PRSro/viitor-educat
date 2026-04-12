import { prisma } from '../models/prisma.js';

const POINT_VALUES: Record<string, number> = {
  LESSON_COMPLETE: 100,
  QUIZ_PASS: 150,
  QUIZ_FAIL: 20,
  CORRECT_ANSWER: 25,
  STREAK_3: 50,
  STREAK_7: 150,
};

export async function awardPoints(
  userId: string,
  type: string,
  metadata?: any,
  overridePoints?: number
): Promise<void> {
  const points = overridePoints ?? POINT_VALUES[type] ?? 10;
  await prisma.$transaction([
    prisma.pointEvent.create({ data: { userId, type, points, metadata } }),
    prisma.userPoints.upsert({
      where: { userId },
      update: {
        total: { increment: points },
        weekly: { increment: points },
        monthly: { increment: points },
        lastActive: new Date(),
      },
      create: {
        userId,
        total: points,
        weekly: points,
        monthly: points,
        lastActive: new Date(),
      },
    }),
  ]);
}

export async function getLeaderboard(
  scope: 'total' | 'weekly' | 'monthly' = 'total',
  limit = 25
) {
  return prisma.userPoints.findMany({
    orderBy: { [scope]: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          studentProfile: { select: { avatarUrl: true } },
          teacherProfile: { select: { pictureUrl: true } },
        },
      },
    },
  });
}

export async function getUserRank(
  userId: string,
  scope: 'total' | 'weekly' | 'monthly' = 'total'
): Promise<{ rank: number | null; points: number }> {
  const userPts = await prisma.userPoints.findUnique({ where: { userId } });
  if (!userPts) return { rank: null, points: 0 };
  const above = await prisma.userPoints.count({
    where: { [scope]: { gt: userPts[scope] } },
  });
  return { rank: above + 1, points: userPts[scope] };
}

export async function getCyberLeaderboard(limit = 25) {
  const grouped = await prisma.pointEvent.groupBy({
    by: ['userId'],
    where: { type: 'CYBERLAB_SOLVE' },
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: 'desc' } },
    take: limit,
  });

  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      email: true,
      studentProfile: { select: { avatarUrl: true } },
      teacherProfile: { select: { pictureUrl: true } },
    },
  });

  return grouped.map((g) => {
    const user = users.find((u) => u.id === g.userId);
    return {
      userId: g.userId,
      total: g._sum.points || 0,
      solveCount: g._count.id,
      user: user || { id: g.userId, email: 'unknown' },
    };
  });
}
