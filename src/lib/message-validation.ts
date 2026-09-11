export const USER_MESSAGE_LIMIT = 30;

const CJK_CHARACTER_PATTERN = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/g;

export function countUserMessage(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const cjkCharacters = trimmed.match(CJK_CHARACTER_PATTERN)?.length ?? 0;
  const spaceSeparatedText = trimmed.replace(CJK_CHARACTER_PATTERN, " ").trim();
  const words = spaceSeparatedText ? spaceSeparatedText.split(/\s+/).length : 0;
  return cjkCharacters + words;
}

export function validateUserMessage(value: string): { count: number; valid: boolean } {
  const count = countUserMessage(value);
  return { count, valid: count <= USER_MESSAGE_LIMIT };
}
