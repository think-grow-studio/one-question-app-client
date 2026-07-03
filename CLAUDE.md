# CLAUDE.md

**작업 전 [README.md](./README.md)를 먼저 읽어라** — 아키텍처·컨벤션의 진실원이다.
구조적 결정의 배경은 `docs/decisions/`, 폴더별 함정은 해당 폴더의 `CLAUDE.md`에 있다.

## 절대 규칙

- 의존 방향: `app → features → shared → services`. shared는 features를 임포트하지 않는다 (유일 예외: AppErrorBoundary → BannerAdSlot).
- `app/`은 화면 조립만 — 비즈니스 로직·직접 API 호출 금지, `features/`의 훅 사용.
- 서버 데이터는 TanStack Query만, Zustand는 클라이언트 상태만. HTTP는 `services/apiClient` 경유 (`fetch` 금지).
- 훅은 `hooks/queries/`·`hooks/mutations/`로 분리, API 함수는 `api/<feature>Api.ts`에. Barrel export 안 씀.
- 애니메이션은 Reanimated만. 사용자 노출 문자열은 i18next만 (하드코딩 금지). `any` 금지.
- UI 변경은 iOS/Android 양쪽 + 다크/라이트 모드 확인 전에 완료 선언 금지.

## 작업 규칙

1. **되돌리기 어려운 결정만 질문하라**: API 계약 변경, 네비게이션 구조 변경, 기존 기능 삭제, 요구사항 해석이 갈리는 경우. 그 외에는 기존 컨벤션을 따라 그대로 진행한다.
2. **문서 동기화**: 코드 변경으로 README.md·폴더 CLAUDE.md 내용이 사실이 아니게 되면 같은 커밋에서 문서도 갱신한다. 문서-코드 불일치를 발견하면 사용자에게 보고한다.
