function hostnameOf(value) {
  if (!value) return "";
  try {
    if (value.includes("://")) return new URL(value).hostname.toLowerCase();
    return String(value).split(":")[0].toLowerCase();
  } catch {
    return "";
  }
}

// The UI and API are deployed on different sites (Vercel and Render).
// A SameSite=Lax cookie is not sent on those cross-site API calls, so login
// succeeds and the next request looks logged out. Cross-site needs None + Secure.
// Localhost ports are the same site, so Lax stays correct for local development.
export function authCookieOptions(req) {
  const origin = req.get?.("origin") || req.headers?.origin || "";
  const originHost = hostnameOf(origin);
  const requestHost = (req.hostname || hostnameOf(req.headers?.host || "")).toLowerCase();
  // localhost and 127.0.0.1 are different sites in the browser, even though both
  // are loopback. Only an identical host can use a Lax cookie.
  const crossSite = Boolean(originHost) && originHost !== requestHost;
  const forwardedHttps = req.headers?.["x-forwarded-proto"] === "https";
  const secure = crossSite || Boolean(req.secure) || forwardedHttps;

  return {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: crossSite ? "none" : "lax",
    secure: crossSite ? true : secure,
  };
}

export function clearAuthCookie(res, req) {
  const { maxAge, ...options } = authCookieOptions(req);
  res.clearCookie("jwt", options);
}
