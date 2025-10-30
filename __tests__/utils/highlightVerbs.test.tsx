import { describe, it, expect } from '@jest/globals';
import { highlightVerbs } from '../../utils/highlightVerbs';

describe('highlightVerbs', () => {
  it('should highlight a known verb at the start of the string', () => {
    const text = 'сделать тестовую задачу';
    const expected = '<span class="verb-green">сделать</span> тестовую задачу';
    expect(highlightVerbs(text)).toBe(expected);
  });

  it('should be case-insensitive', () => {
    const text = 'СДЕЛАТЬ тестовую задачу';
    const expected = '<span class="verb-green">СДЕЛАТЬ</span> тестовую задачу';
    expect(highlightVerbs(text)).toBe(expected);
  });

  it('should not highlight a verb in the middle of the string', () => {
    const text = 'Я хочу сделать тестовую задачу';
    const expected = 'Я хочу сделать тестовую задачу';
    expect(highlightVerbs(text)).toBe(expected);
  });

  it('should return the original text if no verb is found at the beginning', () => {
    const text = 'Тестовая задача без глагола';
    const expected = 'Тестовая задача без глагола';
    expect(highlightVerbs(text)).toBe(expected);
  });

  it('should handle leading whitespace correctly', () => {
    const text = '  позвонить маме';
    const expected = '  <span class="verb-orange">позвонить</span> маме';
    expect(highlightVerbs(text)).toBe(expected);
  });
});
