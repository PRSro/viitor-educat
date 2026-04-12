import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const tracks = await prisma.track.findMany({ orderBy: { order: 'asc' } });
    tracks.forEach(t => console.log(`${t.name} → ${t.url || 'oscillator'}`));
}
main().finally(() => prisma.$disconnect());
