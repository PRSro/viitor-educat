import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    result += chars[byte % 64];
  }
  return result;
}

async function main() {
  const lessons = await prisma.lesson.findMany({ 
    where: { slug: 'temp' },
    select: { id: true, slug: true, title: true }
  });
  
  console.log(`Backfilling ${lessons.length} lessons...`);
  
  for (const lesson of lessons) {
    let slug = generateSlug();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.lesson.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug();
      attempts++;
    }
    
    await prisma.lesson.update({ 
      where: { id: lesson.id }, 
      data: { slug } 
    });
    console.log(`  ${lesson.title?.substring(0, 30) || lesson.id} → ${slug}`);
  }
  
  console.log('Done.');
  await prisma.$disconnect();
}

main().catch(console.error);
