import { CATEGORIES } from '../constants/categories';
import { QuestionCategory } from '../types/category';

export async function fetchQuestionCategories(): Promise<QuestionCategory[]> {
  // Placeholder implementation until backend integration
  return Promise.resolve([...CATEGORIES]);
}
