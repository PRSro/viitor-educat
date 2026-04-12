import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const paths = [
    {
      title: 'Web Security Fundamentals',
      description: 'Master the OWASP Top 10 vulnerabilities.',
      category: 'Web Security',
      lessonIds: ['web-1', 'web-2', 'web-3', 'web-4', 'web-5', 'web-6', 'web-7', 'web-8']
    },
    {
      title: 'Network Defense',
      description: 'Understanding and securing network layers.',
      category: 'Networking',
      lessonIds: ['net-1', 'net-2', 'net-3', 'net-4']
    },
    {
      title: 'Ethical Hacking Intro',
      description: 'Fundamentals of footprinting and threat assessment.',
      category: 'Fundamentals',
      lessonIds: ['fund-1', 'fund-2', 'fund-3', 'crypt-1', 'crypt-2', 'crypt-3', 'os-1', 'os-2']
    }
  ];

  for (const p of paths) {
    const existing = await prisma.learningPath.findFirst({ where: { title: p.title } });
    if (!existing) {
      await prisma.learningPath.create({ data: p });
      console.log(`Seeded path: ${p.title}`);
    } else {
      console.log(`Skipped existing path: ${p.title}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
