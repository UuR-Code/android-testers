/**
 * Turkish string normalization & fuzzy similarity matcher
 * Supports ~70% character similarity with Turkish character handling
 */

export function normalizeTurkish(text: string): string {
  if (!text) return "";
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Standard Levenshtein Distance
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const track = Array(n + 1)
    .fill(null)
    .map(() => Array(m + 1).fill(null));

  for (let i = 0; i <= m; i++) track[0][i] = i;
  for (let j = 0; j <= n; j++) track[j][0] = j;

  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return track[n][m];
}

/**
 * Calculates similarity ratio between 0.0 and 1.0 (0% to 100%)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTurkish(str1);
  const s2 = normalizeTurkish(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Substring / containment check
  if (s1.includes(s2) || s2.includes(s1)) {
    const subRatio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    if (subRatio >= 0.65) return Math.max(0.75, subRatio);
  }

  const dist = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0.0, 1.0 - dist / maxLen);
}

/**
 * Checks if provided answer matches expected answer with >= 70% accuracy
 */
export function isFuzzyMatch(expected: string, provided: string, threshold = 0.70): {
  matched: boolean;
  score: number;
} {
  const score = calculateSimilarity(expected, provided);
  return {
    matched: score >= threshold,
    score: Math.round(score * 100),
  };
}
