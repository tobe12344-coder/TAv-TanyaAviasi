import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Mengonfigurasi Genkit.
// Plugin Google AI akan secara otomatis mencari GEMINI_API_KEY atau GOOGLE_API_KEY
// dari environment variables. Ini adalah cara yang lebih andal untuk produksi.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
