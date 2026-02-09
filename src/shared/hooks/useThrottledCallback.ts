import { useRef, useCallback, useEffect } from 'react';

/**
 * 콜백 함수에 쓰로틀링을 적용하는 훅
 * 지정된 시간(ms) 동안 함수가 한 번만 실행되도록 제한합니다.
 *
 * @param callback - 쓰로틀링할 콜백 함수
 * @param delay - 쓰로틀 지연 시간 (밀리초, 기본값: 500ms)
 * @returns 쓰로틀링이 적용된 콜백 함수
 *
 * @example
 * const handleSubmit = useThrottledCallback(() => {
 *   submitForm();
 * }, 500);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): T {
  const isThrottledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // 최신 callback을 ref에 저장
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (isThrottledRef.current) {
        return;
      }

      isThrottledRef.current = true;
      callbackRef.current(...args);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        isThrottledRef.current = false;
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  );

  return throttledCallback as T;
}
