import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisApi } from '../../api/analysisApi';
import { analysisKeys } from '../queries/useAnalysisQueries';
import type {
  AnalysisDetailDto,
  AnalysisFeedback,
  CreateAnalysisRequest,
} from '../../types/api';

/** 분석 요청 — 성공 시 가용성/히스토리 무효화(진행 상태 반영) */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: CreateAnalysisRequest) => analysisApi.createAnalysis(req),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: analysisKeys.availability() });
      void queryClient.invalidateQueries({ queryKey: analysisKeys.history() });
    },
  });
}

/** 결과 평가 — 상세 캐시 낙관적 업데이트 */
export function useSubmitFeedback(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedback: AnalysisFeedback) =>
      analysisApi.submitFeedback(id, feedback),
    onMutate: async (feedback) => {
      const key = analysisKeys.detail(id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AnalysisDetailDto>(key);
      if (previous) {
        queryClient.setQueryData<AnalysisDetailDto>(key, { ...previous, feedback });
      }
      return { previous };
    },
    onError: (_err, _feedback, context) => {
      if (context?.previous) {
        queryClient.setQueryData(analysisKeys.detail(id), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: analysisKeys.detail(id) });
    },
  });
}
