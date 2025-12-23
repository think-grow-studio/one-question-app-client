/**
 * Letter Archive API Types
 * Mock data structure for user's answers and questions
 */

export interface Letter {
  id: string;
  date: string; // Format: YYYY.MM.DD
  question: string;
  category: string;
  answer: string;
}

export interface LettersResponse {
  letters: Letter[];
  total: number;
}

export interface FilterOptions {
  category?: string;
  startDate?: string;
  endDate?: string;
  searchText?: string;
}
