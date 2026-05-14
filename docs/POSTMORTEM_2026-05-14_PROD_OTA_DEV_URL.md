# Postmortem — Production OTA가 dev API URL로 발행된 사건

**일시**: 2026-05-14
**영향**: Play Store production 앱(`v1.0.5`)이 `https://dev.one-question.org`로 API 호출
**감지**: 백엔드 로그에서 production traffic이 dev 환경으로 유입되는 것 발견
**해결**: `package.json` OTA 스크립트의 환경변수 전달 방식 수정 + `app.config.js`의 API URL fallback 제거 + 수정본 재발행

---

## 1. 증상

- Play Store에서 설치한 production 빌드(v1.0.5)가 dev backend로 요청
- OTA를 한 번 발행했으나 여전히 dev URL
- 화면 깜빡(= `Updates.reloadAsync()` 실행) 후에도 dev URL 유지

## 2. Root Cause — Shell 환경변수 전파 실패

`package.json`의 OTA 발행 스크립트:

```bash
APP_ENV=production NODE_ENV=production npx expo export ... && eas update ...
```

Shell의 `VAR=value cmd1 && cmd2` 문법은 **`cmd1`에만** `VAR`를 적용한다.
`&&` 뒤의 `cmd2`(=`eas update`)는 `APP_ENV` 없이 실행됨.

| 단계 | `process.env.APP_ENV` | `app.config.js` 평가 | 산출물 |
|---|---|---|---|
| `npx expo export` | `production` ✅ | `appEnv='production'`, `apiUrl=prod` | **JS 번들** (정상) |
| `eas update` | unset ❌ | `appEnv='preview'`, `apiUrl=dev` | **Manifest** (오염) |

`eas update`는 manifest를 만들기 위해 `app.config.js`를 **다시 평가**하는데, 이때 `APP_ENV`가 없어서 preview로 떨어졌다. 결과적으로 발행된 OTA의 manifest에 `extra.apiUrl='https://dev.one-question.org'`가 박혔다.

## 3. 왜 “번들 정상인데도” dev URL이 나오나 — Bundle ≠ Manifest

런타임에서 앱이 API URL을 읽는 경로:

```
src/services/apiClient.ts:14
  baseURL: config.apiUrl
            ↓
src/constants/config.ts:4
  Constants.expoConfig?.extra?.apiUrl
            ↓
        Manifest (EAS Update 발행 시 생성된 메타데이터)
```

- **JS 번들**(`.hbc`): `expo export` 시점에 환경변수가 inline된 문자열 — 정상
- **Manifest**: `eas update` 시점에 `app.config.js`를 다시 평가해서 생성된 별도 메타데이터 — 오염

`Constants.expoConfig.extra.*`는 **manifest에서 읽는다**. JS 번들의 string 리터럴이 아니다.
번들에 `https://one-question.org`만 박혀있어도 manifest가 dev URL이면 앱은 dev로 간다.

## 4. 기여 요인 — `app.config.js`의 fragile fallback

수정 전:
```js
apiUrl: process.env.API_URL || 'https://dev.one-question.org',
```

`app.config.js`는 env 파일 로드 *전에* 평가되는 시점이 있어서, `process.env.API_URL`이 unset이면 fallback이 박힌다.
`APP_ENV`까지 unset이면 `appEnv='preview'`로도 떨어진다.
즉 **환경변수 타이밍에 두 번 의존하는 구조**라 한 단계만 어긋나도 dev URL이 박혔다.

## 5. 진단 중 함정

- 번들 내 문자열만 grep해서 `https://one-question.org`만 나오는 걸 보고 “번들 정상”으로 잘못 결론
- → `Constants.expoConfig`가 **manifest에서 읽는다**는 걸 놓침
- → manifest와 bundle을 분리해서 보지 않은 게 시간 낭비의 원인

**Lesson**: OTA 디버깅 시 bundle string과 manifest는 **별개**로 검증해야 한다.

## 6. 수정 내용

### 6-1. `package.json` — 환경변수 전파

```diff
- "update-android-production": "APP_ENV=production NODE_ENV=production npx expo export ... && eas update ..."
+ "update-android-production": "export APP_ENV=production NODE_ENV=production && npx expo export ... && eas update ..."
```

`export`로 현재 shell에 등록 → `&&` 체인의 모든 명령에 전파.
iOS 스크립트도 동일 변경.

### 6-2. `app.config.js` — env 의존성 제거

```diff
+ const API_URLS = {
+   production: 'https://one-question.org',
+   preview: 'https://dev.one-question.org',
+ };

  extra: {
-   apiUrl: process.env.API_URL || 'https://dev.one-question.org',
+   apiUrl: API_URLS[appEnv],
    ...
  }
```

`process.env.API_URL`에 의존하지 않고 `appEnv`만으로 결정.
`appEnv`는 여전히 `process.env.APP_ENV`에 의존하지만, 이건 6-1로 보장됨.

## 7. 재발 방지 체크리스트

OTA 발행 전 다음을 확인:

1. **로그 검증** — `npm run update-*-production` 실행 시 `[app.config.js] appEnv=production` 로그가 **두 번** 찍히는지 (`expo export` 단계 + `eas update` 단계). 둘 다 production이어야 정상.

2. **로컬 manifest 검증**:
   ```bash
   APP_ENV=production NODE_ENV=production npx expo config --type public | grep -E "apiUrl|environment"
   # → apiUrl: 'https://one-question.org', environment: 'production' 확인
   ```

3. **`app.config.js`에 env fallback 도입 금지** — 환경별 분기는 `appEnv` 같은 결정론적 변수로만. `process.env.X || fallback` 패턴은 OTA에서 안전하지 않다.

4. **OTA 발행 후 디바이스 검증** — Cold restart 2회 후 백엔드 로그에서 새 요청이 prod URL로 가는지 확인.

## 타임라인 요약

1. `app.config.js` v1.0.5로 production 빌드 → 스토어 배포
2. OTA 발행 시도 → 첫 OTA에서 dev URL로 manifest 발행됨
3. 디바이스에서 dev URL 트래픽 감지
4. `app.config.js` env fallback 제거 + `package.json`에 `APP_ENV` 추가 시도
5. 여전히 dev URL → root cause는 `&&` 체인의 환경변수 전파 누락이라 판단
6. `export` 방식으로 전환 + 재발행 → 해결
