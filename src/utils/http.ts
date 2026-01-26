export const post = async (url: string, data: any, useBeacon = false): Promise<any> => {
    if (useBeacon && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return Promise.resolve(true);
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    return response.json();
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
