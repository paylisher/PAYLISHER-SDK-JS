/**
 * Captures ALL URL query parameters for flexible campaign tracking
 *
 * Captures:
 * - UTM parameters (utm_source, utm_medium, utm_campaign, utm_term, utm_content)
 * - Platform click IDs (fbclid, gclid, ttclid, msclkid, twclid, etc.)
 * - Paylisher parameters (keyName, jid)
 * - Any custom tracking parameters
 *
 * @returns Record of all URL query parameters
 */
export const getUrlParams = (): Record<string, string> => {
    const params: Record<string, string> = {};

    if (typeof window === 'undefined' || !window.location) {
        return params;
    }

    const searchParams = new URLSearchParams(window.location.search);

    // Capture ALL query parameters for maximum flexibility
    searchParams.forEach((value, key) => {
        params[key] = value;
    });

    return params;
};

/**
 * @deprecated Use getUrlParams() instead. This function now captures all URL parameters, not just UTM.
 * Kept for backward compatibility.
 */
export const getUtmParams = getUrlParams;
