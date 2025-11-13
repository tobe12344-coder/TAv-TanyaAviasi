'use server';
/**
 * @fileOverview A flow for indexing text content into Firestore for vector search.
 *
 * - indexText - A function to process and index the text.
 * - IndexTextInput - The input type for the indexText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {adminDb} from '@/firebase/admin-config';
import {split} from 'sentence-splitter';

const IndexTextInputSchema = z.object({
  textDataUri: z
    .string()
    .describe(
      "The text document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IndexTextInput = z.infer<typeof IndexTextInputSchema>;

const TextChunkSchema = z.object({
  text: z.string(),
  embedding: z.array(z.number()),
});

// We are not exporting this as it's not meant to be called directly from the client.
// It will be called by our indexing trigger logic.
const indexTextFlow = ai.defineFlow(
  {
    name: 'indexTextFlow',
    inputSchema: IndexTextInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const text = Buffer.from(
      input.textDataUri.split(',')[1],
      'base64'
    ).toString('utf-8');

    const sentences = split(text).filter(s => s.type === 'Sentence').map(s => s.raw);

    const chunks: string[] = [];
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > 500) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += " " + sentence;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    const embeddingModel = ai.model('googleai/embedding-004');
    
    const chunksWithEmbeddings = await Promise.all(
        chunks.map(async (chunkText) => {
            const { embedding } = await embeddingModel.embed(chunkText);
            return {
                text: chunkText,
                embedding: embedding,
            };
        })
    );

    const collection = adminDb.collection('handbook_embeddings');
    const batch = adminDb.batch();

    // Clear existing documents
    const snapshot = await collection.get();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    // Add new documents
    chunksWithEmbeddings.forEach((chunk) => {
      const docRef = collection.doc();
      batch.set(docRef, chunk);
    });

    await batch.commit();
    console.log(`Successfully indexed ${chunksWithEmbeddings.length} chunks.`);
  }
);


// This is the exported function that will trigger the flow.
export async function indexText(input: IndexTextInput): Promise<void> {
    await indexTextFlow(input);
}
