import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';

// Mock authService before importing apiClient so the module resolves cleanly
vi.mock('@/modules/core/services/authService', () => ({
  getToken: () => null,
  logout: vi.fn(),
}));

import { apiRequest, ApiError } from '@/lib/apiClient';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

describe('apiClient error handling', () => {
  it('throws ApiError with type "server" on 500', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal Server Error' }),
    });
    await expect(apiRequest('/test')).rejects.toMatchObject({
      type: 'server',
      status: 500,
    });
  });

  it('throws ApiError with type "unauthorized" on 401', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });
    await expect(apiRequest('/test')).rejects.toMatchObject({
      type: 'unauthorized',
      status: 401,
    });
  });

  it('throws ApiError with type "offline" on network failure', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(apiRequest('/test')).rejects.toMatchObject({
      type: 'offline',
    });
  });

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ tracks: [] }),
    });
    const result = await apiRequest<{ tracks: unknown[] }>('/api/music/tracks');
    expect(result).toEqual({ tracks: [] });
  });

  it('thrown error from apiRequest is an instance of ApiError', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    });
    let caught: unknown;
    try {
      await apiRequest('/test');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ApiError);
  });
});
