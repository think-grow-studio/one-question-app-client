# 🔥 Firebase 설정 가이드

## 1. Firebase Console에서 프로젝트 생성

1. **Firebase Console 접속**
   - https://console.firebase.google.com/

2. **새 프로젝트 생성**
   - "프로젝트 추가" 클릭
   - 프로젝트 이름: `one-question` (또는 원하는 이름)
   - Google Analytics 활성화: **예**
   - 위치: **대한민국**

---

## 2. Android 앱 등록

1. **Android 앱 추가**
   - Firebase Console > 프로젝트 설정 > "Android 앱 추가"

2. **패키지 이름 입력**
   ```
   com.onequestion.app
   ```
   (app.config.js의 android.package와 동일)

3. **google-services.json 다운로드**
   - 다운로드한 `google-services.json` 파일을 다음 위치에 저장:
   ```
   android/app/google-services.json
   ```

4. **Crashlytics 활성화**
   - Firebase Console > Crashlytics > "시작하기"
   - 안내에 따라 설정 (자동으로 설정됨)

---

## 3. iOS 앱 등록

1. **iOS 앱 추가**
   - Firebase Console > 프로젝트 설정 > "iOS 앱 추가"

2. **번들 ID 입력**
   ```
   com.onequestion.app
   ```
   (app.config.js의 ios.bundleIdentifier와 동일)

3. **GoogleService-Info.plist 다운로드**
   - 다운로드한 `GoogleService-Info.plist` 파일을 다음 위치에 저장:
   ```
   ios/GoogleService-Info.plist
   ```

4. **Crashlytics 활성화**
   - Firebase Console > Crashlytics > "시작하기"
   - 안내에 따라 설정 (자동으로 설정됨)

---

## 4. Expo Prebuild 실행

Firebase를 사용하려면 네이티브 코드가 필요하므로 **prebuild**를 실행해야 합니다.

```bash
# Prebuild 실행 (android, ios 폴더 생성)
npx expo prebuild

# 또는 특정 플랫폼만
npx expo prebuild --platform android
npx expo prebuild --platform ios
```

**중요:** Prebuild 후 위에서 다운로드한 파일들을 배치해야 합니다:
- `android/app/google-services.json`
- `ios/GoogleService-Info.plist`

---

## 5. 앱 실행

### Android
```bash
npx expo run:android
```

### iOS
```bash
npx expo run:ios
```

---

## 6. Firebase Console에서 확인

1. **Analytics 대시보드**
   - Firebase Console > Analytics > 대시보드
   - 실시간 사용자, 이벤트 확인

2. **Crashlytics 대시보드**
   - Firebase Console > Crashlytics
   - 크래시 리포트 확인

---

## 7. 테스트

### Analytics 테스트
```typescript
import { logEvent, AnalyticsEvents } from '@/services/firebase';

// 이벤트 로깅
await logEvent(AnalyticsEvents.QUESTION_VIEW, {
  question_id: '123',
  category: 'daily',
});
```

### Crashlytics 테스트
```typescript
import { recordError, testCrash } from '@/services/firebase';

// 에러 기록
try {
  // 어떤 작업
} catch (error) {
  recordError(error as Error, 'Context info');
}

// 테스트 크래시 (개발 중에만!)
// testCrash(); // 주의: 앱이 크래시됩니다!
```

---

## 8. 환경 변수 (선택사항)

Firebase 설정을 환경 변수로 관리하려면 `.env` 파일에 추가:

```bash
# .env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_APP_ID_ANDROID=1:123456789:android:abc123
FIREBASE_APP_ID_IOS=1:123456789:ios:def456
```

---

## 🎉 완료!

이제 Firebase Analytics와 Crashlytics가 앱에 통합되었습니다.

### 다음 단계:
- [ ] Firebase Console에서 대시보드 확인
- [ ] 주요 화면에 screen_view 이벤트 추가
- [ ] 사용자 행동 추적 이벤트 추가
- [ ] 에러 처리 로직에 Crashlytics 추가

### 유용한 링크:
- [Firebase Console](https://console.firebase.google.com/)
- [React Native Firebase 문서](https://rnfirebase.io/)
- [Analytics 이벤트 목록](https://firebase.google.com/docs/analytics/events)
