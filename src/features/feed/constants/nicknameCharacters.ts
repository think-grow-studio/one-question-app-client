import type { ImageSourcePropType } from 'react-native';

export interface NicknameCharacter {
  readonly key: string;
  readonly ko: string;
  readonly en: string;
  readonly source: ImageSourcePropType;
}

// Server's ANIMALS_KO / ANIMALS_EN pools (site.one_question.api.publicquestion.domain.AnonymousNickname).
// Order matches the server arrays index-for-index so KO[i] ↔ EN[i] ↔ image key[i].
// Metro requires literal require() paths, so this registry cannot be computed.
export const NICKNAME_CHARACTERS: readonly NicknameCharacter[] = [
  { key: 'puppy',        ko: '강아지',   en: 'Puppy',     source: require('@/assets/images/nickname-character/puppy.png') },
  { key: 'cat',          ko: '고양이',   en: 'Cat',       source: require('@/assets/images/nickname-character/cat.png') },
  { key: 'rabbit',       ko: '토끼',     en: 'Rabbit',    source: require('@/assets/images/nickname-character/rabbit.png') },
  { key: 'squirrel',     ko: '다람쥐',   en: 'Squirrel',  source: require('@/assets/images/nickname-character/squirrel.png') },
  { key: 'hamster',      ko: '햄스터',   en: 'Hamster',   source: require('@/assets/images/nickname-character/hamster.png') },
  { key: 'fox',          ko: '여우',     en: 'Fox',       source: require('@/assets/images/nickname-character/fox.png') },
  { key: 'bear',         ko: '곰',       en: 'Bear',      source: require('@/assets/images/nickname-character/bear.png') },
  { key: 'panda',        ko: '판다',     en: 'Panda',     source: require('@/assets/images/nickname-character/panda.png') },
  { key: 'otter',        ko: '수달',     en: 'Otter',     source: require('@/assets/images/nickname-character/otter.png') },
  { key: 'penguin',      ko: '펭귄',     en: 'Penguin',   source: require('@/assets/images/nickname-character/penguin.png') },
  { key: 'duck',         ko: '오리',     en: 'Duck',      source: require('@/assets/images/nickname-character/duck.png') },
  { key: 'chick',        ko: '병아리',   en: 'Chick',     source: require('@/assets/images/nickname-character/chick.png') },
  { key: 'hedgehog',     ko: '고슴도치', en: 'Hedgehog',  source: require('@/assets/images/nickname-character/hedgehog.png') },
  { key: 'raccoon',      ko: '너구리',   en: 'Raccoon',   source: require('@/assets/images/nickname-character/raccoon.png') },
  { key: 'deer',         ko: '사슴',     en: 'Deer',      source: require('@/assets/images/nickname-character/deer.png') },
  { key: 'cheetah',      ko: '치타',     en: 'Cheetah',   source: require('@/assets/images/nickname-character/cheetah.png') },
  { key: 'koala',        ko: '코알라',   en: 'Koala',     source: require('@/assets/images/nickname-character/koala.png') },
  { key: 'kangaroo',     ko: '캥거루',   en: 'Kangaroo',  source: require('@/assets/images/nickname-character/kangaroo.png') },
  { key: 'giraffe',      ko: '기린',     en: 'Giraffe',   source: require('@/assets/images/nickname-character/giraffe.png') },
  { key: 'elephant',     ko: '코끼리',   en: 'Elephant',  source: require('@/assets/images/nickname-character/elephant.png') },
  { key: 'crocodile',    ko: '악어',     en: 'Crocodile', source: require('@/assets/images/nickname-character/crocodile.png') },
  { key: 'wolf',         ko: '늑대',     en: 'Wolf',      source: require('@/assets/images/nickname-character/wolf.png') },
  { key: 'tiger',        ko: '호랑이',   en: 'Tiger',     source: require('@/assets/images/nickname-character/tiger.png') },
  { key: 'lion',         ko: '사자',     en: 'Lion',      source: require('@/assets/images/nickname-character/lion.png') },
  { key: 'hippopotamus', ko: '하마',     en: 'Hippo',     source: require('@/assets/images/nickname-character/hippopotamus.png') },
  { key: 'mole',         ko: '두더지',   en: 'Mole',      source: require('@/assets/images/nickname-character/mole.png') },
  { key: 'owl',          ko: '올빼미',   en: 'Owl',       source: require('@/assets/images/nickname-character/owl.png') },
  { key: 'parrot',       ko: '앵무새',   en: 'Parrot',    source: require('@/assets/images/nickname-character/parrot.png') },
  { key: 'dolphin',      ko: '돌고래',   en: 'Dolphin',   source: require('@/assets/images/nickname-character/dolphin.png') },
  { key: 'octopus',      ko: '문어',     en: 'Octopus',   source: require('@/assets/images/nickname-character/octopus.png') },
];

// O(1) lookup tables — built once at module load.
export const CHARACTER_BY_KO: ReadonlyMap<string, NicknameCharacter> = new Map(
  NICKNAME_CHARACTERS.map((c) => [c.ko, c]),
);

export const CHARACTER_BY_EN_LOWER: ReadonlyMap<string, NicknameCharacter> = new Map(
  NICKNAME_CHARACTERS.map((c) => [c.en.toLowerCase(), c]),
);

export const CHARACTER_BY_KEY: ReadonlyMap<string, NicknameCharacter> = new Map(
  NICKNAME_CHARACTERS.map((c) => [c.key, c]),
);
