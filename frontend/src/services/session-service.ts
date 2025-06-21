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
    private static cardCache: Record<string, CardDto[]> = {};
    private static fetchLocks: Record<string, Promise<void> | null> = {};
    private static readonly MIN_CACHE_SIZE = 5;

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

    private static async getCards(sessionId: string): Promise<CardDto[]> {
        const response = await fetch(SessionService.createApiUrl(`/sessions/${sessionId}/cards`));
        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }
        return response.json();
    }

    private static _ensureCards(sessionId: string): Promise<void> {
        if (!SessionService.fetchLocks[sessionId]) {
            SessionService.fetchLocks[sessionId] = (async () => {
                try {
                    const newCards = await SessionService.getCards(sessionId);
                    if (!SessionService.cardCache[sessionId]) {
                        SessionService.cardCache[sessionId] = [];
                    }
                    SessionService.cardCache[sessionId].push(...newCards);
                } finally {
                    SessionService.fetchLocks[sessionId] = null;
                }
            })();
        }

        return SessionService.fetchLocks[sessionId]!;
    }

    public static async getCard(sessionId: string): Promise<CardDto> {
        // If cache empty or uninitialized, load cards before proceeding.
        if (!SessionService.cardCache[sessionId]?.length) {
            await SessionService._ensureCards(sessionId);
        }

        // At this point there must be at least one card.
        const card = SessionService.cardCache[sessionId].shift()!;

        // If we’ve dipped below the minimum threshold, start an async refill.
        if (SessionService.cardCache[sessionId].length < SessionService.MIN_CACHE_SIZE) {
            SessionService._ensureCards(sessionId).catch(err => {
                console.error(`Error replenishing cards for session ${sessionId}:`, err);
            });
        }

        return card;
    }
}