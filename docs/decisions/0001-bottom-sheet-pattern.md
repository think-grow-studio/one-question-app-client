# ADR 0001: Bottom Sheet 패턴 — `@gorhom/bottom-sheet` 미사용

- **Status**: Accepted
- **Date**: 2026-04-30

## 문제

iOS에서 sheet/dialog dismiss 후 화면 터치가 먹통이 되는 race condition 버그 발견. 원인은 custom `<Modal>` 패턴의 `if (!visible) return null` 조기 리턴이 Modal을 언마운트시켜 iOS UIViewController native dismiss 사이클을 끊는 것.

해결 방향 검토:
1. **`@gorhom/bottom-sheet` 마이그레이션** — `PROJECT_ARCHITECTURE.md` Section 1.6 권장
2. **visible-gate 패턴** — `if (!visible) return null` 제거 + 자식 컨텐츠를 `{visible && (...)}`로 감싸기

## 시도와 발견

gorhom 마이그레이션 시도 → 두 가지 주요 충돌 발견:

1. **TimePickerSheet (wheel picker)** — gorhom의 vertical drag(시트 dismiss) 제스처와 wheel의 vertical scroll이 충돌. wheel을 위아래로 돌리려 하면 시트가 같이 움직임.
2. **ReloadOptionSheet (후보 ScrollView)** — 시트 안 nested ScrollView가 gorhom 안에서 인식 불가, 스크롤 자체가 동작 안 함.

`BottomSheetScrollView`로 바꿔도 마찬가지 (이건 시트 메인 스크롤용이라 작은 contained scroll엔 부적합).

추가로:
- 일부만 gorhom, 나머지는 custom Modal로 혼재 → 유지보수 시 패턴 헷갈림
- 매 sheet마다 두 패턴 중 어느 쪽인지 파악해야 함

## 결정

**모든 sheet/dialog 컴포넌트를 RN `<Modal>` + visible-gate 패턴으로 통일.**

- `if (!visible) return null` 조기 리턴 제거
- Modal은 항상 mount, 자식 컨텐츠만 `{visible && (...)}`로 게이트
- iOS dismiss race condition 해결됨 (Modal이 언마운트되지 않으니 native dismiss 정상 처리)

대상 컴포넌트 (6개):
- `ReloadOptionSheet`, `TimePickerSheet`, `DatePickerSheet`, `LanguagePicker` (bottom sheet 형태)
- `AlertDialog`, `ReviewPromptDialog` (centered alert 형태)

## 결과

- ✅ iOS dismiss race 버그 해결
- ✅ 6개 컴포넌트 동일 패턴 — 일관성, 유지보수 단순
- ⚠️ Architecture 문서 Section 1.6 권장과 불일치 → 이 ADR로 명시
- ⚠️ Tech debt: 각 sheet이 backdrop/animation/PanResponder를 개별 구현 → 코드 중복

## 향후 재고려 시점

다음 중 하나라도 해당되면 gorhom 재검토:
1. 새로 만드는 sheet이 nested scroll/wheel 같은 gesture 충돌 요소가 없을 때 (단순 sheet) — gorhom 부분 도입 고려
2. UI thread 애니메이션 성능 차이가 사용자에게 체감될 만큼 문제일 때
3. 태블릿 지원이 추가되어 시트 너비/높이 캡이 필요할 때 (gorhom의 `containerStyle` 등 활용 가능)

단, 재도입 시 **혼재 패턴은 피할 것**. 한 번에 모두 마이그레이션하든지, 아예 gorhom 안 쓰든지.
