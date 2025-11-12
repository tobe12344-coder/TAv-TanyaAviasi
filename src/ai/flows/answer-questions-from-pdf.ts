'use server';

/**
 * @fileOverview An AI agent that answers questions based on the content of a PDF file.
 *
 * - answerQuestionsFromPdf - A function that handles the question answering process.
 * - AnswerQuestionsFromPdfInput - The input type for the answerQuestionsFromPdf function.
 * - AnswerQuestionsFromPdfOutput - The return type for the answerQuestionsFromPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The PDF document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to be answered based on the PDF content.'),
});
export type AnswerQuestionsFromPdfInput = z.infer<typeof AnswerQuestionsFromPdfInputSchema>;

const AnswerQuestionsFromPdfOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the PDF content.'),
});
export type AnswerQuestionsFromPdfOutput = z.infer<typeof AnswerQuestionsFromPdfOutputSchema>;

export async function answerQuestionsFromPdf(input: AnswerQuestionsFromPdfInput): Promise<AnswerQuestionsFromPdfOutput> {
  return answerQuestionsFromPdfFlow(input);
}

const pdfInsightsPrompt = ai.definePrompt({
  name: 'pdfInsightsPrompt',
  input: {schema: AnswerQuestionsFromPdfInputSchema},
  output: {schema: AnswerQuestionsFromPdfOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the content of a PDF document.

  Use the following PDF content to answer the question.
  PDF Content: {{media url=pdfDataUri contentType='application/pdf'}}

  Question: {{{question}}}

  Answer:`,
});

const answerQuestionsFromPdfFlow = ai.defineFlow(
  {
    name: 'answerQuestionsFromPdfFlow',
    inputSchema: AnswerQuestionsFromPdfInputSchema,
    outputSchema: AnswerQuestionsFromPdfOutputSchema,
  },
  async input => {
    const {output} = await pdfInsightsPrompt(input);
    return output!;
  }
);
