# Backlog

## TODO

- PROJECT_ARCHITECTURE.md 기반으로
- 오버엔지니어링은 없지만 best practice대로 구현
- 카카오/당근/토스와 같이 깔끔하고 직관적인 UI로
- 반응형으로 구현

---

배너광고 -> 질문/답변 조회 + 답변 작성/수정에서 나오는지
답변하기에서 [작성완료] 버튼과 키패드 사이에 있는 공간이 무엇인지, 그 공간 사이로 버튼이 숨겨짐

언어 설정 변경 옵션
-> 현재: 한국어 locale 고정 (useLanguageStore language: 'ko')
-> 추후 개선 사항:
   1. 회원가입 시 기기 locale을 그대로 사용해서 서버에 전달 (현재는 ko-KR 고정)
   2. 설정 화면에서 한국어 / 영어 선택 가능하도록 LanguagePicker 활성화
      - 언어 변경 시 i18n.changeLanguage() + 서버 locale 업데이트 API 호출
      - 언어 변경 시 member 쿼리 캐시 invalidate 필요 (member.locale 갱신 반영)
      - 질문도 선택한 언어로 변경됨 (서버에서 처리)
   3. 인프라: LanguagePicker 컴포넌트, useUpdateLocaleMutation 훅 이미 구현됨
      → settings.tsx에 <LanguagePicker /> 추가하면 바로 활성화 가능

## DONE

(완료된 작업들)
