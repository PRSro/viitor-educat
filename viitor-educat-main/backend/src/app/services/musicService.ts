import { prisma } from '../models/prisma.js';

const SOLFEGGIO_FREQUENCIES = [
  {
    frequencyHz: 432,
    name: 'Frutiger Aero — 432Hz',
    benefit: 'Natural tuning, aquatic serenity and nature-tech harmony.',
    duration: 3600, order: 0,
    url: 'CfhddcGwsWY', // Meditative Mind — 432Hz Nature
  },
  {
    frequencyHz: 174,
    name: 'Foundation — 174Hz',
    benefit: 'Removes pain and strengthens security.',
    duration: 3600, order: 1,
    url: 'FkJfGEkVUhE', // PowerThoughts — 174Hz
  },
  {
    frequencyHz: 285,
    name: 'Healing — 285Hz',
    benefit: 'Heals tissues and organs, restores original state.',
    duration: 3600, order: 2,
    url: 'q1eBkrxSJeQ', // Meditative Mind — 285Hz
  },
  {
    frequencyHz: 396,
    name: 'Liberation — 396Hz',
    benefit: 'Liberates guilt and fear, transforms grief into joy.',
    duration: 3600, order: 3,
    url: 'pEGT80dDR60', // Solfeggio Tones — 396Hz
  },
  {
    frequencyHz: 417,
    name: 'Transformation — 417Hz',
    benefit: 'Facilitates change, undoes difficult situations.',
    duration: 3600, order: 4,
    url: 'dBNMnWJBIF8', // Meditative Mind — 417Hz
  },
  {
    frequencyHz: 528,
    name: 'Miracle — 528Hz',
    benefit: 'DNA repair, the love frequency.',
    duration: 3600, order: 5,
    url: 'FEnxTz-KWNY', // PowerThoughts — 528Hz
  },
  {
    frequencyHz: 639,
    name: 'Harmony — 639Hz',
    benefit: 'Harmonises relationships, facilitates connection.',
    duration: 3600, order: 6,
    url: 'A4Tcoa_BHZY', // Meditative Mind — 639Hz
  },
  {
    frequencyHz: 741,
    name: 'Awakening — 741Hz',
    benefit: 'Awakens intuition, solves problems.',
    duration: 3600, order: 7,
    url: 'Tc5c-BWKGPQ', // Solfeggio Tones — 741Hz
  },
  {
    frequencyHz: 852,
    name: 'Spiritual Order — 852Hz',
    benefit: 'Restores spiritual order, removes negative energy.',
    duration: 3600, order: 8,
    url: '7NCsRfpbBEI', // Meditative Mind — 852Hz
  },
  {
    frequencyHz: 963,
    name: 'Divine Consciousness — 963Hz',
    benefit: 'Connects to divine energy, highest spiritual frequency.',
    duration: 3600, order: 9,
    url: 'L8IkuQIGiUY', // PowerThoughts — 963Hz
  },
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
        url: track.url || null,
      },
      create: {
        name: track.name,
        frequencyHz: track.frequencyHz,
        benefit: track.benefit,
        duration: track.duration,
        order: track.order,
        url: track.url || null,
      },
    });
  }
}

export async function getAllTracks() {
  return prisma.track.findMany({
    orderBy: { order: 'asc' },
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
