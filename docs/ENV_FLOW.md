# 환경변수 주입 흐름

이 프로젝트의 env가 언제, 어디서, 어떻게 주입되는지 한눈에 정리한 문서.

---

## TL;DR

- **production 빌드의 단일 원천**: `.env.production` (gitignored)
- **dev/preview 값**: 전부 코드에 하드코딩된 fallback (env 파일 불필요)
- **wrapper script 없음, `sh -c` 없음, `dotenv` 의존성 없음**
- production 명령엔 `NODE_ENV=production` 셸 prefix만 박음
- `ios-device`는 Metro 의존성 회피를 위해 Release 빌드 + preview env 강제 조합

```
production:    NODE_ENV=production + .env.production    → 실 production 값
dev simulator: 아무것도 안 함                            → 코드 fallback
ios-device:    NODE_ENV=development + Release           → 자체 포함 binary + preview
```

---

## 멘탈 모델 — 두 레이어, 네 출처

빌드 시점에 env 값이 처리되는 **독립된 두 레이어**가 있다.

```
┌─────────────────────────────────────────────────────────────┐
│ 레이어 A: 네이티브 config 주입                              │
│   app.config.js 평가 → 플러그인 → Info.plist / Manifest     │
│   (한 번 박히면 끝. OTA로 못 바꿈)                          │
│                                                             │
│ 레이어 B: JS 번들 inline                                    │
│   Metro/babel → process.env.EXPO_PUBLIC_* 을 코드에 박음    │
│   (JS 번들 안에 문자열 리터럴. OTA로 교체 가능)             │
└─────────────────────────────────────────────────────────────┘
```

값의 출처는 네 군데:

| 출처 | 위치 | 어떤 값 |
|---|---|---|
| ① 코드 상수 | `app.config.js` | `PRODUCTION_ADMOB_APP_IDS`, `TEST_ADMOB_APP_IDS`, `GOOGLE_CLIENT_IDS`, dev API URL fallback |
| ② 코드 상수 | `adUnits.ts` | `TEST_IDS` (Google 공식 테스트 Ad Unit ID) |
| ③ env 파일 | `.env.production` | API_URL, APP_ENV, EXPO_PUBLIC_APP_ENV, AdMob Ad Unit ID 12개 |
| ④ eas.json | `build.{profile}.env` | API_URL, APP_ENV, EXPO_PUBLIC_APP_ENV (메타데이터 3개만) |

---

## 값별로 어디서 결정되나

| 값 | dev/preview | production |
|---|---|---|
| **AdMob App ID** (Info.plist) | `TEST_ADMOB_APP_IDS` (코드) | `PRODUCTION_ADMOB_APP_IDS` (코드) |
| **AdMob Ad Unit ID** (JS 번들) | `TEST_IDS` (adUnits.ts 코드) | `.env.production` → Metro inline |
| **Google OAuth Client ID** | `GOOGLE_CLIENT_IDS` (코드) | 동일 (환경 무관) |
| **API URL** | `'https://dev.one-question.org'` (코드 fallback) | `.env.production`의 `API_URL` |
| **appEnv** (환경 판정) | `'preview'` (default) | `.env.production`의 `APP_ENV=production` |
| **Bundle ID** | iOS `org.onequestion.app` / Android `.preview` | iOS/Android 모두 정규 ID |
| **앱 이름** | `질문 하나Preview` | `질문 하나` |

---

## 시나리오 1: `npm run ios` (USB 개발 테스트)

```
npm run ios
  │
  ▼
"rm -rf ./ios && expo run:ios"
  │
  ▼
Expo CLI 시작
  │  NODE_ENV 미설정
  │  → @expo/env가 어떤 .env 파일도 안 로드 (.env 파일 자체 없음)
  │  → process.env에 ADMOB_*, APP_ENV 다 비어있음
  │
  ├─► 레이어 A (app.config.js 평가)
  │     process.env.APP_ENV undefined → appEnv='preview'
  │     ADMOB_APP_IDS = TEST_ADMOB_APP_IDS
  │     → Info.plist: GADApplicationIdentifier = Google 테스트 App ID
  │     extra.apiUrl = 'https://dev.one-question.org' (fallback)
  │     extra.googleClientIdWeb = 코드 상수
  │
  └─► 레이어 B (Metro 번들링)
        process.env.EXPO_PUBLIC_APP_ENV undefined
        → adUnits.ts: isAdMobProduction=false
        → banner = TEST_IDS.banner (Google 테스트)
        → 번들에 테스트 Ad Unit ID inline

결과: 테스트 광고, dev API, 앱 이름 "질문 하나Preview"
```

> **핵심**: env 파일이 하나도 안 로드되어도 모든 값이 코드 상수에서 자동 fallback. 단말 USB로 꽂아서 바로 테스트 가능.

---

## 시나리오 1.5: `npm run ios-device` (USB 단말 자체 포함 preview 설치)

`npm run ios`(Debug)는 Metro 서버를 단말이 같은 Wi-Fi에서 찾아야 한다 — 환경에 따라 잘 안 됨.
이 스크립트는 **Release 빌드의 자체 포함성**(Metro 의존 X)과 **preview env**(테스트 광고/dev API)를 합친다.

### 한 줄 분해

```
NODE_ENV=development expo run:ios --device --configuration Release
   ↓                    ↓             ↓        ↓
   |                    |             |        Release = JS 번들 inline, Metro 의존 X
   |                    |             USB 연결 단말 타겟
   |                    Expo CLI 시작
   RN의 Release auto-NODE_ENV=production를 무력화
   → .env.production 로드 차단
   → process.env.APP_ENV 비어있음 → app.config.js가 preview로 자동 분기
   → process.env.EXPO_PUBLIC_APP_ENV 비어있음 → adUnits.ts가 TEST_IDS 사용
```

> `APP_ENV=preview`를 명시할 필요 없음 — `app.config.js`가 `APP_ENV !== 'production'`이면 자동으로 preview로 떨어지게 설계됨.

### 왜 이 조합이 필요한가

`--configuration Release`만 박으면 RN 빌드 phase가 자동으로 `NODE_ENV=production`을 박음:

```bash
# react-native-xcode.sh 내부
if [[ -z "$NODE_ENV" ]]; then
  case "$CONFIGURATION" in
    *Debug*)   NODE_ENV=development ;;
    *)         NODE_ENV=production ;;
  esac
fi
```

→ `.env.production` 자동 로드 → production 광고/API가 dev 단말에 박힘.

**셸 prefix로 `NODE_ENV`를 미리 박으면 RN이 덮어쓰지 못함** (이미 set돼있으면 건드리지 않음).
`APP_ENV=preview`는 prebuild 시점에 app.config.js가 preview 분기 타도록.

### 단계별 동작

```
npm run ios-device
  │
  ▼
NODE_ENV=development 이 셸 env에 박힘
  │
  ▼
Expo CLI 시작
  │
  ├─► 레이어 A (app.config.js 평가, prebuild 단계)
  │     process.env.APP_ENV undefined → appEnv='preview' (default)
  │     ADMOB_APP_IDS = TEST_ADMOB_APP_IDS
  │     → Info.plist: GADApplicationIdentifier = Google 테스트 App ID
  │     앱 이름: "질문 하나Preview"
  │     Android package: com.onequestion.app.preview
  │
  ▼
Xcode Release 빌드 시작
  │  RN 빌드 phase: NODE_ENV 이미 'development'로 set됨 → 덮어쓰지 않음
  │  @expo/env: .env.development/.env.local/.env 시도 → 모두 없음 → 빈 env
  │
  └─► 레이어 B (Metro 번들링, __DEV__=false)
        process.env.EXPO_PUBLIC_APP_ENV undefined
        → adUnits.ts: isAdMobProduction=false
        → banner = TEST_IDS.banner (Google 테스트)
        → 번들에 테스트 Ad Unit ID inline

결과: 자체 포함 .ipa, 테스트 광고, dev API, 앱 이름 "질문 하나Preview", Metro 의존 X
```

### 부수효과

- React가 **development build** 사용 (NODE_ENV=development) → propTypes 체크, 자세한 에러 메시지 (디버깅에 유리)
- `__DEV__` 는 `false` (Release configuration 영향, NODE_ENV와 독립) → `if (__DEV__)` 코드는 제거됨
- Hermes 최적화 적용 → 성능 거의 production 수준
- 단 진짜 production 성능 검증은 `build-ios-production-local` + TestFlight 통해야 함

---

## 시나리오 2: `npm run build-ios-production-local` (production 네이티브 빌드)

```
npm run build-ios-production-local
  │
  ▼
"rm -rf ios && NODE_ENV=production eas build --platform ios --profile production --local --clear-cache"
  │
  ▼
EAS CLI 시작 (NODE_ENV=production 환경)
  │  eas.json의 production.env 읽음
  │  → 자식 빌드 프로세스에 주입:
  │     API_URL=https://one-question.org
  │     APP_ENV=production
  │     EXPO_PUBLIC_APP_ENV=production
  │
  ▼
EAS가 expo prebuild 실행
  │  @expo/env가 NODE_ENV=production 보고 .env.production 자동 로드
  │  → 12개 EXPO_PUBLIC_ADMOB_*_ID 가 process.env에 채워짐
  │
  ├─► 레이어 A (app.config.js 평가)
  │     process.env.APP_ENV='production' → isProduction=true
  │     ADMOB_APP_IDS = PRODUCTION_ADMOB_APP_IDS
  │     → Info.plist: GADApplicationIdentifier = 실 production App ID
  │     extra.apiUrl = 'https://one-question.org' (env값 사용)
  │     앱 이름: "질문 하나", bundle ID 정규
  │
  ▼
Xcode 빌드 + Metro 번들링
  │
  └─► 레이어 B (Metro 번들링)
        process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID=실제 ID
        → babel이 코드에 inline
        → adUnits.ts: isAdMobProduction=true
        → banner = 실 production banner ID

결과: .ipa 산출물에 실 App ID(Info.plist) + 실 Ad Unit ID(JS 번들)
```

---

## 시나리오 3: `npm run update-ios-production` (OTA 배포)

```
npm run update-ios-production
  │
  ▼
"export APP_ENV=production NODE_ENV=production && \
   npx expo export ... && \
   eas update --skip-bundler --input-dir dist/ios-production --environment production ..."
  │
  ├─► 사전: `export VAR=...`로 셸에 등록 → 이후 모든 `&&` 체인 명령에 전파
  │   (⚠️ `VAR=value cmd1 && cmd2` 형태는 cmd1에만 적용됨 — 2026-05-14 사고 원인)
  │
  ├─► 1단계: npx expo export
  │     │  @expo/env가 .env.production 자동 로드 (NODE_ENV=production 덕분)
  │     │  app.config.js 평가: appEnv='production' (APP_ENV=production)
  │     │
  │     └─► 레이어 B만 수행 (네이티브 안 건드림)
  │           Metro가 EXPO_PUBLIC_* inline
  │           → dist/ios-production/ 에 JS bundle 산출
  │
  └─► 2단계: eas update --skip-bundler --input-dir dist/ios-production
        이미 만들어진 번들을 그대로 EAS에 업로드
        하지만 manifest 생성을 위해 app.config.js를 **다시 평가**한다
        → APP_ENV이 셸에 등록되어 있어야 manifest에도 production extra가 박힘

결과: 사용자 단말에 다운로드 시
  - 기존 native (레이어 A, 빌드 시점 박힌 값)
  - 새 JS bundle (레이어 B, OTA 교체)
  - 새 manifest (Constants.expoConfig.extra.*의 출처)
```

> **핵심 1**: `--skip-bundler --input-dir`가 `eas update`의 자체 번들링은 차단하지만, **manifest 생성은 차단하지 않는다**. manifest 생성 시 `app.config.js`가 재평가되므로, env가 그 시점에도 set돼 있어야 한다.
>
> **핵심 2**: `Constants.expoConfig.extra.*`는 **bundle string이 아니라 manifest에서 읽는다**. 둘 중 어느 하나만 오염돼도 런타임 영향. 자세한 사례: `docs/POSTMORTEM_2026-05-14_PROD_OTA_DEV_URL.md`.

---

## 핵심 설계 결정

| 결정 | 이유 |
|---|---|
| App ID 코드 상수 | publisher ID는 비밀 아님 (빌드 산출물에 평문 노출). 환경별로도 안 변함 |
| Google OAuth 코드 상수 | 같은 이유. publicly visible identifier |
| Ad Unit ID는 env | production 운영하면서 새 광고 단위 추가 잦음 |
| dev API URL은 코드 fallback | `process.env.API_URL \|\| 'https://dev...'` 한 줄로 끝 |
| TEST_IDS는 adUnits.ts 코드 상수 | Google 공식 테스트 ID는 절대 안 변함 |
| `.env.production` 단일 파일 | dev fallback이 코드에 다 있으므로 `.env` 자체가 불필요 |
| production OTA만 운영 | preview OTA는 `expo export`의 NODE_ENV quirk 때문에 누수 위험 → 안 쓰는 게 안전 |

---

## 견고성 (실패 시나리오별 동작)

| 실패 시나리오 | 동작 |
|---|---|
| `.env.production` 분실 | dev는 정상 (코드 fallback). production 빌드는 Ad Unit ID 미주입 → `adUnits.ts`의 `\|\| TEST_IDS.banner` fallback 작동 → 테스트 광고 노출 (앱 자체는 정상 동작) |
| `NODE_ENV=production` prefix 빠뜨림 | Metro가 `.env.production` 안 로드 → Ad Unit ID 테스트 ID로 폴백 → 빌드 로그의 `[app.config.js]` 진단 한 줄에 `iosBanner=(unset)` 찍힘 → 즉시 감지 |
| `app.config.js`의 `requireEnv()` 누락 | requireEnv 패턴 자체를 제거함. App ID는 코드 상수라 누락 자체가 불가능 |
| preview OTA로 production 값 누수 | preview OTA 스크립트 자체가 없음 → 발생 불가 |

---

## 빌드 시점 진단 한 줄

모든 `npx expo export`, `eas build --local`, `npx expo config`는 stderr로 다음을 출력:

```
[app.config.js] appEnv=<production|preview> iosBundleId=<...> nodeEnv=<...> iosBanner=<...>
```

판별표:

| 출력 | 의미 |
|---|---|
| `appEnv=production iosBanner=ca-app-pub-...` | 정상 production 빌드 |
| `appEnv=production iosBanner=(unset)` | `.env.production` 로드 실패 ⚠️ |
| `appEnv=preview iosBanner=(unset)` | 정상 dev/preview 빌드 |
| `appEnv=preview iosBanner=ca-app-pub-...` | preview 빌드인데 production env 누수 ⚠️ |

production 빌드면 첫 번째 줄만 나와야 정상.

---

## 파일 맵

```
app-client/
├── app.config.js              ← 코드 상수 (App ID, OAuth, fallback)
├── eas.json                   ← profile별 메타데이터 3개만
├── .env.production            ← production 단일 원천 (gitignored)
├── .env.example               ← 키 템플릿 (git 추적)
├── package.json               ← 스크립트 (sh -c 0, set -a 0)
├── src/features/admob/config/
│   ├── adUnits.ts             ← TEST_IDS 상수 + isAdMobProduction 분기
│   └── adInit.ts              ← ATT + SDK init + testDeviceIdentifiers
└── plugins/
    └── with-google-mobile-ads.js  ← Info.plist/Manifest에 App ID 주입
```

---

## 명령어 빠른 참조

```bash
# Dev (시뮬레이터, Metro 의존)
npm run ios                              # iOS 시뮬레이터 Debug (Metro 필요)
npm run android                          # Android Debug

# Dev (USB 단말, Metro 의존 X)
npm run ios-device                       # iOS USB - Release 빌드 + preview env 강제
npm run ios-device-clear                 # ios/ 폴더 완전 삭제 후 처음부터 빌드

# 로컬 EAS 빌드 (production, 스토어 제출용)
npm run build-ios-production-local       # .ipa 산출
npm run build-android-production         # .aab 산출

# OTA (production만)
npm run update-ios-production            # export + eas update 한 번에
npm run update-android-production
```

production 명령엔 공통적으로 `NODE_ENV=production` prefix가 박혀있어 Expo CLI가 `.env.production`을 자동 로드.
`ios-device`는 정반대로 `NODE_ENV=development`로 박아 Release 빌드의 production 강제를 무력화함.

---

## 참고

- 이 구조의 디자인 history: `docs/ADMOB_ENV_DEBUG.md` (해결된 이슈 기록)
- USB 단말 테스트 가이드: `docs/IOS_USB_RUN_GUIDE.md`
