import { jest } from '@jest/globals';

// Mock pdf-parse and mammoth BEFORE importing the service
jest.unstable_mockModule('pdf-parse', () => ({
  default: jest.fn().mockResolvedValue({ text: 'PDF extracted text content.' }),
}));

jest.unstable_mockModule('mammoth', () => ({
  default: {
    extractRawText: jest
      .fn()
      .mockResolvedValue({ value: 'DOCX extracted text content.' }),
  },
}));

let extractText, chunkText;

beforeAll(async () => {
  ({ extractText, chunkText } = await import(
    '../../../src/services/document.service.js'
  ));
});

describe('extractText', () => {
  test('returns string for PDF mime type', async () => {
    const buffer = Buffer.from('fake pdf bytes');
    const result = await extractText(buffer, 'application/pdf');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns string for DOCX mime type', async () => {
    const buffer = Buffer.from('fake docx bytes');
    const result = await extractText(
      buffer,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns string for TXT mime type', async () => {
    const buffer = Buffer.from('Hello, this is plain text.');
    const result = await extractText(buffer, 'text/plain');
    expect(result).toBe('Hello, this is plain text.');
  });

  test('throws Empty document for empty TXT', async () => {
    const buffer = Buffer.from('   ');
    await expect(extractText(buffer, 'text/plain')).rejects.toThrow(
      'Empty document'
    );
  });

  test('throws Empty document when extractor returns empty string', async () => {
    const { default: pdfParse } = await import('pdf-parse');
    pdfParse.mockResolvedValueOnce({ text: '' });
    const buffer = Buffer.from('fake pdf');
    await expect(extractText(buffer, 'application/pdf')).rejects.toThrow(
      'Empty document'
    );
  });
});

describe('chunkText', () => {
  test('returns array of chunks', () => {
    const text = 'This is a sentence. This is another sentence.';
    const result = chunkText(text);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('each chunk has content and chunkIndex', () => {
    const text = 'First sentence. Second sentence. Third sentence.';
    const result = chunkText(text);
    result.forEach((chunk) => {
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('chunkIndex');
      expect(typeof chunk.content).toBe('string');
      expect(typeof chunk.chunkIndex).toBe('number');
    });
  });
});
