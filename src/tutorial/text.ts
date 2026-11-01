/** Reveal complete Thai graphemes, never a detached vowel or tone mark. */
export function segmentDialogue(text: string): string[] {
  if (typeof Intl.Segmenter === 'function')
    return Array.from(
      new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text),
      (part) => part.segment
    )
  const result: string[] = []
  for (const character of text) {
    if (/\p{Mark}/u.test(character) && result.length) result[result.length - 1] += character
    else result.push(character)
  }
  return result
}
