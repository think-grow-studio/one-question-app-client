# Reanimated 애니메이션 구현 가이드

## 사용 라이브러리

`react-native-reanimated` 전용 (RN Animated API 사용 금지)

### 핵심 API

| API | 용도 |
|---|---|
| `useSharedValue` | 애니메이션 값 선언 |
| `useAnimatedStyle` | 스타일에 값 연결 |
| `withTiming` | 지속시간 + easing 기반 애니메이션 |
| `withSequence` | 단계별 순서 제어 |
| `interpolate` | progress → position/scale/opacity 매핑 |
| `Extrapolation.CLAMP` | 범위 초과 방지 (진동 차단) |
| `Easing.out(Easing.cubic)` | 빠르게 출발 → 감속 정지 |
| `Easing.inOut(Easing.cubic)` | 가속 → 감속 (되돌아오는 움직임에 적합) |

### Spring 대신 Timing을 써야 하는 이유

`withSpring`은 damping이 낮으면 **underdamped** 상태가 되어 목표값 주변에서 진동이 발생한다.
이 진동이 `interpolate` keyframe을 역방향으로 통과하면 의도치 않은 phase(되돌아오는 느낌)가 생긴다.

`withTiming + Easing`은 진동이 없고 각 단계를 명확하게 제어할 수 있다.

---

## AI 프롬프트 템플릿

```
react-native-reanimated(withTiming, withSequence, interpolate)만 사용해서
[컴포넌트명] 애니메이션을 구현해줘.

트리거: [언제 발동되는지 — 예: mutation onSuccess 콜백]

동작:
  1단계 - [예: 팍 퍼짐, 200ms, Easing.out.cubic]
  2단계 - [예: 절반 모임, 150ms, Easing.inOut.cubic]
  3단계 - [예: 다시 퍼짐, 180ms, Easing.out.cubic]

페이드아웃: 전체 움직임 완료 후 opacity 0 (별도 withSequence)

조건:
- withSpring 금지 (진동 방지)
- interpolate에 Extrapolation.CLAMP 적용
- 텍스트/chip 등 정적 요소는 움직이지 말 것
- dot 여러 개인 경우 각 duration을 ±20ms 다르게 줘서 자연스럽게 어긋나게
```

---

## 실제 구현 예시: dot burst 애니메이션

**파일**: `src/features/question/components/QuestionLikePopLabel.tsx`

**동작**: chip 오른쪽 끝에서 5개 dot이 `\` 방향 부채꼴로 퍼짐 → 절반 모임 → 다시 퍼짐 → 페이드아웃

### 핵심 패턴

```tsx
// 1. progress shared value + 공유 opacity
const pos0 = useSharedValue(0);
const opa  = useSharedValue(0); // 모든 dot 공유

// 2. interpolate로 position/scale/opacity 분리
const s0 = useAnimatedStyle(() => ({
  transform: [
    { translateX: interpolate(pos0.value, [0, 1], [0, tx], Extrapolation.CLAMP) },
    { translateY: interpolate(pos0.value, [0, 1], [0, ty], Extrapolation.CLAMP) },
    { scale:      interpolate(pos0.value, [0, 0.12, 0.65], [0, 1.3, 1.0], Extrapolation.CLAMP) },
  ],
  opacity: opa.value,
}));

// 3. withSequence로 단계 명시
pos0.value = withSequence(
  withTiming(1,   { duration: 200, easing: Easing.out(Easing.cubic) }),   // 팍 퍼짐
  withTiming(0.5, { duration: 140, easing: Easing.inOut(Easing.cubic) }), // 모임
  withTiming(1,   { duration: 160, easing: Easing.out(Easing.cubic) }),   // 다시 퍼짐
);

// 4. opacity는 별도로 — 움직임 끝난 뒤 페이드아웃
opa.value = withSequence(
  withTiming(1, { duration: 40 }),
  withTiming(1, { duration: 500 }),
  withTiming(0, { duration: 180 }, (finished) => {
    if (finished) runOnJS(notifyDone)();
  }),
);
```

### dot 배치 팁

- 시작점은 `position: 'absolute'`로 chip 경계 바깥에 배치: `right: -sp(2)`
- 방향은 각도로 계산: 현재 방향을 θ도 회전하려면 `tx' = tx·cos(θ) - ty·sin(θ)`
- `overflow: 'visible'`을 chip에 명시해야 dot이 chip 바깥으로 나갈 수 있음
