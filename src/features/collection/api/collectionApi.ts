import { Letter, LettersResponse } from '../types/api';

/**
 * Mock data - simulates API response
 * In production, this will be replaced with actual API calls
 */
const MOCK_LETTERS: Letter[] = [
  {
    id: '1',
    date: '2024.12.20',
    question: '오늘 가장 감사했던 순간은 언제였나요?',
    category: '감사',
    answer:
      '아침에 창문을 열었을 때 따뜻한 햇살이 들어왔어요. 작은 순간이지만 정말 행복했습니다. 요즘 바쁘게 살면서 이런 순간들을 놓치고 있었는데, 오늘은 잠시 멈춰서 그 순간을 온전히 느낄 수 있었어요.',
  },
  {
    id: '2',
    date: '2024.12.19',
    question: '최근에 새롭게 시작한 것이 있나요?',
    category: '성장',
    answer:
      '요가를 시작했어요. 처음에는 몸이 너무 뻣뻣해서 힘들었는데, 3주차에 접어들면서 조금씩 변화를 느끼고 있습니다.',
  },
  {
    id: '3',
    date: '2024.12.18',
    question: '오늘 나에게 해주고 싶은 말은?',
    category: '마음',
    answer: '천천히 가도 괜찮아. 네 속도로 가면 돼.',
  },
  {
    id: '4',
    date: '2024.12.17',
    question: '오늘 가장 감사했던 순간은 언제였나요?',
    category: '감사',
    answer:
      '친구가 갑자기 연락해서 같이 저녁을 먹었어요. 요즘 혼자 있는 시간이 많았는데, 누군가와 이야기를 나누니 마음이 한결 가벼워졌습니다.',
  },
  {
    id: '5',
    date: '2024.12.16',
    question: '최근에 읽은 책이나 본 영화 중 기억에 남는 것은?',
    category: '문화',
    answer:
      "\'코스모스\'를 다시 읽고 있어요. 우주의 광활함 앞에서 일상의 고민들이 작아지는 느낌이 듭니다.",
  },
  {
    id: '6',
    date: '2024.12.15',
    question: '오늘 나에게 해주고 싶은 말은?',
    category: '마음',
    answer: '오늘도 잘 버텼어. 고생했어.',
  },
  {
    id: '7',
    date: '2024.12.14',
    question: '최근에 새롭게 시작한 것이 있나요?',
    category: '성장',
    answer:
      '매일 아침 10분씩 명상을 하기로 했어요. 아직은 잡념이 많지만, 그래도 하루를 시작하는 루틴이 생겨서 좋습니다.',
  },
];

/**
 * Fetch all letters
 * @returns Promise containing letters array
 */
export async function fetchLetters(): Promise<LettersResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    letters: MOCK_LETTERS,
    total: MOCK_LETTERS.length,
  };
}

/**
 * Fetch letter by ID
 * @param id - Letter ID
 * @returns Promise containing letter or undefined
 */
export async function fetchLetterById(id: string): Promise<Letter | undefined> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return MOCK_LETTERS.find((letter) => letter.id === id);
}
