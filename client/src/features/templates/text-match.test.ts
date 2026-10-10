import { describe, expect, it } from 'vitest';
import { splitMatches } from './text-match';

describe('splitMatches (search highlight)', () => {
  it('marks every case-insensitive match and keeps the original casing', () => {
    expect(splitMatches('Dashboard for a data dashboard', 'DASH')).toEqual([
      { text: 'Dash', match: true },
      { text: 'board for a data ', match: false },
      { text: 'dash', match: true },
      { text: 'board', match: false },
    ]);
  });

  it('returns the text untouched without a query or a match', () => {
    expect(splitMatches('Pulse Analytics', '')).toEqual([
      { text: 'Pulse Analytics', match: false },
    ]);
    expect(splitMatches('Pulse Analytics', '  ')).toEqual([
      { text: 'Pulse Analytics', match: false },
    ]);
    expect(splitMatches('Pulse Analytics', 'blog')).toEqual([
      { text: 'Pulse Analytics', match: false },
    ]);
  });

  it('treats markup in the query as plain text', () => {
    expect(splitMatches('Use <b> tags', '<b>')).toEqual([
      { text: 'Use ', match: false },
      { text: '<b>', match: true },
      { text: ' tags', match: false },
    ]);
  });
});
