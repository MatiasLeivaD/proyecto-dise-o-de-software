import { app } from "../src/app.ts";
import { database } from "../src/config/database.ts";
import { env } from "../src/config/env.ts";
import {
  consumeOAuthState,
  saveOAuthState,
} from "../src/repositories/oauthRepository.ts";
import { saveGoogleUser } from "../src/repositories/userRepository.ts";
import { createSession } from "../src/services/sessionService.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("protected endpoint rejects a missing session", async () => {
  const response = await app(new Request("http://localhost:8000/api/auth/me"));
  assert(response.status === 401, "Expected status 401.");
});

Deno.test("Google callback rejects an unbound state", async () => {
  const response = await app(
    new Request(
      "http://localhost:8000/api/auth/google/callback?state=invalid&code=invalid",
    ),
  );
  assert(response.status === 302, "Expected a redirect to sign-in.");
  assert(
    response.headers.get("location") ===
      `${env.frontendOrigin}/?authError=invalid_state`,
    "Invalid state was accepted.",
  );
  assert(
    !response.headers.get("set-cookie")?.includes("session="),
    "Invalid callback created a session.",
  );
});

Deno.test("OAuth state can be used only once and expires", () => {
  const state = crypto.randomUUID();
  const expiredState = crypto.randomUUID();
  saveOAuthState(state, "nonce", "verifier");
  assert(consumeOAuthState(state)?.nonce === "nonce", "Expected valid state.");
  assert(consumeOAuthState(state) === null, "State must be single-use.");

  saveOAuthState(expiredState, "nonce", "verifier");
  database.prepare("UPDATE oauth_states SET expires_at = 0 WHERE state = ?")
    .run(expiredState);
  assert(
    consumeOAuthState(expiredState) === null,
    "Expired state was accepted.",
  );
});

Deno.test("session survives requests and logout revokes it", async () => {
  const googleId = `test-${crypto.randomUUID()}`;
  const user = saveGoogleUser({
    googleId,
    email: "test@example.com",
    name: "Test User",
    picture: null,
  });

  try {
    const sameUser = saveGoogleUser({
      googleId,
      email: "updated@example.com",
      name: "Updated User",
      picture: null,
    });
    assert(sameUser.id === user.id, "Repeated login created another user.");

    const token = await createSession(user.id);
    const cookie = `session=${token}`;
    const authenticatedRequest = () =>
      new Request("http://localhost:8000/api/auth/me", {
        headers: { cookie },
      });

    const firstResponse = await app(authenticatedRequest());
    assert(firstResponse.status === 200, "Valid session was rejected.");
    const data = await firstResponse.json();
    assert(
      data.user.email === "updated@example.com",
      "Profile was not updated.",
    );
    const secondResponse = await app(authenticatedRequest());
    assert(secondResponse.status === 200, "Second request lost the session.");

    const blockedLogout = await app(
      new Request("http://localhost:8000/api/auth/logout", {
        method: "POST",
        headers: { cookie, origin: "http://untrusted.example" },
      }),
    );
    assert(
      blockedLogout.status === 403,
      "Logout accepted an untrusted origin.",
    );

    const logoutResponse = await app(
      new Request("http://localhost:8000/api/auth/logout", {
        method: "POST",
        headers: { cookie, origin: env.frontendOrigin },
      }),
    );
    assert(logoutResponse.status === 200, "Logout failed.");
    assert(
      (await app(authenticatedRequest())).status === 401,
      "Revoked session was accepted.",
    );

    const expiredToken = await createSession(user.id);
    database.prepare("UPDATE sessions SET expires_at = 0 WHERE user_id = ?")
      .run(user.id);
    const expiredResponse = await app(
      new Request("http://localhost:8000/api/auth/me", {
        headers: { cookie: `session=${expiredToken}` },
      }),
    );
    assert(expiredResponse.status === 401, "Expired session was accepted.");
  } finally {
    database.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  }
});
