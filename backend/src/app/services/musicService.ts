import { prisma } from '../models/prisma.js';

const SOLFEGGIO_FREQUENCIES = [
  { frequencyHz: 174, name: 'Foundation', benefit: 'Removes pain and strengthens the feeling of security.', duration: 3600, order: 1 },
  { frequencyHz: 285, name: 'Healing', benefit: 'Heals tissues and organs; resets them to original perfect state.', duration: 3600, order: 2 },
  { frequencyHz: 396, name: 'Liberation', benefit: 'Liberates guilt and fear; transforms grief into joy.', duration: 3600, order: 3 },
  { frequencyHz: 417, name: 'Transformation', benefit: 'Facilitates change and undoing difficult situations.', duration: 3600, order: 4 },
  { frequencyHz: 528, name: 'Miracle', benefit: 'Repairs DNA and brings miracles; known as the love frequency.', duration: 3600, order: 5 },
  { frequencyHz: 639, name: 'Harmony', benefit: 'Brings harmony to relationships and facilitates connection.', duration: 3600, order: 6 },
  { frequencyHz: 741, name: 'Awakening', benefit: 'Awakens intuition and expression; solves problems.', duration: 3600, order: 7 },
  { frequencyHz: 852, name: 'Spiritual Order', benefit: 'Restores spiritual order and removes negative energy.', duration: 3600, order: 8 },
  { frequencyHz: 963, name: 'Divine Consciousness', benefit: 'Connects to divine energy; highest spiritual frequency.', duration: 3600, order: 9 },
];

const VALID_FREQUENCIES = SOLFEGGIO_FREQUENCIES.map(f => f.frequencyHz);

export async function seedTracks(): Promise<void> {
  for (const track of SOLFEGGIO_FREQUENCIES) {
    await prisma.track.upsert({
      where: { frequencyHz: track.frequencyHz },
      update: {
        name: track.name,
        benefit: track.benefit,
        duration: track.duration,
        order: track.order,
      },
      create: {
        name: track.name,
        frequencyHz: track.frequencyHz,
        benefit: track.benefit,
        duration: track.duration,
        order: track.order,
      },
    });
  }
}

export async function getAllTracks() {
  return prisma.track.findMany({
    orderBy: { frequencyHz: 'asc' },
  });
}

export async function getTrackById(id: string) {
  return prisma.track.findUnique({
    where: { id },
  });
}

export async function getTrackByFrequency(frequencyHz: number) {
  return prisma.track.findUnique({
    where: { frequencyHz },
  });
}

export async function getUserPreference(userId: string) {
  return prisma.userMusicPreference.findUnique({
    where: { userId },
    include: { track: true },
  });
}

export async function upsertUserPreference(userId: string, trackId: string | null, volume: number) {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  
  if (trackId) {
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      throw new Error('Invalid trackId: track not found');
    }
    if (!VALID_FREQUENCIES.includes(track.frequencyHz)) {
      throw new Error('Invalid track frequency');
    }
  }

  return prisma.userMusicPreference.upsert({
    where: { userId },
    update: {
      trackId,
      volume: clampedVolume,
    },
    create: {
      userId,
      trackId,
      volume: clampedVolume,
    },
    include: { track: true },
  });
}

export function isValidFrequency(frequencyHz: number): boolean {
  return VALID_FREQUENCIES.includes(frequencyHz);
}
