export interface FeedItemDomain {
  answerPostId: number;
  questionContent: string;
  questionDescription: string | null;
  answerContent: string;
  anonymousNickname: string;
  postedAt: string;
  likeCount: number;
  liked: boolean;
  mine: boolean;
}

// =====================================================================
// 공개 일일 질문 (PublicDailyQuestion, PDQ) — "모두의 생각" 도메인
// 서버 스펙: /api/v1/public-questions/*
// =====================================================================

export interface PublicDailyQuestionDto {
  publicDailyQuestionId: number;
  questionId: number;
  content: string;
  description: string | null;
  questionDate: string; // YYYY-MM-DD
  myAnswer: PublicAnswerDto | null;
}

export interface PublicAnswerDto {
  publicDailyQuestionAnswerId: number;
  content: string;
  anonymousNickname: string;
  answeredAt: string; // YYYY-MM-DDTHH:mm:ss (LocalDateTime, 작성 timezone 기준)
  likeCount: number;
  liked: boolean;
}

// create / update 응답 — list/get 에 비해 likeCount, liked 누락.
export interface PublicAnswerWriteDto {
  publicDailyQuestionAnswerId: number;
  content: string;
  anonymousNickname: string;
  answeredAt: string;
}

// 무한 스크롤 커서. 서버 Instant 문자열을 파싱 없이 echo back.
export interface PublicAnswerCursor {
  answeredAt: string; // ISO-8601 Instant with Z
  id: number;
}

export interface PublicAnswerListDto {
  items: PublicAnswerDto[];
  hasNext: boolean;
  nextCursor: PublicAnswerCursor | null;
}

export interface ToggleLikeDto {
  liked: boolean;
}

// 도메인 모델 — 현재는 DTO 와 동일 형태. 추후 변환 필요 시 이 함수만 수정.
export type PublicAnswerDomain = PublicAnswerDto;

export function fromPublicAnswerDto(dto: PublicAnswerDto): PublicAnswerDomain {
  return { ...dto };
}

// PDQ 응답을 기존 AnswerCard / MyAnswerCard 가 기대하는 FeedItemDomain 으로 매핑.
// AnswerCard 등은 questionContent / mine 같은 필드를 표시에 쓰지 않지만 타입 호환을 위해 채움.
export function toFeedItemDomain(
  dto: PublicAnswerDto,
  context: { questionContent: string; questionDescription: string | null; mine: boolean },
): FeedItemDomain {
  return {
    answerPostId: dto.publicDailyQuestionAnswerId,
    questionContent: context.questionContent,
    questionDescription: context.questionDescription,
    answerContent: dto.content,
    anonymousNickname: dto.anonymousNickname,
    postedAt: dto.answeredAt,
    likeCount: dto.likeCount,
    liked: dto.liked,
    mine: context.mine,
  };
}
