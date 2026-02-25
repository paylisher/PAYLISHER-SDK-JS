# Paylisher Web SDK

Paylisher Web SDK is a lightweight JavaScript SDK for analytics, deep link tracking, and deferred deep link attribution.

## Features

- Analytics event capture (`track`, `$pageview` auto-capture)
- User identification (`identify`)
- Deep Link Manager API
- Deferred deep link attribution (optional)
- URL parameter capture (UTM, fbclid, gclid, ttclid, custom params)

## Installation

```bash
npm install paylisher-web-sdk
```

## Quick Start

```ts
import Paylisher from 'paylisher-web-sdk';

Paylisher.init('YOUR_API_KEY', {
  dataStudioHost: 'https://your.paylisher.host',
  debug: false,
  deepLinkConfig: {
    captureDeepLinkEvents: true,
    autoHandleDeepLinks: true,
  },
  deferredDeepLinkConfig: {
    enabled: false,
  },
});
```

## Script Tag Usage (Self-hosted)

```html
<script src="https://your.sdk.host/paylisher.min.js"></script>
<script>
  window.paylisher.init('YOUR_API_KEY', {
    dataStudioHost: 'https://your.paylisher.host',
    deepLinkConfig: {
      captureDeepLinkEvents: true,
      autoHandleDeepLinks: true,
    },
  });
</script>
```

## Basic APIs

### Track events

```ts
Paylisher.track('purchase_completed', {
  amount: 99.99,
  currency: 'USD',
});
```

### Identify user

```ts
Paylisher.identify('user_12345');
```

### Track with user properties

```ts
Paylisher.track(
  'user_signed_up',
  { plan: 'pro' },
  { email: 'user@example.com' },
  { signup_date: '2026-02-25' },
);
```

## Deep Link Manager

### Configure

```ts
Paylisher.configureDeepLinks({
  captureDeepLinkEvents: true,
  autoHandleDeepLinks: true,
  authRequiredDestinations: ['wallet', 'profile'],
  pendingDeepLinkTimeoutSeconds: 300,
  debugLogging: false,
});
```

### Set handler

```ts
Paylisher.setDeepLinkHandler({
  paylisherDidReceiveDeepLink: (deepLink, requiresAuth) => {
    console.log('Deep link:', deepLink.destination, requiresAuth);
  },
  paylisherDeepLinkRequiresAuth: (deepLink, completion) => {
    // run auth flow then return result
    completion(true);
  },
  paylisherDeepLinkDidFail: (url, error) => {
    console.error('Deep link failed:', url.toString(), error?.message);
  },
});
```

### Handle manually

```ts
Paylisher.handleDeepLink('https://your.domain/campaign/CAMPAIGN_KEY?jid=JID_VALUE');
```

### Pending controls

```ts
if (Paylisher.hasPendingDeepLink()) {
  Paylisher.completePendingDeepLink();
}

Paylisher.clearPendingDeepLink();
Paylisher.cancelPendingDeepLink();
```

## Deferred Deep Link (optional)

Deferred deep link requires a campaign backend host.

```ts
Paylisher.init('YOUR_API_KEY', {
  dataStudioHost: 'https://your.paylisher.host',
  campaignHost: 'https://your.campaign.host',
  // optional: if endpoint is directly /v1/deferred-deeplink
  // deferredDeepLinkAPIHost: 'https://your.campaign.host/v1/deferred-deeplink',
  deferredDeepLinkConfig: {
    enabled: true,
    autoHandleDeepLink: true,
    attributionWindowMillis: 24 * 60 * 60 * 1000,
    additionalEventProperties: {
      environment: 'production',
    },
  },
});
```

### Record click intent (web)

```ts
await Paylisher.deferredDeepLink(
  'https://app.example.com/promo/summer',
  'summer-campaign-2026',
);
```

### Check match (callback style)

```ts
await Paylisher.checkDeferredDeepLink({
  onSuccess: (match) => {
    console.log('Deferred match:', match.url);
  },
  onNoMatch: () => {
    console.log('No deferred match');
  },
  onError: (error) => {
    console.error('Deferred error:', error.message);
  },
});
```

### Check match (direct response)

```ts
const result = await Paylisher.fetchDeferredDeeplink();
if (result?.matched) {
  console.log('Matched deeplink:', result.deeplink_url || result.url);
}
```

### Testing utility

```ts
await Paylisher.resetDeferredDeepLinkForTesting();
```

## Environment Variables (build-time)

```env
DATA_STUDIO_HOST=https://your.paylisher.host
CAMPAIGN_HOST=https://your.campaign.host
CAMPAIGN_RESOLVE_HOST=https://your.resolve.host
```

## Build

```bash
npm install
npm run build
```

Output files:

- `dist/paylisher.js`
- `dist/paylisher.min.js`
- `dist/paylisher.esm.js`
