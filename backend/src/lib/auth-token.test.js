import assert from "node:assert/strict";
import test from "node:test";
import { tokenFromRequest } from "./auth-token.js";

test("authorization header wins over the shared cookie", () => {
  const token = tokenFromRequest({
    headers: { authorization: "Bearer tab-token" },
    cookies: { jwt: "other-tab-cookie" },
  });
  assert.equal(token, "tab-token");
});

test("cookie is used when this tab has not stored its own token", () => {
  const token = tokenFromRequest({
    headers: {},
    cookies: { jwt: "cookie-token" },
  });
  assert.equal(token, "cookie-token");
});

test("missing credentials return null", () => {
  assert.equal(tokenFromRequest({ headers: {}, cookies: {} }), null);
});
