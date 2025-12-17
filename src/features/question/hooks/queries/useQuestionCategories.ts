import { useQuery } from '@tanstack/react-query';
import { fetchQuestionCategories } from '../../api/questionApi';

export const questionQueryKeys = {
  categories: ['question', 'categories'] as const,
};

export function useQuestionCategories() {
  return useQuery({
    queryKey: questionQueryKeys.categories,
    queryFn: fetchQuestionCategories,
    staleTime: 1000 * 60,
  });
}
