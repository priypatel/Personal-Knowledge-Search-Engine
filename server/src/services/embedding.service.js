import { pipeline } from '@xenova/transformers';

let embedder = null;

/**
 * Load the embedding model (singleton — loaded once per process).
 */
export async function loadModel() {
  if (!embedder) {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
}

/**
 * Generate a 384-dim embedding vector for the given text.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function generateEmbedding(text) {
  await loadModel();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Generate embeddings for multiple texts (batch).
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function generateEmbeddings(texts) {
  return Promise.all(texts.map((t) => generateEmbedding(t)));
}
