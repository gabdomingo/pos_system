// Allow overriding via Vite env var VITE_API for flexible dev ports
export const API = import.meta.env.VITE_API || "http://localhost:5000";
