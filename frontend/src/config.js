// Allow overriding via Vite env var VITE_API for flexible deployment targets.
// In local dev we default to the backend on port 5001; in production we prefer
// an explicit env var and otherwise fall back to same-origin relative requests.
const DEFAULT_DEV_API = "http://localhost:5001";

export const API = (
  import.meta.env.VITE_API ||
  (import.meta.env.DEV ? DEFAULT_DEV_API : "")
).replace(/\/$/, "");
