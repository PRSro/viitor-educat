import { prisma } from '../models/prisma.js';

const SOLFEGGIO_FREQUENCIES = [
  {
    frequencyHz: 432,
    name: 'Frutiger Aero — 432Hz',
    benefit: 'Natural tuning, aquatic serenity and nature-tech harmony.',
    duration: 3600000, order: 0,
    audioUrl: '/assets/music/safe-haven.mp3',
  },
  {
    frequencyHz: 174,
    name: 'Foundation — 174Hz',
    benefit: 'Removes pain and strengthens security.',
    duration: 3600000, order: 1,
    url: 'FkJfGEkVUhE',
  },
  {
    frequencyHz: 285,
    name: 'Healing — 285Hz',
    benefit: 'Heals tissues and organs, restores original state.',
    duration: 3600000, order: 2,
    url: 'q1eBkrxSJeQ',
  },
  {
    frequencyHz: 396,
    name: 'Liberation — 396Hz',
    benefit: 'Liberates guilt and fear, transforms grief into joy.',
    duration: 3600000, order: 3,
    url: 'pEGT80dDR60',
  },
  {
    frequencyHz: 417,
    name: 'Transformation — 417Hz',
    benefit: 'Facilitates change, undoes difficult situations.',
    duration: 3600000, order: 4,
    url: 'dBNMnWJBIF8',
  },
  {
    frequencyHz: 528,
    name: 'Miracle — 528Hz',
    benefit: 'DNA repair, the love frequency.',
    duration: 3600000, order: 5,
    url: 'FEnxTz-KWNY',
  },
  {
    frequencyHz: 639,
    name: 'Harmony — 639Hz',
    benefit: 'Harmonises relationships, facilitates connection.',
    duration: 3600000, order: 6,
    url: 'A4Tcoa_BHZY',
  },
  {
    frequencyHz: 741,
    name: 'Awakening — 741Hz',
    benefit: 'Awakens intuition, solves problems.',
    duration: 3600000, order: 7,
    url: 'Tc5c-BWKGPQ',
  },
  {
    frequencyHz: 852,
    name: 'Spiritual Order — 852Hz',
    benefit: 'Restores spiritual order, removes negative energy.',
    duration: 3600000, order: 8,
    url: '7NCsRfpbBEI',
  },
  {
    frequencyHz: 963,
    name: 'Divine Consciousness — 963Hz',
    benefit: 'Connects to divine energy, highest spiritual frequency.',
    duration: 3600000, order: 9,
    url: 'L8IkuQIGiUY',
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
        audioUrl: track.audioUrl || null,
      },
      create: {
        name: track.name,
        frequencyHz: track.frequencyHz,
        benefit: track.benefit,
        duration: track.duration,
        order: track.order,
        url: track.url || null,
        audioUrl: track.audioUrl || null,
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
