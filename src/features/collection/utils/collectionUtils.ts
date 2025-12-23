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
