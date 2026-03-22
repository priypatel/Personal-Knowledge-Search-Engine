import { jest } from '@jest/globals';

const EMBEDDING_DIM = 384;
const mockEmbeddingData = new Float32Array(EMBEDDING_DIM).fill(0.1);

const mockEmbedder = jest.fn().mockResolvedValue({ data: mockEmbeddingData });
const mockPipeline = jest.fn().mockResolvedValue(mockEmbedder);

jest.unstable_mockModule('@xenova/transformers', () => ({
  pipeline: mockPipeline,
}));

let generateEmbedding, generateEmbeddings, loadModel;

beforeAll(async () => {
  ({ generateEmbedding, generateEmbeddings, loadModel } = await import(
    '../../../src/services/embedding.service.js'
  ));
});

beforeEach(() => {
  mockPipeline.mockClear();
  mockEmbedder.mockClear();
});

describe('generateEmbedding', () => {
  test('returns an array', async () => {
    const result = await generateEmbedding('hello world');
    expect(Array.isArray(result)).toBe(true);
  });

  test('returns array of length 384', async () => {
    const result = await generateEmbedding('test text');
    expect(result).toHaveLength(EMBEDDING_DIM);
  });

  test('is called with the provided text string', async () => {
    await generateEmbedding('specific text');
    expect(mockEmbedder).toHaveBeenCalledWith(
      'specific text',
      expect.objectContaining({ pooling: 'mean', normalize: true })
    );
  });
});

describe('loadModel singleton', () => {
  test('pipeline is only called once across multiple generateEmbedding calls', async () => {
    // Reset the module so embedder is null again
    jest.resetModules();

    const freshMockPipeline = jest.fn().mockResolvedValue(mockEmbedder);
    jest.unstable_mockModule('@xenova/transformers', () => ({
      pipeline: freshMockPipeline,
    }));

    const { generateEmbedding: freshGenerateEmbedding } = await import(
      '../../../src/services/embedding.service.js'
    );

    await freshGenerateEmbedding('first call');
    await freshGenerateEmbedding('second call');
    await freshGenerateEmbedding('third call');

    expect(freshMockPipeline).toHaveBeenCalledTimes(1);
  });
});

describe('generateEmbeddings', () => {
  test('returns array of arrays', async () => {
    const result = await generateEmbeddings(['text one', 'text two']);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    result.forEach((emb) => expect(Array.isArray(emb)).toBe(true));
  });
});
