import { chunkText } from '../../../src/utils/chunking.js';

describe('chunkText', () => {
  test('returns empty array for empty string', () => {
    expect(chunkText('')).toEqual([]);
  });

  test('returns empty array for whitespace-only string', () => {
    expect(chunkText('   ')).toEqual([]);
  });

  test('returns single chunk for short text', () => {
    const text = 'This is a short sentence. It fits in one chunk.';
    const result = chunkText(text);
    expect(result).toHaveLength(1);
    expect(result[0].chunkIndex).toBe(0);
    expect(result[0].content).toBeTruthy();
  });

  test('returns multiple chunks for long text', () => {
    // Generate ~2000 words to force multiple chunks (maxTokens=600 → maxWords≈461)
    const sentence = 'This is a test sentence that adds words to the text.';
    const longText = Array(50).fill(sentence).join(' ');
    const result = chunkText(longText, 600, 100);
    expect(result.length).toBeGreaterThan(1);
  });

  test('each chunk content is a non-empty string', () => {
    const sentence = 'Each sentence contributes words to the growing chunk.';
    const longText = Array(50).fill(sentence).join(' ');
    const result = chunkText(longText, 600, 100);
    result.forEach((chunk) => {
      expect(typeof chunk.content).toBe('string');
      expect(chunk.content.trim().length).toBeGreaterThan(0);
    });
  });

  test('chunk indices are sequential starting at 0', () => {
    const sentence = 'Adding many words to force multiple chunks to be created.';
    const longText = Array(50).fill(sentence).join(' ');
    const result = chunkText(longText, 600, 100);
    result.forEach((chunk, i) => {
      expect(chunk.chunkIndex).toBe(i);
    });
  });

  test('overlap: last words of chunk N appear at start of chunk N+1', () => {
    const sentence = 'Word one two three four five six seven eight nine ten.';
    const longText = Array(50).fill(sentence).join(' ');
    // maxTokens=200 → maxWords≈153; overlap=60 → overlapWords≈46
    const result = chunkText(longText, 200, 60);

    if (result.length >= 2) {
      const overlapWords = Math.floor(60 / 1.3); // 46
      const chunk0Words = result[0].content.split(/\s+/);
      const chunk1Words = result[1].content.split(/\s+/);

      // The FULL overlap region: last overlapWords of chunk0 === first overlapWords of chunk1
      const tailOfChunk0 = chunk0Words.slice(-overlapWords).join(' ');
      const headOfChunk1 = chunk1Words.slice(0, overlapWords).join(' ');
      expect(headOfChunk1).toBe(tailOfChunk0);
    }
  });
});
