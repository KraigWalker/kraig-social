import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './home.tsx';

describe('Home route', () => {
  it('presents the next-generation delivery lab entry points', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: /site that behaves like a release system/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open delivery lab/i })).toHaveAttribute(
      'href',
      '/lab'
    );
    expect(screen.getByRole('link', { name: /manage content drops/i })).toHaveAttribute(
      'href',
      '/admin/content'
    );
    expect(screen.getByText(/AES-GCM timed key/i)).toBeInTheDocument();
  });
});
