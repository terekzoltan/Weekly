export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

export interface OllamaRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    system?: string;
    options?: {
        temperature?: number;
        num_predict?: number;
        top_k?: number;
        top_p?: number;
    };
}

const DEFAULT_BASE_URL = 'http://localhost:11434';

export class OllamaService {
    private baseUrl: string;

    constructor(baseUrl: string = DEFAULT_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async generateCompletion(request: OllamaRequest): Promise<OllamaResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stream: false, // Force non-streaming for now to simplify handling
                    ...request,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to generate completion from Ollama:', error);
            throw error;
        }
    }

    async generateEmbedding(prompt: string, model: string): Promise<number[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama Embedding API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.embedding;
        } catch (error) {
            console.error('Failed to generate embedding from Ollama:', error);
            throw error;
        }
    }

    async checkHealth(expectedModel?: string): Promise<{ ok: boolean; status: string; hasModel?: boolean }> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return { ok: false, status: 'offline' };

            const data = await response.json();
            const models = data.models || [];
            const hasModel = expectedModel ? models.some((m: any) => m.name.includes(expectedModel)) : true;

            return { ok: true, status: 'online', hasModel };
        } catch (error) {
            return { ok: false, status: 'offline' };
        }
    }

    async isReasoningModel(model: string): Promise<boolean> {
        // Simple heuristic check if model supports reasoning/thinking specific tokens if needed
        // For now, most models via Ollama API are treated similarly.
        return false;
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch (e) {
            return [];
        }
    }
}

export const ollamaService = new OllamaService();
