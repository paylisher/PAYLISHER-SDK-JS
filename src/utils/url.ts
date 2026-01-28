export const getUtmParams = (): Record<string, string> => {
    const params: Record<string, string> = {};

    if (typeof window === 'undefined' || !window.location) {
        return params;
    }

    const searchParams = new URLSearchParams(window.location.search);

    searchParams.forEach((value, key) => {
        if (key.startsWith('utm_')) {
            params[key] = value;
        }
        // Deeplink tracking params (added by redirect)
        if (key === 'keyName' || key === 'jid') {
            params[key] = value;
        }
    });

    return params;
};
