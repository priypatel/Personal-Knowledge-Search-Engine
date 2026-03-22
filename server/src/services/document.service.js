import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { chunkText as doChunk } from '../utils/chunking.js';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Extract plain text from a file buffer based on its MIME type.
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function extractText(fileBuffer, mimeType) {
  let text = '';

  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(fileBuffer);
    text = parsed.text || '';
  } else if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    text = result.value || '';
  } else if (mimeType === 'text/plain') {
    text = fileBuffer.toString('utf-8');
  } else {
    throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  if (!text || !text.trim()) {
    throw new Error('Empty document');
  }

  return text;
}

/**
 * Split text into overlapping chunks.
 * @param {string} text
 * @returns {Array<{content: string, chunkIndex: number}>}
 */
export function chunkText(text) {
  return doChunk(text);
}
