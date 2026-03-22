import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../../src/config/db.js', () => ({
  query: mockQuery,
  pool: { connect: jest.fn(), on: jest.fn() },
}));

let similaritySearch;

beforeAll(async () => {
  ({ similaritySearch } = await import('../../../src/services/search.service.js'));
});

beforeEach(() => {
  mockQuery.mockReset();
});

const fakeRow = {
  chunk_id: 1,
  document_id: 2,
  document_name: 'notes.pdf',
  content: 'Relevant content here.',
  chunk_index: 0,
  similarity: 0.87,
};

const makeVector = () => new Array(384).fill(0.1);

describe('similaritySearch', () => {
  test('returns array of chunks with correct shape', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

    const results = await similaritySearch(makeVector());

    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toEqual({
      chunkId: 1,
      documentId: 2,
      documentName: 'notes.pdf',
      content: 'Relevant content here.',
      chunkIndex: 0,
      similarity: 0.87,
    });
  });

  test('returns at most 5 results', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ ...fakeRow, chunk_id: i + 1 }));
    mockQuery.mockResolvedValueOnce({ rows });

    const results = await similaritySearch(makeVector());

    expect(results.length).toBeLessThanOrEqual(5);
  });

  test('each result has chunkId, documentId, documentName, content, similarity', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

    const [result] = await similaritySearch(makeVector());

    expect(result).toHaveProperty('chunkId');
    expect(result).toHaveProperty('documentId');
    expect(result).toHaveProperty('documentName');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('similarity');
  });

  test('returns empty array when no chunks in DB', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const results = await similaritySearch(makeVector());

    expect(results).toEqual([]);
  });

  test('calls query with correct SQL and pgvector parameter format', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const vec = makeVector();
    await similaritySearch(vec);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/document_chunks/);
    expect(sql).toMatch(/<=> \$1::vector/);
    expect(sql).toMatch(/LIMIT 5/);
    expect(params[0]).toBe('[' + vec.join(',') + ']');
  });

  test('scopes query to documentId when provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [fakeRow] });

    const vec = makeVector();
    await similaritySearch(vec, 2);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/WHERE dc\.document_id = \$2/);
    expect(params[1]).toBe(2);
  });

  test('does not add WHERE clause when documentId is null', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const vec = makeVector();
    await similaritySearch(vec, null);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).not.toMatch(/WHERE/);
    expect(params.length).toBe(1);
  });
});
