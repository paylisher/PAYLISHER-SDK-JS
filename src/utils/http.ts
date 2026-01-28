export const post = async (url: string, data: any, useBeacon = false): Promise<any> => {
    // PostHog requires 'application/json' Content-Type
    // Note: Beacon API is not recommended for PostHog as it requires proper headers

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // PostHog requires application/json
            },
            body: JSON.stringify(data),
            keepalive: true, // Ensure request completes even if page unloads
            // Don't use mode: 'no-cors' - we need to see response status
        });

        if (!response.ok) {
            console.warn(`Paylisher: POST failed with status ${response.status}`);
        }

        return response;
    } catch (e) {
        console.warn('Paylisher: POST failed', e);
        return null;
    }
};

export const get = async (url: string): Promise<any> => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            keepalive: true,
        });

        if (!response.ok) {
            console.warn(`Paylisher: GET failed with status ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (e) {
        console.warn('Paylisher: GET failed', e);
        return null;
    }
};

export const getPublicIp = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        console.warn('Paylisher: Failed to get public IP', e);
        return 'unknown';
    }
};
