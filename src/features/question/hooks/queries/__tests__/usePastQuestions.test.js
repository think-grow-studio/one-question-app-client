import { QueryObserver, focusManager } from '@tanstack/react-query';
import { queryClient } from '@/platform/query/queryClient';
import { questionApi } from '../../../api/questionApi';
import { usePastQuestions, useFetchPastQuestions } from '../useQuestionQueries';

// React의 마운트 대신 훅이 넘기는 옵션으로 실제 QueryObserver를 붙인다. 조회 여부 판단은 실 구현이다.
jest.mock('react', () => ({ ...jest.requireActual('react'), useCallback: (fn) => fn }));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => require('@/platform/query/queryClient').queryClient,
  useQuery: (options) => options,
}));
jest.mock('../../../api/questionApi', () => ({ questionApi: { getPastQuestions: jest.fn() } }));

const date = '2026-11-15';
const response = {
  available: true, message: null,
  questions: [{ questionId: 7, content: 'past question', description: null, assignedDates: ['2025-11-15'], inCandidates: false }],
};
const mountSheet = (sheetDate = date) => {
  const observer = new QueryObserver(queryClient, usePastQuestions(sheetDate));
  const unsubscribe = observer.subscribe(() => {});
  return { observer, unsubscribe };
};
beforeEach(() => { jest.clearAllMocks(); questionApi.getPastQuestions.mockResolvedValue({ data: response }); });
afterEach(() => { queryClient.clear(); focusManager.setFocused(undefined); });

it('does not request past questions while the sheet is only mounted', () => {
  const sheets = [mountSheet(), mountSheet('2026-11-14')];

  expect(questionApi.getPastQuestions).not.toHaveBeenCalled();
  sheets.forEach(({ unsubscribe }) => unsubscribe());
});

it('does not refetch on app focus', async () => {
  // 포커스 이벤트는 QueryClientProvider 가 하는 mount() 이후에만 쿼리로 전달된다
  queryClient.mount();
  await useFetchPastQuestions()(date);
  const { unsubscribe } = mountSheet();

  focusManager.setFocused(false);
  focusManager.setFocused(true);
  // focus 핸들러는 resumePausedMutations 를 await 한 뒤 refetch 한다
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(questionApi.getPastQuestions).toHaveBeenCalledTimes(1);
  unsubscribe();
  queryClient.unmount();
});

it('shows the list fetched on tap and fetches again on every tap', async () => {
  const fetchPastQuestions = useFetchPastQuestions();
  const { observer, unsubscribe } = mountSheet();

  await fetchPastQuestions(date);
  expect(observer.getCurrentResult().data?.questions).toHaveLength(1);

  await fetchPastQuestions(date);
  expect(questionApi.getPastQuestions).toHaveBeenCalledTimes(2);
  unsubscribe();
});
