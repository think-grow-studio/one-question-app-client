/**
 * Date 객체를 'YYYY-MM-DD' 형식의 로컬 날짜 문자열로 변환
 */
export function formatLocalDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
