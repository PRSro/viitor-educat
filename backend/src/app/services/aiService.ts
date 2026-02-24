// Native fetch used

/**
 * AI Service for generating educational content
 * Uses GitHub Models API (OpenAI-compatible)
 */
export class AiService {
    private static readonly API_URL = 'https://models.inference.ai.azure.com';
    private static readonly MODEL = 'gpt-4o-mini';

    /**
     * Generates flashcards from a given text content
     */
    static async generateFlashcards(content: string, count: number = 5): Promise<{ question: string, answer: string }[]> {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN is not configured');
        }

        const prompt = `
      You are an expert educator. Based on the following educational content, generate exactly ${count} flashcards.
      Each flashcard should have a clear, concise question and a detailed but concise answer.
      
      Format your response as a JSON array of objects with "question" and "answer" properties.
      Do not include any other text or markdown formatting (like keep it raw JSON).
      
      CONTENT:
      ${content}
    `;

        try {
            const response = await fetch(`${this.API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant that generates educational flashcards in JSON format.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                const error = await response.json() as any;
                throw new Error(`AI API error: ${error?.message || response.statusText}`);
            }

            const data = await response.json() as any;
            const result = JSON.parse(data.choices[0].message.content);

            // Handle cases where AI wraps the array in a property like "flashcards"
            if (Array.isArray(result)) return result;
            if (result.flashcards && Array.isArray(result.flashcards)) return result.flashcards;

            return [];
        } catch (error) {
            console.error('Flashcard generation failed:', error);
            throw error;
        }
    }
}
