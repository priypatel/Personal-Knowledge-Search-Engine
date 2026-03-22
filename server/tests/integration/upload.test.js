import { jest } from '@jest/globals';
import request from 'supertest';

// ─── Mock external dependencies (must be called before any dynamic imports) ──

// Prevent real DB connection
jest.unstable_mockModule('../../src/config/db.js', () => ({
  query: jest.fn(),
  pool: { on: jest.fn() },
}));

// Prevent real env validation
jest.unstable_mockModule('../../src/config/env.js', () => ({
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  PORT: '5001',
  NODE_ENV: 'test',
  GROQ_API_KEY: 'test-key',
  DEEPSEEK_API_KEY: null,
  GEMINI_API_KEY: null,
}));

// Mock embedding service — no ML model download
const mockGenerateEmbedding = jest
  .fn()
  .mockResolvedValue(new Array(384).fill(0.1));

jest.unstable_mockModule('../../src/services/embedding.service.js', () => ({
  generateEmbedding: mockGenerateEmbedding,
  generateEmbeddings: jest.fn().mockResolvedValue([]),
  loadModel: jest.fn().mockResolvedValue(undefined),
}));

// Mock suggestion service — no real LLM calls
const mockGenerateSuggestions = jest
  .fn()
  .mockResolvedValue([
    'What is this document about?',
    'What are the key points?',
    'How does this apply in practice?',
  ]);

jest.unstable_mockModule('../../src/services/suggestion.service.js', () => ({
  generateSuggestions: mockGenerateSuggestions,
}));

// Mock document repository — no real DB queries
const mockInsertDocument = jest.fn().mockResolvedValue({ id: 1 });
const mockUpdateDocumentStatus = jest.fn().mockResolvedValue(undefined);
const mockInsertChunk = jest.fn().mockResolvedValue(undefined);
const mockInsertSuggestion = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('../../src/repositories/document.repository.js', () => ({
  insertDocument: mockInsertDocument,
  updateDocumentStatus: mockUpdateDocumentStatus,
  insertChunk: mockInsertChunk,
  insertSuggestion: mockInsertSuggestion,
  getDocumentById: jest.fn(),
  getAllDocuments: jest.fn(),
  getSuggestionsByDocumentId: jest.fn(),
  getChunksByDocumentId: jest.fn(),
}));

// ─── App (loaded AFTER all mocks are registered) ─────────────────────────────

let app;

beforeAll(async () => {
  ({ default: app } = await import('../../src/app.js'));
});

beforeEach(() => {
  mockInsertDocument.mockClear();
  mockUpdateDocumentStatus.mockClear();
  mockInsertChunk.mockClear();
  mockInsertSuggestion.mockClear();
  mockGenerateEmbedding.mockClear();
  mockGenerateSuggestions.mockClear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/upload', () => {
  test('returns 400 when no file is attached', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 for unsupported file type', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('not a valid file'), {
        filename: 'malware.exe',
        contentType: 'application/octet-stream',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not supported/i);
  });

  test('returns 400 for empty TXT file', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('   '), {
        filename: 'empty.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  test('returns 200 with documentId and suggestions for valid TXT file', async () => {
    const content = `
      Knowbase is a personal knowledge search engine built with RAG.
      It processes documents and answers questions based on their content.
      The system uses vector embeddings to find relevant passages.
    `.trim();

    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(content), {
        filename: 'knowbase.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('documentId');
    expect(res.body).toHaveProperty('status', 'ready');
    expect(res.body).toHaveProperty('chunkCount');
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBe(3);
  });

  test('calls insertDocument once with correct filename', async () => {
    const content = 'This is enough text to be processed by the pipeline.';

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(content), {
        filename: 'myfile.txt',
        contentType: 'text/plain',
      });

    expect(mockInsertDocument).toHaveBeenCalledTimes(1);
    expect(mockInsertDocument.mock.calls[0][0]).toBe('myfile.txt');
  });

  test('marks document as ready on success', async () => {
    const content = 'Sufficient text content for processing by the pipeline.';

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(content), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    const statusCalls = mockUpdateDocumentStatus.mock.calls;
    const finalStatus = statusCalls[statusCalls.length - 1][1];
    expect(finalStatus).toBe('ready');
  });

  test('marks document as failed when embedding service throws', async () => {
    mockGenerateEmbedding.mockRejectedValueOnce(new Error('Embedding failed'));

    const content = 'Text content that will fail during embedding generation.';

    await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from(content), {
        filename: 'fail.txt',
        contentType: 'text/plain',
      });

    const statusCalls = mockUpdateDocumentStatus.mock.calls;
    const failStatus = statusCalls.find((call) => call[1] === 'failed');
    expect(failStatus).toBeDefined();
  });
});
