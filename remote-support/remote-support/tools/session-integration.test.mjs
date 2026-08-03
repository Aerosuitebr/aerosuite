import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const port = 4200 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${port}`;
const operatorToken = "integration-test-token";
const server = spawn(process.execPath, ["tools/dev-server.mjs"], {
  cwd: new URL("../", import.meta.url),
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    AEROSUPPORT_OPERATOR_TOKEN: operatorToken,
    AEROSUPPORT_CONTROL_PLANE_URL: "",
    AEROSUPPORT_DB_PATH: ""
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverErrors = "";
server.stderr.setEncoding("utf8");
server.stderr.on("data", chunk => serverErrors += chunk);

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  let body = null;
  const text = await response.text();
  if (text) body = JSON.parse(text);
  return { response, body };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (server.exitCode !== null) throw new Error(`Servidor encerrou antes dos testes: ${serverErrors}`);
    try {
      const response = await fetch(`${baseUrl}/runtime-config.js`);
      if (response.ok) return;
    } catch {}
    await delay(50);
  }
  throw new Error("Servidor não iniciou dentro do prazo");
}

try {
  await waitForServer();

  const unauthorized = await request("/api/sessions", { method: "POST" });
  assert.equal(unauthorized.response.status, 401);

  const created = await request("/api/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${operatorToken}` }
  });
  assert.equal(created.response.status, 201);
  assert.match(created.body.code, /^\d{6}$/);
  assert.equal(created.body.status, "waiting");
  const { id, code } = created.body;

  const invitation = await request(`/api/sessions/code/${code}`);
  assert.equal(invitation.response.status, 200);
  assert.equal(invitation.body.id, id);

  const invalidConsent = await request(`/api/sessions/${id}/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions: ["control"] })
  });
  assert.equal(invalidConsent.response.status, 400);

  const consent = await request(`/api/sessions/${id}/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions: ["screen", "control", "unknown"] })
  });
  assert.equal(consent.response.status, 200);
  assert.deepEqual(consent.body.permissions, ["screen", "control"]);
  assert.equal(consent.body.status, "authorized");

  const invalidControlState = await request(`/api/sessions/${id}/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paused: "yes" })
  });
  assert.equal(invalidControlState.response.status, 400);

  const pause = await request(`/api/sessions/${id}/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paused: true })
  });
  assert.equal(pause.response.status, 200);
  assert.equal(pause.body.controlPaused, true);

  const resume = await request(`/api/sessions/${id}/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paused: false })
  });
  assert.equal(resume.response.status, 200);
  assert.equal(resume.body.controlPaused, false);

  const viewOnlyCreated = await request("/api/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${operatorToken}` }
  });
  const viewOnlyId = viewOnlyCreated.body.id;
  const viewOnlyConsent = await request(`/api/sessions/${viewOnlyId}/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions: ["screen"] })
  });
  assert.equal(viewOnlyConsent.response.status, 200);
  const unauthorizedControl = await request(`/api/sessions/${viewOnlyId}/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paused: true })
  });
  assert.equal(unauthorizedControl.response.status, 403);

  const signal = await request(`/api/sessions/${id}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "agent", kind: "ice", payload: { candidate: "test-candidate" } })
  });
  assert.equal(signal.response.status, 202);
  assert.equal(signal.body.accepted, true);

  let latestSignal;
  for (let sequence = 2; sequence <= 105; sequence++) {
    latestSignal = await request(`/api/sessions/${id}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: "agent", kind: "ice", payload: { candidate: `candidate-${sequence}` } })
    });
    assert.equal(latestSignal.response.status, 202);
  }
  assert.equal(latestSignal.body.sequence, 105);

  const ended = await request(`/api/sessions/${id}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "customer" })
  });
  assert.equal(ended.response.status, 200);
  assert.equal(ended.body.status, "ended");

  const audit = await request(`/api/sessions/${id}/audit`);
  assert.equal(audit.response.status, 200);
  assert.deepEqual(
    audit.body.events.map(event => event.type),
    ["session.created", "consent.granted", "control.paused", "control.resumed", "session.ended"]
  );
  assert.deepEqual(
    audit.body.events.map(event => event.sequence),
    [1, 2, 3, 4, 5]
  );

  const signalAfterEnd = await request(`/api/sessions/${id}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "agent", kind: "ice", payload: {} })
  });
  assert.equal(signalAfterEnd.response.status, 409);

  console.log("✓ ciclo integrado de sessão");
} finally {
  server.kill();
  if (server.exitCode === null) await Promise.race([once(server, "exit"), delay(2000)]);
}
