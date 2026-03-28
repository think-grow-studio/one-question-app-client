import type { FeedItemDto } from '@/shared/types/api';

export interface FeedItemDomain {
  feedId: number;
  dailyQuestionId: number;
  questionContent: string;
  questionDescription: string | null;
  answerContent: string;
  answeredAt: string;
  authorNickname: string;
  isLiked: boolean;
  likeCount: number;
}

export function fromFeedItemDto(dto: FeedItemDto): FeedItemDomain {
  return {
    feedId: dto.feedId,
    dailyQuestionId: dto.dailyQuestionId,
    questionContent: dto.questionContent,
    questionDescription: dto.questionDescription,
    answerContent: dto.answerContent,
    answeredAt: dto.answeredAt,
    authorNickname: dto.authorNickname,
    isLiked: dto.isLiked,
    likeCount: dto.likeCount,
  };
}
