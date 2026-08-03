import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { analysisApi } from '../../api/analysisApi';
import { analysisKeys } from '../queries/useAnalysisQueries';
import type {
  AnalysisDetailDto,
  AnalysisFeedback,
  CreateAnalysisRequest,
} from '../../types/api';

type CreateVariables = CreateAnalysisRequest & { idempotencyKey: string };

/**
 * 분석 요청 — 성공 시 가용성/히스토리 무효화(진행 상태 반영).
 *
 * **멱등키는 반드시 variables에 담는다.** queryClient는 5xx/네트워크 실패 시 뮤테이션을
 * 1회 재시도하는데, TanStack은 재시도에 같은 variables를 재사용한다. 키를 mutationFn
 * 안에서 만들면 재시도마다 새 키가 발급돼 리포트가 두 건 생성된다.
 * 그래서 호출자에게 mutate를 노출하지 않고 키를 발급하는 래퍼만 내보낸다.
 */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ idempotencyKey, ...req }: CreateVariables) =>
      analysisApi.createAnalysis(req, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: analysisKeys.availability() });
      void queryClient.invalidateQueries({ queryKey: analysisKeys.history() });
    },
  });

  const { mutate } = mutation;
  const createAnalysis = useCallback(
    (req: CreateAnalysisRequest, options?: { onSuccess?: () => void }) => {
      // 사용자의 "생성" 액션 1회 = 키 1개. 새 리포트를 만들려면 새 키여야 한다.
      mutate({ ...req, idempotencyKey: Crypto.randomUUID() }, options);
    },
    [mutate]
  );

  return { createAnalysis, isPending: mutation.isPending };
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
