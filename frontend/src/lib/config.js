export function getApiBaseUrl() {
  if (import.meta.env.MODE === "development") {
    // Same origin as the Vite dev server. Requests to /api are proxied to the
    // API, so the app is only opened at http://localhost:5173.
    return "/api";
  }

  const configured = import.meta.env.VITE_API_URL || "";
  return configured.replace(/\/$/, "");
}

export function getSocketUrl() {
  const apiBase = getApiBaseUrl();
  if (apiBase.startsWith("/")) {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }

  const withoutApiPath = apiBase.replace(/\/api\/?$/, "");
  if (withoutApiPath) return withoutApiPath;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
