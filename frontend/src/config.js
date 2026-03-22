// Allow overriding via Vite env var VITE_API for flexible dev ports.
// The local Charlie PC backend runs on port 5001 by default.
export const API = (import.meta.env.VITE_API || "http://localhost:5001").replace(/\/$/, "");
