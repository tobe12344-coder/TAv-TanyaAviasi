'use server';

/**
 * @fileOverview An AI agent that answers questions based on the content of a text file.
 *
 * - answerQuestionsFromText - A function that handles the question answering process.
 * - AnswerQuestionsFromTextInput - The input type for the answerQuestionsFromText function.
 * - AnswerQuestionsFromTextOutput - The return type for the answerQuestionsFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsFromTextInputSchema = z.object({
  textDataUri: z
    .string()
    .describe(
      "The text document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to be answered based on the text content.'),
});
export type AnswerQuestionsFromTextInput = z.infer<typeof AnswerQuestionsFromTextInputSchema>;

const AnswerQuestionsFromTextOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the text content.'),
});
export type AnswerQuestionsFromTextOutput = z.infer<typeof AnswerQuestionsFromTextOutputSchema>;

export async function answerQuestionsFromText(input: AnswerQuestionsFromTextInput): Promise<AnswerQuestionsFromTextOutput> {
  return answerQuestionsFromTextFlow(input);
}

const textInsightsPrompt = ai.definePrompt({
  name: 'textInsightsPrompt',
  input: {schema: AnswerQuestionsFromTextInputSchema},
  output: {schema: AnswerQuestionsFromTextOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the content of a text document.

  Use the following text content to answer the question.
  Text Content: {{media url=textDataUri contentType='text/plain'}}

  Question: {{{question}}}

  Answer:`,
});

const answerQuestionsFromTextFlow = ai.defineFlow(
  {
    name: 'answerQuestionsFromTextFlow',
    inputSchema: AnswerQuestionsFromTextInputSchema,
    outputSchema: AnswerQuestionsFromTextOutputSchema,
  },
  async input => {
    const {output} = await textInsightsPrompt(input);
    return output!;
  }
);
