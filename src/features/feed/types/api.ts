import type { AnswerPostFeedItemDto } from '@/shared/types/api';

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

export function fromAnswerPostFeedItemDto(dto: AnswerPostFeedItemDto): FeedItemDomain {
  return {
    answerPostId: dto.answerPostId,
    questionContent: dto.questionContent,
    questionDescription: dto.description,
    answerContent: dto.answerContent,
    anonymousNickname: dto.anonymousNickname,
    postedAt: dto.postedAt,
    likeCount: dto.likeCount,
    liked: dto.liked,
    mine: dto.mine,
  };
}
