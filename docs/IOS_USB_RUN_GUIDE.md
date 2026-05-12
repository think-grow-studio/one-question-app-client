# iOS 실기기 USB 빌드 & 광고 검증 가이드

`npm run ios`로 USB 연결한 iPhone에 직접 빌드해서 띄우는 방법과, 그 과정에서 AdMob/ATT 동작을 검증하는 절차.

---

## 1. iPhone 측 사전 설정

### 1.1 개발자 모드 (iOS 16+ 필수)

> 개발자 모드 메뉴는 Xcode가 단말에 한 번 닿아야 비로소 노출됨. 처음엔 안 보이는 게 정상.

**메뉴 노출 절차**

1. USB로 iPhone 연결 → "이 컴퓨터를 신뢰하시겠습니까?" → **신뢰**
2. Mac에서 Xcode 실행 → 메뉴바 **Window > Devices and Simulators** (`⇧⌘2`)
3. 좌측에 본인 iPhone 클릭 → "Preparing device for development" 메시지 대기
4. iPhone에서 설정 앱 완전 종료 후 재실행
5. **설정 > 개인정보 보호 및 보안 > 맨 아래 "개발자 모드"** 항목 등장 → 토글 ON
6. 재시동 → 잠금 푼 후 "켜기" 확인

**그래도 안 보이면**

- iOS 16 미만이면 메뉴 자체가 없음 (대신 "신뢰" 한 번이면 끝). `설정 > 일반 > 정보`에서 버전 확인
- Xcode 14 이상 필요
- 회사/학교 MDM 관리 단말은 정책으로 막혀있을 수 있음
- 충전 전용 케이블은 Xcode가 인식 못 함 → Finder 사이드바에 iPhone이 떠야 정상

**터미널 빠른 확인**

```bash
xcrun xctrace list devices
```

본인 iPhone이 나오면 Xcode가 인식한 상태.

### 1.2 첫 빌드 후 "Untrusted Developer" 메시지

- **설정 > 일반 > VPN 및 기기 관리 > 본인 Apple ID 항목** → "신뢰"
- 그 후 앱 아이콘 다시 탭

---

## 2. Mac 측 사전 설정

### 2.1 Xcode 설치 + Command Line Tools

```bash
xcode-select --install
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### 2.2 Xcode에 Apple ID 로그인

- Xcode > Settings (`⌘,`) > Accounts 탭 > "+" → Apple ID
- 무료 Apple ID도 가능 (7일 프로비저닝, 단말 3개 한도)
- 유료 Apple Developer Program 가입 시 1년 프로비저닝 + 무제한 재배포

### 2.3 첫 사이닝 (한 번만)

1. `npm run ios -- --device` 한 번 실행해서 `ios/` 폴더 생성
2. `ios/onequestion.xcworkspace` 열기 (`.xcodeproj` 아니라 `.xcworkspace`)
3. 좌측 상단 프로젝트 클릭 > **Signing & Capabilities** 탭
4. "Automatically manage signing" 체크 + Team 선택 (본인 Apple ID)
5. 빨간 에러 없으면 OK → Xcode 닫고 CLI로 진행

> 무료 Apple ID는 production 번들 ID(`org.onequestion.app`)로 사이닝이 막힐 수 있음. 그때는 Xcode에서 임시로 `org.onequestion.app.dev` 같이 끝에 붙여서 빌드하거나, 유료 Developer Program 계정 사용.

---

## 3. 실행 명령

```bash
# 인터랙티브 디바이스 픽커
npm run ios -- --device

# 디바이스 이름 명시
npm run ios -- --device "내 iPhone"

# Release 구성 (실사용 환경에 더 가까움)
npm run ios -- --device --configuration Release

# production 환경 강제 (실제 광고 단위 ID 사용)
APP_ENV=production npm run ios -- --device --configuration Release
```

> `npm run ios`는 내부적으로 `rm -rf ./ios && expo run:ios` 실행 → Pods 재설치까지 포함되어 첫 실행은 10~20분 소요. `useFrameworks: 'static'` + RNFB `forceStaticLinking` 때문.

---

## 4. 환경 차이 정리

| 명령 | APP_ENV | isProduction | 광고 단위 ID | 용도 |
|------|---------|--------------|------------|------|
| `npm run ios -- --device` | `preview` (`.env`) | `false` | Google 공식 테스트 ID | 통합 테스트 |
| `APP_ENV=production npm run ios -- --device` | `production` | `true` | 실제 운영 ID (`.env.production`) | production 흐름 검증 |
| `eas build --profile preview` (TestFlight) | `preview` | `false` | 테스트 ID | 내부 배포 |
| `eas build --profile production` (TestFlight) | `production` | `true` | 실제 운영 ID | 출시/검증 |

**주의: 로컬 빌드 번들 ID도 `org.onequestion.app` (production과 동일) → 같은 단말의 TestFlight 설치본을 덮어씀.** 다시 TestFlight 받으려면 재설치 필요.

---

## 5. AdMob/ATT 검증 절차

### 5.1 ATT 프롬프트 동작 확인

`adInit.ts`가 SDK 초기화 전에 `requestTrackingPermissionsAsync()`를 호출하므로 **첫 실행 시** 시스템 다이얼로그가 뜸.

- "허용" 시 IDFA 사용 가능 → AdMob fill 정상화
- "허용 안 함" 시 IDFA = 0...0 → 비개인화 광고만 fill (Android는 ATT 단계 통째로 건너뜀)

**재테스트 방법** (한 번 응답하면 시스템이 캐싱)

- 앱 삭제 후 재설치
- **또는** 설정 > 질문 하나 > 추적 토글 OFF → ON
- **또는** 설정 > 개인정보 보호 및 보안 > 추적 → 토글 OFF → ON (전역)

### 5.2 본인 단말 IDFA 추출 (테스트 광고 안전 클릭용)

production TestFlight나 production 로컬 빌드에서 본인 단말이 실제 광고를 클릭하면 AdMob 정책 위반. **본인 IDFA를 `testDeviceIdentifiers`에 넣으면** 실제 광고 단위 ID를 그대로 쓰면서도 테스트 광고로 노출됨.

**추출 절차**

1. ATT "허용" 응답한 빌드를 단말에서 실행
2. 광고가 처음 로드되는 화면 진입 (배너든 인터스티셜이든)
3. macOS **Console.app** 실행 → 좌측 사이드바에서 본인 iPhone 선택
4. 검색창에 `testDeviceIdentifiers` 입력
5. 다음 형태의 로그 메시지 등장:
   ```
   <Google> To get test ads on this device, set:
   GADRequestConfiguration.testDeviceIdentifiers = @[ @"XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" ]
   ```
6. UUID 복사

**또는** Xcode 빌드한 경우 Xcode 좌하단 콘솔에서 같은 메시지 검색 가능.

**등록**

`src/features/admob/config/adInit.ts`의 `testDeviceIdentifiers` 배열에 추가:

```ts
testDeviceIdentifiers: [
  'EMULATOR',
  '1AA71683D3B0DD450FF6F68CE236AC37', // Android debug
  '4D58ED45A1C6473D6C2D47DFCE3327F1', // Android preview/release
  'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // iOS 본인 단말
],
```

이 이후 **모든 빌드(USB, TestFlight, production)** 에서 본인 단말은 테스트 광고로 노출 → 자유롭게 클릭/노출 검증 가능.

---

## 6. preview iOS vs production TestFlight 선택

이 프로젝트는 iOS preview/production이 같은 bundle ID(`org.onequestion.app`)를 쓰도록 통합되어 있음 (Apple Sign-In/APNs 키 관리 회피 목적). 그래서:

**iOS preview를 따로 만드는 건 비추천**

- 같은 bundle ID라 production 설치본을 덮어씀
- 늘 테스트 광고만 노출되어 실제 광고 단위 검증 불가
- TestFlight 빌드 번호 풀이 production과 공유되어 관리 복잡

**권장: production TestFlight + 본인 단말 IDFA 등록**

- 실제 광고 단위 ID로 전체 흐름 검증
- 본인 단말은 자동으로 테스트 광고 (정책 위반 ❌)
- AdMob 콘솔에 앱이 게시되어 있지 않아도 fill 보장

---

## 7. 첫 실행 추천 순서

1. iPhone 개발자 모드 ON (위 1.1)
2. Xcode Apple ID 로그인 + Command Line Tools (위 2.1, 2.2)
3. `npm run ios -- --device` 실행
4. 사이닝 에러 시 Xcode에서 한 번 잡아주고 다시 실행 (위 2.3)
5. 빌드 완료 → 자동 설치/실행
6. ATT 프롬프트 → "허용"
7. Console.app 또는 Xcode 콘솔에서 IDFA 추출 (위 5.2)
8. `adInit.ts`에 IDFA 추가 후 다시 빌드

---

## 8. 자주 막히는 지점

| 증상 | 원인/해결 |
|------|----------|
| "Could not find any available device" | 핸드폰 잠금 풀고 신뢰 팝업 다시 확인. 케이블 데이터 지원 여부 확인 |
| 개발자 모드 메뉴가 안 보임 | Xcode가 단말에 한 번 연결되어야 노출됨. 1.1 절차 |
| "Untrusted Developer" 알림 | 설정 > 일반 > VPN 및 기기 관리 > 본인 ID > 신뢰 |
| 사이닝 에러 (번들 ID 충돌) | 무료 Apple ID로는 production 번들 ID 사이닝이 막힐 수 있음. 임시 suffix 또는 유료 Developer Program |
| Pods install 무한 대기 | 첫 실행은 정상 (10~20분). `useFrameworks: 'static'` 영향 |
| ATT 프롬프트가 안 뜸 | 이미 응답했음. 앱 삭제 후 재설치 또는 추적 토글 리셋 (위 5.1) |
| 광고가 여전히 안 뜸 | (1) ATT 응답 확인 (2) 단말 IDFA 등록 확인 (3) `BannerAd`의 `onAdFailedToLoad` 에러 코드 Xcode 콘솔에서 확인 |
