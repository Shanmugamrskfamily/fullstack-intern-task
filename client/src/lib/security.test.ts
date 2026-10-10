import { describe, expect, it } from 'vitest';
import { cleanText, isObjectId, safeNextPath, safeUrl } from './security';

describe('safeNextPath (open-redirect guard)', () => {
  it('keeps same-site paths with their query and hash', () => {
    expect(safeNextPath('/favorites')).toBe('/favorites');
    expect(safeNextPath('/templates?q=dash&category=blog#top')).toBe(
      '/templates?q=dash&category=blog#top',
    );
  });

  it.each([
    ['protocol-relative URL', '//evil.example.com'],
    ['backslash trick', '/\\evil.example.com'],
    ['absolute URL', 'https://evil.example.com/phish'],
    ['javascript: URL', 'javascript:alert(1)'],
    ['relative path', 'favorites'],
    ['empty value', ''],
    ['missing value', null],
  ])('falls back to /templates for a %s', (_label, value) => {
    expect(safeNextPath(value)).toBe('/templates');
  });
});

describe('cleanText', () => {
  it('collapses whitespace and trims', () => {
    expect(cleanText('  Shanmugam   R  ')).toBe('Shanmugam R');
  });

  it('removes zero-width characters and clamps the length', () => {
    expect(cleanText('da​sh﻿board')).toBe('dashboard');
    expect(cleanText('a'.repeat(100), 64)).toHaveLength(64);
  });
});

describe('safeUrl', () => {
  it('allows http(s) URLs only', () => {
    expect(safeUrl('https://api.example.com/static/x.svg')).toBe(
      'https://api.example.com/static/x.svg',
    );
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('data:text/html,<script>')).toBeUndefined();
    expect(safeUrl(undefined)).toBeUndefined();
  });
});

describe('isObjectId', () => {
  it('accepts 24-character hex ids only', () => {
    expect(isObjectId('6ac995a872350e709d29007e')).toBe(true);
    expect(isObjectId('123')).toBe(false);
    expect(isObjectId('zzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
    expect(isObjectId({ $gt: '' })).toBe(false);
  });
});
