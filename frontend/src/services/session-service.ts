const apiUrl = import.meta.env.VITE_API_URL;

interface SessionDto {
    id: string;
    created_at: string;
    themes: string[];
    birth_years: number[];
}

interface CardDto {
    person: string;
    world: string;
    object: string;
    action: string;
    nature: string;
}

export default class SessionService {
    private static createApiUrl(endpoint: string): string {
        if (!apiUrl) {
            throw new Error('API URL is not defined');
        }
        return `${apiUrl}${endpoint}`;
    }

    public static async createSession(
        ages: number[],
        topics: string[]
    ): Promise<SessionDto> {
        const birth_years = ages.map(age => new Date().getFullYear() - age);

        const response = await fetch(SessionService.createApiUrl('/sessions'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                birth_years,
                themes: topics
            })

        });

        if (!response.ok) {
            throw new Error('Failed to create session');
        }

        return response.json();
    }

    public static async getSession(sessionId: string): Promise<SessionDto> {
        const response = await fetch(SessionService.createApiUrl(`/sessions/${sessionId}`));

        if (!response.ok) {
            throw new Error('Failed to fetch session');
        }

        return response.json();
    }

    public static async getCards(sessionId: string): Promise<CardDto[]> {
        const response = await fetch(SessionService.createApiUrl(`/sessions/${sessionId}/cards`));

        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }

        return response.json();
    }
}