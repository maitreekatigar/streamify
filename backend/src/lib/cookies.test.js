import test from "node:test";
import assert from "node:assert/strict";
import { authCookieOptions } from "./cookies.js";

test("localhost ports stay a lax cookie so local login works over http", () => {
  const options = authCookieOptions({
    get: (name) => (name === "origin" ? "http://localhost:43123" : undefined),
    hostname: "localhost",
    headers: {},
    secure: false,
  });

  assert.equal(options.sameSite, "lax");
  assert.equal(options.secure, false);
  assert.equal(options.httpOnly, true);
});

test("vercel calling render gets a cross-site secure cookie", () => {
  const options = authCookieOptions({
    get: (name) =>
      name === "origin" ? "https://streamify-topaz-chi.vercel.app" : undefined,
    hostname: "streamify-backend-p8x0.onrender.com",
    headers: { "x-forwarded-proto": "https" },
    secure: false,
  });

  assert.equal(options.sameSite, "none");
  assert.equal(options.secure, true);
});

test("127.0.0.1 calling localhost is cross-site", () => {
  const options = authCookieOptions({
    get: (name) => (name === "origin" ? "http://127.0.0.1:43123" : undefined),
    hostname: "localhost",
    headers: {},
    secure: false,
  });

  assert.equal(options.sameSite, "none");
  assert.equal(options.secure, true);
});

test("same host stays lax", () => {
  const options = authCookieOptions({
    get: (name) => (name === "origin" ? "https://streamify.example" : undefined),
    hostname: "streamify.example",
    headers: { "x-forwarded-proto": "https" },
    secure: true,
  });

  assert.equal(options.sameSite, "lax");
  assert.equal(options.secure, true);
});
