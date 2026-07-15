// Deterministic tile color + glyph per recipe, until real photos exist.

const CUISINE_GLYPHS: Record<string, string> = {
  mexican: '🌮',
  italian: '🍝',
  thai: '🍜',
  mediterranean: '🫒',
  greek: '🥙',
  american: '🥪',
  french: '🥐',
  japanese: '🍱',
  chinese: '🥡',
  indian: '🍛',
  baked: '🧁',
};

const CATEGORY_GLYPHS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
};

// Soft tints drawn from the brand palette
const TILE_TINTS = ['#E4EBD9', '#F7E8D0', '#E2EFE4', '#F3E9DC', '#E8EFDB', '#F5E3CE'];

export function recipeGlyph(cuisine: string | null, category: string): string {
  if (cuisine && CUISINE_GLYPHS[cuisine.toLowerCase()]) {
    return CUISINE_GLYPHS[cuisine.toLowerCase()];
  }
  return CATEGORY_GLYPHS[category] ?? '🍽️';
}

export function recipeTint(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return TILE_TINTS[Math.abs(hash) % TILE_TINTS.length];
}
