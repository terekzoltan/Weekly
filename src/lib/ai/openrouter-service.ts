export interface OpenRouterRequest {
    model: string;
    prompt: string;
    system?: string;
    temperature?: number;
    max_tokens?: number;
}

export interface OpenRouterResponse {
    id: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    model: string;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterService {
    private getApiKey(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('weekly_openrouter_key');
        }
        return null;
    }

    async generateCompletion(request: OpenRouterRequest): Promise<string> {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error("OpenRouter API Key not found. Please set it in Settings.");
        }

        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
                    'X-Title': 'Weekly Fractal Planner',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: request.model,
                    messages: [
                        ...(request.system ? [{ role: 'system', content: request.system }] : []),
                        { role: 'user', content: request.prompt }
                    ],
                    temperature: request.temperature || 0.7,
                    max_tokens: request.max_tokens,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data: OpenRouterResponse = await response.json();
            return data.choices[0]?.message?.content || '';

        } catch (error) {
            console.error('OpenRouter request failed:', error);
            throw error;
        }
    }
}

export const openRouterService = new OpenRouterService();
