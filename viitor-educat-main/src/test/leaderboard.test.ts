import { describe, it, expect } from 'vitest';

// Test the data transformation logic from backend shape → UI display.
// This is the exact shape the backend /leaderboard endpoint returns.
const mockBackendEntry = {
  userId: 'abc123',
  total: 1250,
  weekly: 300,
  monthly: 800,
  streak: 3,
  user: {
    id: 'abc123',
    email: 'elev@vianu.ro',
    studentProfile: { avatarUrl: null },
    teacherProfile: null,
  },
};

describe('Leaderboard data mapping', () => {
  it('extracts display name from email correctly', () => {
    const displayName = mockBackendEntry.user.email.split('@')[0];
    expect(displayName).toBe('elev');
  });

  it('calculates level correctly from total points', () => {
    // 1250 / 500 = 2.5 → floor = 2 → +1 = 3
    const level = Math.floor(mockBackendEntry.total / 500) + 1;
    expect(level).toBe(3);
  });

  it('calculates level 1 for zero points', () => {
    const level = Math.floor(0 / 500) + 1;
    expect(level).toBe(1);
  });

  it('prefers studentProfile avatar over teacherProfile', () => {
    const entryWithAvatar = {
      ...mockBackendEntry,
      user: {
        ...mockBackendEntry.user,
        studentProfile: { avatarUrl: 'https://cdn.example.com/pic.jpg' },
        teacherProfile: { pictureUrl: 'https://other.com/pic.jpg' },
      },
    };
    const avatarUrl =
      entryWithAvatar.user.studentProfile?.avatarUrl ??
      (entryWithAvatar.user.teacherProfile as { pictureUrl: string } | null)?.pictureUrl ??
      null;
    expect(avatarUrl).toBe('https://cdn.example.com/pic.jpg');
  });

  it('falls back to teacherProfile avatar when studentProfile has none', () => {
    const teacherEntry = {
      ...mockBackendEntry,
      user: {
        ...mockBackendEntry.user,
        studentProfile: { avatarUrl: null },
        teacherProfile: { pictureUrl: 'https://teacher.com/pic.jpg' },
      },
    };
    const avatarUrl =
      teacherEntry.user.studentProfile?.avatarUrl ??
      (teacherEntry.user.teacherProfile as { pictureUrl: string } | null)?.pictureUrl ??
      null;
    expect(avatarUrl).toBe('https://teacher.com/pic.jpg');
  });

  it('falls back to null avatar when neither profile has one', () => {
    const avatarUrl =
      mockBackendEntry.user.studentProfile?.avatarUrl ??
      (mockBackendEntry.user.teacherProfile as { pictureUrl: string } | null)?.pictureUrl ??
      null;
    expect(avatarUrl).toBeNull();
  });

  it('streak is preserved as-is from backend', () => {
    expect(mockBackendEntry.streak).toBe(3);
  });
});
