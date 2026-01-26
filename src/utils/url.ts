export const getUtmParams = (): Record<string, string> => {
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(window.location.search);

    searchParams.forEach((value, key) => {
        if (key.startsWith('utm_')) {
            params[key] = value;
        }
    });

    return params;
};
