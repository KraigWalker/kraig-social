import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminContent from './admin-content.tsx';

const adminResponse = {
  records: [
    {
      id: 'drops/test-drop',
      title: 'Test Drop',
      description: 'A scheduled encrypted bundle.',
      body: 'Hidden payload',
      route: '/drops/test-drop',
      releaseId: 'test-drop-local',
      variantId: 'control',
      unlockAt: new Date(Date.now() + 30_000).toISOString(),
      status: 'scheduled',
      lastmod: new Date().toISOString(),
    },
  ],
  manifest: {
    manifestVersion: 1,
    generatedAt: new Date().toISOString(),
    entries: [],
  },
};

describe('AdminContent route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input, init) => {
        const url = String(input);
        if (url.endsWith('/api/admin/content') && init?.method === 'POST') {
          return new Response(JSON.stringify({ ok: true, record: adminResponse.records[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(adminResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
  });

  it('loads admin content records and manifest preview', async () => {
    render(<AdminContent />);

    expect(await screen.findByRole('heading', { name: 'Test Drop' })).toBeInTheDocument();
    expect(screen.getByText('/drops/test-drop')).toBeInTheDocument();
    expect(screen.getByText(/"manifestVersion": 1/u)).toBeInTheDocument();
  });

  it('posts to the admin API when creating an encrypted drop', async () => {
    render(<AdminContent />);

    fireEvent.click(await screen.findByRole('button', { name: /create encrypted 30s drop/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/__gateway/api/admin/content',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
