# AdMob 환경변수 / production 광고 미노출 디버깅 기록

> **[RESOLVED 2026-05]** 이 문서가 추적한 OTA preview 누수 / production env 미적용 이슈는
> 다음 구조 변경으로 해결됨:
> 1. `scripts/run-with-env.js` 제거. 각 npm script가 `set -a; . ./.env(.production); set +a;`로
>    명시적으로 env 파일을 source한 뒤 expo/eas를 호출.
> 2. `eas.json`의 `production.env`에서 ADMOB 14개 키 제거. 진실의 원천은 `.env.production` 하나.
> 3. `app.config.js`에 `requireEnv()` 도입 — production env 누락 시 silent fallback 대신 빌드 실패.
> 4. `app.config.js` 상단 stderr 진단 한 줄로 매 빌드마다 어떤 env가 inline됐는지 즉시 확인 가능.
>
> 이 문서는 history로 보존. 새로 비슷한 증상 만나면 먼저 빌드 로그의 `[app.config.js] appEnv=...`
> 라인부터 확인할 것.

---

## 1. 최초 증상

- iOS production 빌드(TestFlight)에서 **테스트 광고가 표시**됨
- 배너, 전면 광고 모두 "Test mode" 라벨이 붙어서 노출
- 의도: production = 실제 광고, preview = 테스트 광고

## 2. 1차 원인 (해결됨)

`src/features/admob/config/adInit.ts`의 `testDeviceIdentifiers`에 디바이스 해시가 **항상** 등록되어 있었음.

```ts
// 문제 코드
testDeviceIdentifiers: [
  'EMULATOR',
  '1AA71683D3B0DD450FF6F68CE236AC37', // debug build
  '4D58ED45A1C6473D6C2D47DFCE3327F1', // preview build
],
```

→ AdMob이 이 기기를 항상 "테스트 디바이스"로 인식 → 실제 ID로 요청해도 테스트 광고 반환.

**수정 (commit 773acc1):**
```ts
testDeviceIdentifiers: isAdMobProduction
  ? ['EMULATOR']
  : ['EMULATOR', '1AA71683...', '4D58ED45...'],
```

## 3. 2차 원인 (조사 중)

`testDeviceIdentifiers` 수정 후에도 테스트 광고가 계속 노출됨. 진단을 위해 앱 시작 시 Alert으로 inline된 값을 표시하는 코드 추가.

```ts
// src/features/admob/config/adInit.ts
setTimeout(() => {
  Alert.alert('AdMob diag',
    `isAdMobProduction: ${isAdMobProduction}\n` +
    `APP_ENV: ${process.env.EXPO_PUBLIC_APP_ENV}\n` +
    `banner: ${admobUnitIds.banner}\n` +
    `rewarded: ${admobUnitIds.rewarded}\n` +
    `interstitial: ${admobUnitIds.interstitialSwipe}`);
}, 2000);
```

**관측 결과:**
- `isAdMobProduction: false`
- `APP_ENV: preview` ← production이어야 하는데 preview

즉 production 채널에 publish한 OTA 번들에 **preview 환경변수가 인라인**되어 있음.

## 4. 시도한 해결 노력 (순서대로)

### 4.1 react-native-dotenv 도입 → 롤백

- `import { APP_ENV } from '@env'` 방식 시도
- `babel.config.js`의 `api.cache.invalidate(...)` 사용으로 빌드 깨짐
- 앱 크래시 (SplashQuoteScreen에서 `TypeError: undefined is not a function`)
- **롤백**: react-native-dotenv 의존성 제거, `api.cache(true)` 복원

### 4.2 process.env.EXPO_PUBLIC_* 방식으로 전환

```ts
const isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
```

- `.env`, `.env.production`에 `EXPO_PUBLIC_APP_ENV=...` 추가
- Babel 플러그인 의존성 0 (Expo 공식 권장 방식)
- 크래시는 해결됐지만 여전히 preview 값이 인라인됨

### 4.3 eas.json profile.env 블록에 모든 EXPO_PUBLIC_* 박음

```json
"production": {
  "env": {
    "APP_ENV": "production",
    "NODE_ENV": "production",
    "EXPO_PUBLIC_APP_ENV": "production",
    "EXPO_PUBLIC_ADMOB_IOS_BANNER_ID": "...",
    ...
  }
}
```

- 로컬 빌드(`eas build --local`)에서 적용 의도
- 결과: 빌드된 `.ipa`의 `Info.plist` `GADApplicationIdentifier`는 실제 production App ID로 박혀있음 → app.config.js는 production env를 본 것이 맞음
- 그러나 OTA 번들에선 여전히 preview 값

### 4.4 eas update 스크립트 수정 — `--environment` 플래그

```json
"update-ios-production": "eas update --environment production --branch production --platform ios --message"
```

- `--environment production`은 **EAS 서버 측 환경변수**를 참조함
- 우리는 EAS 서버에 env를 푸시하지 않음 (`eas env:list --environment production` → No variables)
- 결과: 서버 env 없으니 fallback으로 `.env`(preview 값) 로드 → 여전히 preview

### 4.5 eas update 스크립트 수정 — 셸 prefix 방식

```json
"update-ios-production": "NODE_ENV=production APP_ENV=production EXPO_PUBLIC_APP_ENV=production eas update --branch production --platform ios --message"
```

- `EXPO_PUBLIC_APP_ENV=production`을 셸에서 직접 박음 → 어떤 .env가 로드되든 무관
- 결과: **여전히 preview** (현재 미스터리)

### 4.6 .env 파일 임시 비활성화

`.env` → `.env.backup`으로 rename. `.env.production`만 남김.

- 결과: **여전히 preview** (현재 미스터리)
- → `.env`가 직접적인 원인이 아님

## 5. 핵심 미스터리 (현재 상황)

- 셸에 `EXPO_PUBLIC_APP_ENV=production` 박혀있음
- `.env` 파일 비활성화됨
- `.env.production`에만 production 값 있음
- 그런데도 OTA 번들에 `EXPO_PUBLIC_APP_ENV=preview`가 인라인됨

**preview 값이 어디서 들어오는지 불명**.

가능 가설:
1. Metro 캐시 (잘못된 이전 번들이 publish됨)
2. EAS 서버 내부에 preview environment가 자동 적용되는 로직
3. Expo CLI의 `@expo/env` 자동 로딩이 셸 env를 override
4. `babel-preset-expo`의 환경변수 inlining이 별도 소스를 봄
5. app.config.js의 dotenv 호출 타이밍 이슈

## 6. 환경 / 컨텍스트

- Expo SDK 55
- iOS 빌드: `npm run build-ios-production-local` (로컬 EAS 빌드)
- OTA: `eas update`
- 사용자는 **로컬 빌드 + OTA 업데이트** 워크플로우 사용
- 사용자는 **EAS 서버에 env 푸시하기를 원하지 않음** (로컬 중심 운영)

## 7. 진행 중인 진단

`app.config.js` 첫 줄에 stderr 출력 진단 로그 추가:

```js
process.stderr.write(`[app.config.js BEFORE dotenv] APP_ENV=${process.env.APP_ENV} EXPO_PUBLIC_APP_ENV=${process.env.EXPO_PUBLIC_APP_ENV}\n`);
// ... dotenv.config(...) ...
process.stderr.write(`[app.config.js AFTER dotenv] APP_ENV=${process.env.APP_ENV} EXPO_PUBLIC_APP_ENV=${process.env.EXPO_PUBLIC_APP_ENV}\n`);
```

다음 OTA 실행 시 stdout에서 어느 단계에서 preview가 들어오는지 확인 예정.

## 8. 관련 코드 위치

- 광고 환경변수 평가: `src/features/admob/config/adUnits.ts:9`
- AdMob 초기화: `src/features/admob/config/adInit.ts`
- 빌드 설정: `app.config.js`
- Babel 설정: `babel.config.js`
- EAS 빌드 프로필: `eas.json`
- npm 스크립트: `package.json`

## 9. 임시 진단 코드 (제거 예정)

- `app.config.js` 상단의 stderr 출력
- `src/features/admob/config/adInit.ts`의 `Alert.alert('AdMob diag', ...)`

문제 해결 후 모두 제거 필요.

## 10. 다음 단계

1. 진단 로그를 켠 상태로 OTA publish → stdout 출력 확인
2. preview 값의 정확한 진입점 식별
3. 진입점에 맞는 최종 수정 적용
4. 임시 진단 코드 제거
5. `.env.backup` → `.env` 복구
6. 로컬 빌드 + OTA 둘 다 production 정상 동작 검증
