import { compareTwoStrings } from 'string-similarity';

const CONFIDENCE_THRESHOLD = 0.4;

export function isConfidentMatch(gameTitle: string, igdbTitle: string): boolean {
  const score = compareTwoStrings(gameTitle.toLowerCase(), igdbTitle.toLowerCase());
  return score >= CONFIDENCE_THRESHOLD;
}
