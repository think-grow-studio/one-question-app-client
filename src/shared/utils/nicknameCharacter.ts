import type { ImageSourcePropType } from 'react-native';

import {
  CHARACTER_BY_EN_LOWER,
  CHARACTER_BY_KEY,
  CHARACTER_BY_KO,
  NICKNAME_CHARACTERS,
} from '@/shared/constants/nicknameCharacters';

// Server-issued anonymous nicknames follow the format "<adjective> <animal>"
// (see AnonymousNickname.java). We extract the animal token and resolve it
// against the KO/EN registry to pick the matching character image.

export function extractAnimalKey(nickname: string | null | undefined): string | null {
  if (!nickname) return null;

  // Fast path: last whitespace-separated token is the animal in the server format.
  const tokens = nickname.trim().split(/\s+/);
  const lastToken = tokens[tokens.length - 1] ?? '';

  const koHit = CHARACTER_BY_KO.get(lastToken);
  if (koHit) return koHit.key;

  const enHit = CHARACTER_BY_EN_LOWER.get(lastToken.toLowerCase());
  if (enHit) return enHit.key;

  // Defensive path: nickname might be reshaped upstream (e.g. punctuation,
  // composed strings). Scan the full string for any known animal token.
  for (const character of NICKNAME_CHARACTERS) {
    if (nickname.includes(character.ko)) return character.key;
  }
  const lowered = nickname.toLowerCase();
  for (const character of NICKNAME_CHARACTERS) {
    if (lowered.includes(character.en.toLowerCase())) return character.key;
  }

  return null;
}

// Deterministic fallback so the same nickname always renders the same character
// even when extraction fails (broken format, future locales, etc.).
function fallbackCharacterFor(nickname: string | null | undefined): ImageSourcePropType {
  const source = nickname ?? '';
  const sum = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return NICKNAME_CHARACTERS[sum % NICKNAME_CHARACTERS.length].source;
}

export function pickNicknameCharacter(nickname: string | null | undefined): ImageSourcePropType {
  const key = extractAnimalKey(nickname);
  if (key) {
    const matched = CHARACTER_BY_KEY.get(key);
    if (matched) return matched.source;
  }
  return fallbackCharacterFor(nickname);
}
