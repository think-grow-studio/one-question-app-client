# iOS 빌드 & App Store 출시 체크리스트

**대상:** 질문 하나 (One Question) iOS 앱
**번들 ID:** `org.onequestion.app` (production), `org.onequestion.app.preview` (preview)
**Expo SDK:** 54 / RN 0.81.5

---

## 1. Apple Developer Program (필수, $99/년)

- [ ] **Apple Developer 계정 가입** — https://developer.apple.com/programs/
- [ ] **App ID 등록 (2개)**
  - `org.onequestion.app` (production)
  - `org.onequestion.app.preview` (preview / 내부 테스트)
- [ ] **App ID Capabilities 활성화**
  - Push Notifications
  - Sign in with Apple
  - (필요 시) Associated Domains, In-App Purchase
- [ ] **Distribution Certificate / Provisioning Profile**
  - EAS Build 사용 시 자동 관리됨 (`eas credentials` 로 확인 가능)
- [ ] **App Store Connect**에 앱 2개 등록

---

## 2. Firebase iOS 설정

- [x] `GoogleService-Info.plist` 존재 (production)
- [ ] **🐛 BUG: preview 환경용 plist 누락**
  - 현재 `app.config.js`의 preview/production 둘 다 같은 plist를 가리킴
  - Preview 빌드의 번들 ID(`org.onequestion.app.preview`)와 plist의 `BUNDLE_ID`(`org.onequestion.app`)가 불일치 → Firebase 초기화 실패 가능
  - **해결**: Firebase Console에 preview 번들 ID로 iOS 앱 추가 → `GoogleService-Info-Preview.plist` 다운로드해서 프로젝트 루트에 저장
  - `app.config.js`는 이미 분리된 경로(`./GoogleService-Info-Preview.plist`)를 가리키도록 수정됨 ✅
- [ ] **APNs Authentication Key (.p8) 발급 및 Firebase 업로드**
  - Apple Developer > Keys > "+" → APNs 체크 → 다운로드 (.p8, 한 번만 가능)
  - Firebase Console > 프로젝트 설정 > Cloud Messaging > Apple 앱 구성 → .p8 + Key ID + Team ID 입력

---

## 3. Google Sign-In (iOS)

- [x] `@react-native-google-signin/google-signin` 설치됨
- [x] `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` `.env` 등록됨
- [x] `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` `.env` 등록됨 (백엔드 idToken 검증용)
- [ ] Google Cloud Console > OAuth 동의 화면 → iOS 클라이언트 ID에 **번들 ID 2개 모두 등록**
- [x] `REVERSED_CLIENT_ID` URL Scheme 자동 등록 (Expo plugin이 처리)

---

## 4. Apple Login (App Store 가이드라인 4.8 - 필수)

> 다른 소셜 로그인(Google) 제공 시 Apple Login도 **반드시** 제공해야 함. 미구현 시 100% 리젝.

- [x] 백엔드 API `/api/v1/auth/apple` 준비됨
- [x] 클라이언트 타입 `AppleAuthRequest` 정의됨
- [x] `expo-apple-authentication` 패키지 추가
- [x] `app.config.js`에 `usesAppleSignIn: true` 추가
- [x] `useAppleLogin` 훅 구현
- [x] `login.tsx`에서 Apple Login 버튼 활성화
- [ ] Apple Developer App ID에 **Sign in with Apple capability** 활성화 (위 1번 항목)
- [ ] EAS 빌드 후 실기기 테스트 (시뮬레이터에서도 iOS 13+ 동작)

---

## 5. AdMob (iOS)

- [x] `react-native-google-mobile-ads` 설치됨
- [x] AdMob iOS 광고 단위 ID `.env` 등록됨 (banner, interstitial, native, rewarded)
- [x] `app.config.js`의 `with-google-mobile-ads` 플러그인에서 iOS App ID 주입
- [x] **App Tracking Transparency (ATT)**
  - `expo-tracking-transparency` 패키지 추가
  - `NSUserTrackingUsageDescription` Info.plist 추가됨
- [ ] **앱 실행 시 ATT 권한 요청 플로우 추가**
  - 앱 첫 실행 또는 광고 첫 노출 직전에 `requestTrackingPermissionsAsync()` 호출
  - (구현 위치 제안: `app/_layout.tsx` 또는 광고 로드 직전)
- [ ] **SKAdNetwork IDs Info.plist 추가**
  - AdMob 가이드: https://developers.google.com/admob/ios/ios14
  - 약 100+ 개 ID — `app.config.js`의 `infoPlist.SKAdNetworkItems`에 추가 필요
- [ ] AdMob Console에서 iOS 앱이 "Apple App Store에 게시됨" 상태로 연결되어야 실광고 노출됨 (출시 후)

---

## 6. Push Notifications

- [x] `@react-native-firebase/messaging` 설치됨
- [x] `expo-notifications` 설치됨
- [ ] APNs 키 Firebase 업로드 (위 2번)
- [ ] iOS Capability 활성화 (Apple Developer App ID)
  - Push Notifications
  - Background Modes → Remote notifications

---

## 7. App Store 메타데이터 / 심사 준비

- [ ] **앱 아이콘 1024x1024** (불투명, 알파 채널 없음, sRGB)
- [ ] **스크린샷**
  - iPhone 6.7" (1290x2796) — iPhone 15/16 Pro Max
  - iPhone 6.5" (1242x2688) — iPhone 11 Pro Max
  - iPhone 5.5" (1242x2208) — iPhone 8 Plus (현재 선택사항)
  - iPad 12.9" (2048x2732) — `supportsTablet: true`라서 필수
- [ ] **개인정보처리방침 URL** (필수)
  - 현재 https://one-question.org/legal-document 사용 중
- [ ] **App Privacy 설문**
  - 수집 데이터: Email (Google 로그인), User ID, 사용 데이터 (Analytics), 진단 데이터 (Crashlytics), Device ID (광고)
- [ ] **앱 카테고리 / 연령 등급**
- [ ] **앱 설명 / 키워드** (한/영/일)
- [ ] **`appStoreUrls.ts` App Store ID 교체**
  - 현재 `idXXXXXXXXXX` placeholder
  - App Store Connect에서 앱 생성 후 발급되는 ID로 교체

---

## 8. EAS 설정 점검

- [ ] **`eas.json` `submit.production` 설정 추가**
  ```json
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
  ```
  → `--auto-submit` 동작에 필요
- [x] `appVersionSource: "remote"` (EAS가 buildNumber 자동 증가)

---

## 9. Info.plist 권한 문구 점검

- [x] `NSUserTrackingUsageDescription` (ATT - AdMob)
- [ ] 추가 검토 필요한 권한
  - 로컬 알림: `expo-notifications`가 자동 처리
  - 카메라/사진: `react-native-view-shot`은 권한 불필요 (스크린샷용)
  - 마이크/위치: 사용 안 함

---

## 10. 빌드 명령

### Preview (TestFlight 내부 테스트)
```bash
# 클라우드 빌드 + 자동 제출
npm run build-ios-preview-cloud-submit

# 로컬 빌드 (macOS 필요)
npm run build-ios-preview
```

### Production (App Store)
```bash
# 클라우드 빌드 + 자동 제출
npm run build-ios-production-cloud-submit

# 로컬 빌드
npm run build-ios-production-local
```

---

## 우선순위 요약

### 🔴 출시 전 필수 (블로커)
1. Apple Developer 계정 ($99) 가입
2. Apple Login 구현 ✅ (코드 작업 완료)
3. Firebase preview 번들 plist 분리 (Console에서 추가 후 다운로드)
4. APNs 키 발급 → Firebase 업로드
5. App Store Connect 앱 등록
6. ATT 권한 요청 플로우 연결 (현재 권한 문자열만 등록됨, 호출 시점 추가 필요)
7. 개인정보처리방침 / App Privacy 설문
8. 앱 아이콘 1024x1024 + 스크린샷
9. `appStoreUrls.ts` App Store ID 교체

### 🟡 권장 (출시 후 개선 가능)
10. SKAdNetwork IDs Info.plist 추가 (AdMob 수익 정확도 향상)
11. `eas.json` submit 자격증명 등록 (자동 제출 편의)
12. 일본어(`ja`) i18n 리소스 추가 (현재 ko/en만 있음)

### 🟢 완료
- ✅ Firebase iOS plist (production만)
- ✅ Google Login (iOS)
- ✅ AdMob iOS 환경변수
- ✅ Push Notifications 패키지 설치
- ✅ Apple Login 클라이언트 구현
- ✅ `usesAppleSignIn: true` 설정
- ✅ ATT Info.plist 문구
