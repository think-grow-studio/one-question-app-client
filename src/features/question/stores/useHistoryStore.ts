import { create } from 'zustand';

interface QuestionHistoryItem {
  date: string; // YYYY-MM-DD
  question: string;
  description?: string;
  answer?: string;
}

interface HistoryStore {
  currentDate: string;
  history: QuestionHistoryItem[];
  isDatePickerVisible: boolean;
  setCurrentDate: (date: string) => void;
  setIsDatePickerVisible: (visible: boolean) => void;
  getQuestionByDate: (date: string) => QuestionHistoryItem | null;
  addQuestion: (date: string, question: string, description?: string) => void;
  addAnswer: (date: string, answer: string) => void;
}

const MOCK_HISTORY: QuestionHistoryItem[] = [
  {
    date: '2026-01-15',
    question: '올해 이루고 싶은 가장 큰 목표는 무엇인가요?',
    description: '작은 목표도 좋고, 큰 꿈도 좋아요.',
    answer: '건강한 습관을 만들고 꾸준히 운동하는 것. 몸과 마음이 건강해야 다른 것도 잘 할 수 있을 것 같아요.',
  },
  {
    date: '2026-01-14',
    question: '최근에 가장 뿌듯했던 일은 무엇인가요?',
    description: '아무리 작은 일이라도 괜찮아요.',
    answer: '미루던 프로젝트를 드디어 완성한 것! 오래 걸렸지만 끝까지 해냈다는 게 뿌듯했어요.',
  },
  {
    date: '2026-01-13',
    question: '당신에게 휴식이란 무엇인가요?',
    description: '나만의 휴식 방법을 떠올려 보세요.',
    answer: '좋아하는 음악을 들으며 산책하는 시간. 아무 생각 없이 걷다 보면 마음이 편해져요.',
  },
  {
    date: '2026-01-12',
    question: '가장 기억에 남는 여행지는 어디인가요?',
    description: '그곳에서의 특별한 순간을 떠올려 보세요.',
  },
  {
    date: '2026-01-11',
    question: '요즘 가장 관심있는 것은 무엇인가요?',
    description: '취미, 공부, 사람 등 무엇이든 좋아요.',
    answer: '새로운 언어를 배우는 것. 다른 문화를 이해하고 싶어서 시작했는데 생각보다 재밌어요.',
  },
  // 1월 3일 ~ 10일은 질문을 받지 못한 날 (데이터 없음)
  {
    date: '2026-01-02',
    question: '올해 처음으로 시도해보고 싶은 것이 있나요?',
    description: '새로운 도전을 생각해 보세요.',
    answer: '새로운 취미를 시작해보고 싶어요. 아직 뭘 할지는 정하지 못했지만 도전해보고 싶어요.',
  },
  {
    date: '2026-01-01',
    question: '새해 첫날, 어떤 마음으로 시작하고 싶나요?',
    description: '새해의 다짐을 적어보세요.',
    answer: '설레는 마음으로! 새로운 시작이니까 긍정적인 에너지로 가득 채우고 싶어요.',
  },
];

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  currentDate: '2026-01-02', // 가장 최근 데이터가 있는 날짜로 초기화
  history: MOCK_HISTORY,
  isDatePickerVisible: false,
  setCurrentDate: (date) => set({ currentDate: date }),
  setIsDatePickerVisible: (visible) => set({ isDatePickerVisible: visible }),
  getQuestionByDate: (date) => {
    const { history } = get();
    return history.find((item) => item.date === date) || null;
  },
  addQuestion: (date, question, description) =>
    set((state) => ({
      history: [...state.history, { date, question, description }],
    })),
  addAnswer: (date, answer) =>
    set((state) => ({
      history: state.history.map((item) =>
        item.date === date ? { ...item, answer } : item
      ),
    })),
}));
