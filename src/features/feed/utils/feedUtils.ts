export function formatFeedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const SERVICE_TIMEZONE = 'Asia/Seoul';

// 피드에서 이동 가능한 가장 이른 날짜 (서비스 timezone 기준 YYYY-MM-DD).
// 이 날짜 이전으로는 화살표/스와이프 모두 차단. 추후 정책 바뀌면 이 값만 수정.
export const MIN_FEED_DATE = '2026-05-23';

// 공개 일일 질문 API path 의 date 기준. 백엔드가 UTC 라고 명시했지만 서비스 운영 기준은 KST.
// 협의 확정 전까지 KST today 로 보내고, 확정되면 SERVICE_TIMEZONE 만 교체.
// en-CA 로케일은 YYYY-MM-DD 형식을 안정적으로 반환.
export function getServiceToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SERVICE_TIMEZONE }).format(new Date());
}

// 임의 Date 를 서비스 timezone 기준 YYYY-MM-DD 로 변환.
export function toServiceDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SERVICE_TIMEZONE }).format(date);
}

// 일자 비교 / 이동 헬퍼 — 로컬 timezone 기준. 피드 화살표/스와이프 등에서 사용.
export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// 피드 헤더의 날짜 라벨 — "2026년 5월 26일 (화)" / "May 26, 2026 (Tue)".
export function formatQuestionDate(date: Date, lang: string, weekdays: string[]): string {
  const wd = weekdays[date.getDay()] ?? '';
  if (lang.startsWith('ko')) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${wd})`;
  }
  return `${EN_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} (${wd})`;
}
