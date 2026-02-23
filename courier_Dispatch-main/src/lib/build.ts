// Build identifier injected at build time via Vite `define`.
// Used for cache/debug and deployment freshness checks.

declare const __APP_BUILD_ID__: string;

export const APP_BUILD_ID = __APP_BUILD_ID__;
export const APP_BUILD_ID_SHORT = __APP_BUILD_ID__.slice(-6);
