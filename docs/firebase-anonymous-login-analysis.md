# Firebase 익명 로그인 도입 분석

## Context
현재 앱은 Google 로그인만 지원하며, Firebase는 Analytics/Crashlytics 용도로만 사용 중.
**Firebase Auth SDK 자체는 미설치 상태** - 즉, 현재 auth 흐름은 순수하게 Google Sign-In → 자체 백엔드 JWT 시스템.

익명 로그인 도입 시 복잡성과 iOS 앱 심사 이슈를 철저히 분석한다.

---

## 현재 아키텍처 요약

```
[Google Sign-In SDK]
      ↓ idToken
[자체 백엔드 POST /api/v1/auth/google]
      ↓ accessToken + refreshToken (JWT)
[AsyncStorage 저장 + Zustand 상태관리]
```

- Firebase Auth SDK: **없음** (analytics, crashlytics만 사용)
- 유저 식별: 백엔드 자체 userId + JWT
- provider 타입: `'GOOGLE' | 'APPLE'` (ANONYMOUS 없음)

---

## 1. 익명 로그인 도입 복잡성 분석

### 필요한 추가 작업

#### 클라이언트 (앱)
| 항목 | 작업 | 난이도 |
|------|------|--------|
| `@react-native-firebase/auth` 패키지 설치 | `npm install` + native build | 낮음 |
| Firebase 익명 로그인 구현 | `auth().signInAnonymously()` | 낮음 |
| 익명 Firebase UID → 백엔드 전달 | 새 API 엔드포인트 or 기존 수정 | 중간 |
| AuthStore 확장 | `isAnonymous` 상태 추가 | 낮음 |
| UI 분기 처리 | 익명/로그인 유저 기능 차이 노출 | 중간 |
| 네비게이션 흐름 수정 | 로그인 강제 여부 결정 | 중간 |

#### 백엔드
| 항목 | 작업 | 난이도 |
|------|------|--------|
| 익명 유저 엔티티 설계 | `provider: 'ANONYMOUS'` 추가 | 중간 |
| POST /api/v1/auth/anonymous 엔드포인트 | Firebase UID 검증 + JWT 발급 | 중간 |
| 익명 유저 데이터 정책 | 만료 처리, 데이터 보존 범위 | 높음 |

**전체 복잡성: 중간** — 단순히 붙이는 것 자체는 어렵지 않으나,
익명 유저의 데이터 보존 정책, 기능 제한 정책을 정의하는 의사결정이 핵심 난관.

---

## 2. iOS 앱 심사 허용 여부

**결론: 허용됨. 오히려 권장.**

- Apple 가이드라인은 "계정 없이 앱 사용 가능한 경로" 제공을 긍정적으로 봄
- 익명 로그인 자체는 심사 거절 사유가 아님
- **단, 주의사항:**
  - 익명 유저에게 유료 기능 접근 시 구매 복원 불가 문제 → 심사관이 문제 삼을 수 있음
  - 익명 계정이 삭제될 경우 복구 불가 고지 필요 (UX 요구사항)
  - Apple은 "계정 삭제 기능" 의무화 → 익명 유저도 동일하게 적용

---

## 3. 익명 → 구글 계정 연동 복잡성 분석

이 부분이 **가장 큰 복잡성**이다.

### 3-1. Firebase Auth 레벨 연동

Firebase는 `linkWithCredential()` API 제공:
```typescript
const googleCredential = GoogleAuthProvider.credential(idToken);
await auth().currentUser.linkWithCredential(googleCredential);
```
Firebase 레벨에서는 단순. 그러나 **백엔드가 자체 JWT 시스템**이므로 여기서부터 복잡해짐.

### 3-2. 현재 아키텍처에서의 연동 복잡성

```
문제: 백엔드는 Firebase UID를 직접 다루지 않음.
      익명 유저 A와 구글 유저 B가 연동될 때 백엔드에서 어떻게 처리?
```

**시나리오별 처리 필요:**

| 케이스 | 상황 | 처리 방법 |
|--------|------|-----------|
| A | 익명 → 구글 연동 (해당 구글 계정이 신규) | 익명 userId에 구글 정보 병합 |
| B | 익명 → 구글 연동 (해당 구글 계정이 이미 존재) | 데이터 충돌 해결 필요 (어느 데이터 우선?) |
| C | 연동 도중 실패 | 롤백 처리 |

**케이스 B가 핵심 난관:**
- 익명 유저로 7일간 답변을 작성함
- 이미 구글 계정으로 3일 전에 가입한 기록 있음
- 연동 시 어느 쪽 데이터를 살리나?

→ 이 정책 결정 + 구현이 복잡성의 80%를 차지함.

### 3-3. 연동 흐름 전체 다이어그램

```
[익명 사용자 (Firebase UID: anon_xxx, 백엔드 userId: 1)]
        ↓ "구글로 계속하기" 버튼 탭
[Firebase linkWithCredential()]
        ↓ 성공 → Firebase UID가 google_xxx로 업데이트
[백엔드 POST /api/v1/auth/link-google { idToken, anonymousToken }]
        ↓
[백엔드: 구글 계정 기존 존재 확인]
    ├── 신규 → 익명 userId에 구글 정보 추가, 새 JWT 발급
    └── 기존 존재 → 409 Conflict or 데이터 머지 정책 실행
        ↓
[클라이언트: 새 JWT 저장, isAnonymous=false 업데이트]
```

### 3-4. 추가 엣지 케이스들

1. **앱 삭제 후 재설치**: 익명 Firebase UID는 사라짐 → 익명 데이터 복구 불가
2. **여러 기기**: 익명 로그인은 기기별로 다른 UID → 동기화 불가
3. **연동 취소**: 연동 중 취소 시 일부 완료된 상태 처리
4. **토큰 만료 중 연동**: 연동 도중 JWT 만료 시 처리

---

## 4. 종합 권고

### 도입 권고 여부

| 시나리오 | 권고 |
|----------|------|
| 익명 로그인만 (연동 없음) | 조건부 권고 - 단순하지만 데이터 손실 위험 |
| 익명 → 구글 연동 포함 | 비권고 - 복잡성 대비 효과 불분명 |
| 그냥 구글 로그인 유지 | 현재 가장 단순하고 안정적 |

### 대안 고려

**"게스트 체험 모드" (로그인 없이 둘러보기)**
- Firebase 익명 로그인 없이, 로컬 상태로만 제한적 기능 제공
- 답변 저장/이력 없음, 질문 보기만 가능
- 백엔드 변경 최소화, 연동 복잡성 없음
- "저장하려면 로그인하세요" 유도 → 전환율에 유리할 수 있음

---

## 결론

- 익명 로그인 **자체 구현**: 중간 복잡성, iOS 허용됨
- 익명 → 구글 **연동**: 높은 복잡성, 특히 케이스 B (기존 계정 충돌) 처리가 핵심
- 현재 백엔드가 Firebase Auth를 직접 다루지 않는 구조여서 **백엔드 변경량이 예상보다 큼**
- 사용자 경험상 이점보다 엣지 케이스 버그 리스크가 클 수 있음
