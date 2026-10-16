export function tokenFromRequest(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  return req.cookies?.jwt || null;
}
