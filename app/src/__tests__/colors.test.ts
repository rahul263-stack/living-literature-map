import { describe, it, expect } from 'vitest';
import { getCommunityColor, SCHOOL_COLORS, SCHOOL_NAMES, SCHOOL_SHORT } from '../lib/colors';

describe('colors utility', () => {
  it('returns predefined jewel tones for base community IDs 0 through 8', () => {
    expect(getCommunityColor(0)).toBe('#4A5A8C');
    expect(getCommunityColor(1)).toBe('#5B8C7B');
    expect(getCommunityColor(6)).toBe('#B89A4A');
    expect(getCommunityColor(8)).toBe('#6E5B8C');
  });

  it('generates dynamic golden-angle HSL colors for community IDs > 8', () => {
    const col9 = getCommunityColor(9);
    expect(col9).toMatch(/^hsl\(\d+,\s*48%,\s*52%\)$/);
    const col15 = getCommunityColor(15);
    expect(col15).toMatch(/^hsl\(\d+,\s*48%,\s*52%\)$/);
  });

  it('handles string community IDs gracefully', () => {
    expect(getCommunityColor('0')).toBe('#4A5A8C');
    expect(getCommunityColor('4')).toBe('#B07A4A');
    expect(getCommunityColor('custom-id')).toMatch(/^hsl\(\d+,\s*48%,\s*52%\)$/);
  });

  it('allows access via SCHOOL_COLORS proxy', () => {
    expect(SCHOOL_COLORS[0]).toBe('#4A5A8C');
    expect(SCHOOL_COLORS[2]).toBe('#6E8C5B');
    expect(SCHOOL_COLORS[12]).toMatch(/^hsl\(\d+,\s*48%,\s*52%\)$/);
  });

  it('provides comprehensive school names and abbreviations', () => {
    expect(SCHOOL_NAMES[0]).toBe('Foundations & Graph Theory');
    expect(SCHOOL_NAMES[5]).toBe('Hubs, Rich-Club & Gradients');
    expect(SCHOOL_SHORT).toHaveLength(9);
    expect(SCHOOL_SHORT[0]).toBe('Foundations');
  });
});
