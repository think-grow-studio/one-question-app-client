# ADR 0003: Expo Router 디렉토리에는 화면만 둔다

- Status: Accepted
- Date: 2026-09-15
- ADR-0002의 의존 방향은 유지하며 앱 조립 코드의 물리 경로만 보정한다.

## 근거

리팩토링 QA에서 설치된 Expo Router의 `getRoutes`에 실제 `src/app` 파일 목록을 전달한 결과,
`bootstrap`·`integrations`의 훅 네 개가 화면 경로로 등록됐다. 개발 모드에서는 default export
누락 경고로 걸러질 수 있지만 프로덕션에서는 잘못된 화면으로 남는다.

## 결정

`src/app`에는 화면과 레이아웃만 둔다. 앱 시작 훅과 feature 간 workflow는 각각
`src/application/bootstrap`, `src/application/integrations`로 이동한다. `application`은
새 도메인 계층이 아니라 기존 앱 조립 책임의 비화면 코드다. 화면 URL은 변경하지 않는다.
테스트도 `src/app` 밖에 둔다. 하위 계층의 `application` 역참조는 기존 app 경계와 동일하게 금지한다.

## 검증

`src/application/__tests__/routes.test.js`는 실제 라우트 수집기를 실행해 비화면 경로가
등록되지 않는지 검사한다. Metro iOS·Android export로 이동한 모듈의 번들링도 검증한다.
