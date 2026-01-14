import { Letter } from '../types/api';

/**
 * Filter letters by date range
 */
export function filterLettersByDateRange(
  letters: Letter[],
  startDate: string | null,
  endDate: string | null
): Letter[] {
  if (!startDate && !endDate) {
    return letters;
  }

  return letters.filter((letter) => {
    const letterDate = letter.date.replace(/\./g, '-'); // '2024.12.20' → '2024-12-20'

    if (startDate && letterDate < startDate) {
      return false;
    }

    if (endDate && letterDate > endDate) {
      return false;
    }

    return true;
  });
}

/**
 * Filter letters by category
 */
export function filterLettersByCategory(
  letters: Letter[],
  category: string | null
): Letter[] {
  if (!category) {
    return letters;
  }

  return letters.filter((letter) => letter.category === category);
}

/**
 * Get unique categories from letters
 */
export function getUniqueCategories(letters: Letter[]): string[] {
  const categories = new Set(letters.map((letter) => letter.category));
  return Array.from(categories).sort();
}

/**
 * Group letters by question
 */
export function groupLettersByQuestion(letters: Letter[]): Record<string, Letter[]> {
  return letters.reduce(
    (acc, letter) => {
      if (!acc[letter.question]) {
        acc[letter.question] = [];
      }
      acc[letter.question].push(letter);
      return acc;
    },
    {} as Record<string, Letter[]>
  );
}

/**
 * Group letters by category
 */
export function groupLettersByCategory(letters: Letter[]): Record<string, Letter[]> {
  return letters.reduce(
    (acc, letter) => {
      if (!acc[letter.category]) {
        acc[letter.category] = [];
      }
      acc[letter.category].push(letter);
      return acc;
    },
    {} as Record<string, Letter[]>
  );
}

/**
 * Sort letters by date (newest first)
 */
export function sortLettersByDate(letters: Letter[]): Letter[] {
  return [...letters].sort((a, b) => {
    const dateA = new Date(a.date.replace(/\./g, '-'));
    const dateB = new Date(b.date.replace(/\./g, '-'));
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Convert date format from YYYY.MM.DD to YYYY-MM-DD
 */
export function convertDateFormat(dateStr: string): string {
  return dateStr.replace(/\./g, '-');
}

/**
 * Convert date format from YYYY-MM-DD to YYYY.MM.DD
 */
export function convertDateFormatBack(dateStr: string): string {
  return dateStr.replace(/-/g, '.');
}
