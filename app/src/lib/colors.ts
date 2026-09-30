/**
 * Shared muted dark-academia color palette for all analysis sections.
 * Replaces bright crayon colors with desaturated jewel tones.
 * Includes dynamic golden-angle generation for arbitrary numbers of communities.
 */

const BASE_SCHOOL_COLORS: Record<number, string> = {
  0: '#4A5A8C', // slate blue
  1: '#5B8C7B', // sage
  2: '#6E8C5B', // olive
  3: '#8C5B7B', // dusty plum
  4: '#B07A4A', // burnt sienna
  5: '#4A6E8C', // denim
  6: '#B89A4A', // antique gold
  7: '#4A8C8C', // muted teal
  8: '#6E5B8C', // muted aubergine
};

/**
 * Returns a dark-academia jewel-tone color for any community ID.
 * Uses base palette for 0..8, and golden-angle distribution (137.5°) for dynamic communities.
 */
export function getCommunityColor(communityId: number | string, _totalCommunities = 9): string {
  const id = Number(communityId);
  if (!isNaN(id) && id in BASE_SCHOOL_COLORS) {
    return BASE_SCHOOL_COLORS[id];
  }
  const num = isNaN(id) ? 0 : id;
  const hue = Math.round((num * 137.5) % 360);
  return `hsl(${hue}, 48%, 52%)`;
}

/** Proxy object so SCHOOL_COLORS[id] works seamlessly for any community ID */
export const SCHOOL_COLORS: Record<number, string> = new Proxy(BASE_SCHOOL_COLORS, {
  get(target, prop) {
    const num = Number(prop);
    if (!isNaN(num) && num in target) {
      return (target as any)[num];
    }
    if (!isNaN(num)) {
      return getCommunityColor(num);
    }
    return (target as any)[prop];
  },
});

/** Full school names indexed by community id (default Connectomics) */
export const SCHOOL_NAMES: Record<number, string> = {
  0: 'Foundations & Graph Theory',
  1: 'Resting-State fMRI & Default Mode',
  2: 'Structural Connectivity & dMRI',
  3: 'Dynamic FC & Brain States',
  4: 'Clinical Applications',
  5: 'Hubs, Rich-Club & Gradients',
  6: 'Precision Mapping & Individual Differences',
  7: 'Methods, Tools & Parcellations',
  8: 'Recent Advances (arXiv)',
};

/** Short abbreviations for compact UI */
export const SCHOOL_SHORT = [
  'Foundations', 'fMRI/DMN', 'Structural', 'Dynamic FC', 'Clinical',
  'Hubs', 'Precision', 'Methods', 'arXiv',
];

