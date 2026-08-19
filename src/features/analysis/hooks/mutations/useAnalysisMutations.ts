import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { newIdempotencyKey } from '@/shared/utils/idempotency';
import { analysisApi } from '../../api/analysisApi';
import {
  resolveIdempotencyKey,
  type PendingCreateKey,
} from '../../model/createRequestIdentity';
import { analysisKeys } from '../queries/useAnalysisQueries';
import type { CreateAnalysisRequest } from '../../types/api';

type CreateVariables = CreateAnalysisRequest & { idempotencyKey: string };

/**
 * 분석 요청 — 성공 시 가용성/히스토리 무효화(진행 상태 반영).
 *
 * **멱등키는 variables에 담는다.** queryClient는 5xx/네트워크 실패 시 뮤테이션을 1회
 * 재시도하는데, TanStack은 재시도에 같은 variables를 재사용한다. 키를 mutationFn 안에서
 * 만들면 재시도마다 새 키가 발급돼 리포트가 두 건 생성된다.
 *
 * 여기에 더해 **수동 재시도까지 같은 키를 쓴다** — 키를 ref에 들고 성공할 때까지 유지하고,
 * payload가 바뀌면 새로 발급한다 (정책: model/createRequestIdentity).
 * 호출자가 키를 빠뜨릴 수 없도록 mutate 대신 래퍼만 노출한다.
 */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  // 아직 성공하지 않은 제출의 키. 성공하면 비워 다음 리포트가 새 키를 받게 한다.
  const pendingKeyRef = useRef<PendingCreateKey | null>(null);

  const mutation = useMutation({
    mutationFn: ({ idempotencyKey, ...req }: CreateVariables) =>
      analysisApi.createAnalysis(req, idempotencyKey),
    onSuccess: () => {
      pendingKeyRef.current = null;
      void queryClient.invalidateQueries({ queryKey: analysisKeys.availability() });
      void queryClient.invalidateQueries({ queryKey: analysisKeys.history() });
    },
  });

  const { mutate } = mutation;
  const createAnalysis = useCallback(
    (req: CreateAnalysisRequest, options?: { onSuccess?: () => void }) => {
      const resolved = resolveIdempotencyKey(
        pendingKeyRef.current,
        req,
        newIdempotencyKey
      );
      pendingKeyRef.current = resolved;
      mutate({ ...req, idempotencyKey: resolved.key }, options);
    },
    [mutate]
  );

  return { createAnalysis, isPending: mutation.isPending };
}
