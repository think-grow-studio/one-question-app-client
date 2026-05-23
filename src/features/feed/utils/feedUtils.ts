export function formatFeedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

const SERVICE_TIMEZONE = 'Asia/Seoul';

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
