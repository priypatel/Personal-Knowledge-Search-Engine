/**
 * Split text into overlapping chunks for vector embedding.
 *
 * @param {string} text - Input text
 * @param {number} maxTokens - Approximate max tokens per chunk (1 word ≈ 1.3 tokens)
 * @param {number} overlap - Approximate overlap in tokens between adjacent chunks
 * @returns {Array<{content: string, chunkIndex: number}>}
 */
export function chunkText(text, maxTokens = 600, overlap = 100) {
  if (!text || !text.trim()) return [];

  const maxWords = Math.floor(maxTokens / 1.3);   // ≈ 461 words
  const overlapWords = Math.floor(overlap / 1.3);  // ≈ 76 words

  // Split into sentences on '. ', '? ', '! '
  const sentences = text
    .trim()
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) return [];

  const chunks = [];
  let currentWords = [];

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter((w) => w.length > 0);

    // Flush current chunk if adding this sentence would exceed maxWords
    if (currentWords.length > 0 && currentWords.length + sentenceWords.length > maxWords) {
      chunks.push({
        content: currentWords.join(' '),
        chunkIndex: chunks.length,
      });

      // Carry last overlapWords words into the next chunk
      currentWords = currentWords.slice(-overlapWords);
    }

    currentWords.push(...sentenceWords);
  }

  // Final chunk
  if (currentWords.length > 0) {
    chunks.push({
      content: currentWords.join(' '),
      chunkIndex: chunks.length,
    });
  }

  return chunks;
}
