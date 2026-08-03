import http from "node:http";
import https from "node:https";
import { readFile, stat } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { randomInt, randomUUID, timingSafeEqual } from "node:crypto";

const root = new URL("../apps/operator-console/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const port = Number(process.env.PORT || 4177);
const host = process.env.HOST || "127.0.0.1";
const controlPlaneUrl = process.env.AEROSUPPORT_CONTROL_PLANE_URL?.replace(/\/+$/, "");
const operatorToken = process.env.AEROSUPPORT_OPERATOR_TOKEN || "";
const databasePath = process.env.AEROSUPPORT_DB_PATH;
let iceServers = [];
try {
  iceServers = JSON.parse(process.env.AEROSUPPORT_ICE_SERVERS_JSON || "[]");
} catch {
  iceServers = [];
}
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};
const sessions = new Map();
const subscribers = new Map();
const codeAttempts = new Map();
let database = null;

if (databasePath) {
  const { DatabaseSync } = await import("node:sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)");
  for (const row of database.prepare("SELECT payload FROM sessions").all()) {
    const session = JSON.parse(row.payload);
    sessions.set(session.id, session);
  }
}

function persist(session) {
  if (!database) return;
  database.prepare("INSERT INTO sessions (id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
    .run(session.id, JSON.stringify(session), Date.now());
}

function validOperatorToken(request) {
  if (!operatorToken) return true;
  const supplied = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const expectedBuffer = Buffer.from(operatorToken);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function allowCodeAttempt(request) {
  const key = request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = codeAttempts.get(key);
  if (!current || now - current.startedAt > 5 * 60_000) {
    codeAttempts.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count++;
  return current.count <= 10;
}

function record(session, type, actor, details = {}) {
  const event = {
    sequence: session.events.length + 1,
    type,
    actor,
    at: Date.now(),
    details
  };
  session.events.push(event);
  persist(session);
  const listeners = subscribers.get(session.id);
  if (listeners) {
    const payload = `event: session\ndata: ${JSON.stringify({ session: publicSession(session), event })}\n\n`;
    for (const response of listeners) response.write(payload);
  }
  return event;
}

function broadcast(session, eventName, payload) {
  const listeners = subscribers.get(session.id);
  if (!listeners) return;
  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of listeners) response.write(message);
}

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64_000) throw new Error("Payload too large");
  }
  return body ? JSON.parse(body) : {};
}

function proxyApi(request, response) {
  const upstream = new URL(request.url || "/api", controlPlaneUrl);
  const transport = upstream.protocol === "https:" ? https : http;
  const proxyRequest = transport.request(upstream, {
    method: request.method,
    headers: {
      ...request.headers,
      ...(operatorToken ? { authorization: `Bearer ${operatorToken}` } : {}),
      host: upstream.host,
      connection: "keep-alive"
    }
  }, proxyResponse => {
    response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
    proxyResponse.pipe(response);
  });
  proxyRequest.on("error", () => json(response, 502, { error: "Servidor de sessões indisponível" }));
  request.pipe(proxyRequest);
}

function publicSession(session) {
  return {
    id: session.id,
    code: session.code,
    status: session.status,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    technician: session.technician,
    customer: session.customer,
    device: session.device,
    permissions: session.permissions || [],
    controlPaused: Boolean(session.controlPaused)
  };
}

function activeSession(id) {
  const session = sessions.get(id);
  if (!session) return null;
  if (session.status === "waiting" && Date.now() >= session.expiresAt) {
    session.status = "expired";
    persist(session);
  }
  return session;
}

async function handleApi(request, response, path) {
  if (request.method === "POST" && path === "/api/sessions") {
    if (!validOperatorToken(request)) return json(response, 401, { error: "Autenticação do técnico necessária" });
    let code;
    do code = String(randomInt(100000, 1000000)); while ([...sessions.values()].some(item => item.code === code && item.status === "waiting"));
    const now = Date.now();
    const session = {
      id: randomUUID(),
      code,
      status: "waiting",
      createdAt: now,
      expiresAt: now + 5 * 60_000,
      technician: { name: "Rafael Costa", organization: "AeroSuite Tecnologia", verified: true },
      customer: null,
      device: null,
      permissions: [],
      events: [],
      signals: []
    };
    sessions.set(session.id, session);
    record(session, "session.created", "technician", { expiresAt: session.expiresAt });
    json(response, 201, publicSession(session));
    return;
  }

  const eventsMatch = path.match(/^\/api\/sessions\/([^/]+)\/events$/);
  if (request.method === "GET" && eventsMatch) {
    const session = activeSession(eventsMatch[1]);
    if (!session) return json(response, 404, { error: "Sessão não encontrada" });
    response.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive"
    });
    response.write(`retry: 1500\nevent: session\ndata: ${JSON.stringify({ session: publicSession(session), event: null })}\n\n`);
    for (const signal of session.signals) {
      response.write(`event: signal\ndata: ${JSON.stringify(signal)}\n\n`);
    }
    const listeners = subscribers.get(session.id) || new Set();
    listeners.add(response);
    subscribers.set(session.id, listeners);
    const heartbeat = setInterval(() => response.write(": keep-alive\n\n"), 15_000);
    request.on("close", () => {
      clearInterval(heartbeat);
      listeners.delete(response);
      if (!listeners.size) subscribers.delete(session.id);
    });
    return;
  }

  const auditMatch = path.match(/^\/api\/sessions\/([^/]+)\/audit$/);
  if (request.method === "GET" && auditMatch) {
    const session = activeSession(auditMatch[1]);
    if (!session) return json(response, 404, { error: "Sessão não encontrada" });
    return json(response, 200, { sessionId: session.id, events: session.events });
  }

  const signalMatch = path.match(/^\/api\/sessions\/([^/]+)\/signal$/);
  if (request.method === "POST" && signalMatch) {
    const session = activeSession(signalMatch[1]);
    if (!session || !["waiting", "authorized"].includes(session.status)) return json(response, 409, { error: "Sessão indisponível" });
    const body = await readJson(request);
    if (!["agent", "operator"].includes(body.from) || !["offer", "answer", "ice"].includes(body.kind) || typeof body.payload !== "object") {
      return json(response, 400, { error: "Sinal inválido" });
    }
    session.lastSignalSequence = (session.lastSignalSequence || 0) + 1;
    const signal = { sequence: session.lastSignalSequence, from: body.from, kind: body.kind, payload: body.payload, at: Date.now() };
    session.signals.push(signal);
    if (session.signals.length > 100) session.signals.shift();
    persist(session);
    broadcast(session, "signal", signal);
    return json(response, 202, { accepted: true, sequence: signal.sequence });
  }

  const codeMatch = path.match(/^\/api\/sessions\/code\/(\d{6})$/);
  if (request.method === "GET" && codeMatch) {
    if (!allowCodeAttempt(request)) {
      response.setHeader("Retry-After", "300");
      return json(response, 429, { error: "Muitas tentativas. Aguarde antes de tentar novamente." });
    }
    const session = [...sessions.values()].find(item => item.code === codeMatch[1] && activeSession(item.id)?.status === "waiting");
    if (!session) return json(response, 404, { error: "Código inválido ou expirado" });
    return json(response, 200, publicSession(session));
  }

  const sessionMatch = path.match(/^\/api\/sessions\/([^/]+)$/);
  if (request.method === "GET" && sessionMatch) {
    const session = activeSession(sessionMatch[1]);
    if (!session) return json(response, 404, { error: "Sessão não encontrada" });
    return json(response, 200, publicSession(session));
  }

  const consentMatch = path.match(/^\/api\/sessions\/([^/]+)\/consent$/);
  if (request.method === "POST" && consentMatch) {
    const session = activeSession(consentMatch[1]);
    if (!session || session.status !== "waiting") return json(response, 409, { error: "Sessão indisponível" });
    const body = await readJson(request);
    const allowed = ["screen", "control", "audio", "files"];
    const permissions = Array.isArray(body.permissions) ? body.permissions.filter(value => allowed.includes(value)) : [];
    if (!permissions.includes("screen")) return json(response, 400, { error: "Visualização da tela é necessária" });
    session.permissions = permissions;
    session.customer = { name: "Marina Lopes" };
    session.device = { name: "FINANCEIRO-07", platform: "Windows 11 Pro" };
    session.status = "authorized";
    session.controlPaused = false;
    session.authorizedAt = Date.now();
    record(session, "consent.granted", "customer", { permissions });
    return json(response, 200, publicSession(session));
  }

  const controlMatch = path.match(/^\/api\/sessions\/([^/]+)\/control$/);
  if (request.method === "POST" && controlMatch) {
    const session = activeSession(controlMatch[1]);
    if (!session || session.status !== "authorized") return json(response, 409, { error: "Sessão indisponível" });
    if (!session.permissions.includes("control")) return json(response, 403, { error: "Controle remoto não autorizado" });
    const body = await readJson(request);
    if (typeof body.paused !== "boolean") return json(response, 400, { error: "Estado de controle inválido" });
    session.controlPaused = Boolean(body.paused);
    session.controlChangedAt = Date.now();
    record(session, session.controlPaused ? "control.paused" : "control.resumed", "customer");
    return json(response, 200, publicSession(session));
  }

  const endMatch = path.match(/^\/api\/sessions\/([^/]+)\/end$/);
  if (request.method === "POST" && endMatch) {
    const session = activeSession(endMatch[1]);
    if (!session) return json(response, 404, { error: "Sessão não encontrada" });
    session.status = "ended";
    session.endedAt = Date.now();
    const body = await readJson(request);
    record(session, "session.ended", body.actor === "customer" ? "customer" : "technician");
    return json(response, 200, publicSession(session));
  }

  json(response, 404, { error: "Endpoint não encontrado" });
}

http.createServer(async (request, response) => {
  const rawPath = decodeURIComponent((request.url || "/").split("?")[0]);
  if (rawPath.startsWith("/api/")) {
    if (controlPlaneUrl) {
      proxyApi(request, response);
      return;
    }
    try {
      await handleApi(request, response, rawPath);
    } catch {
      json(response, 400, { error: "Requisição inválida" });
    }
    return;
  }
  if (rawPath === "/runtime-config.js") {
    response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
    response.end(`window.AeroSupportConfig=Object.freeze(${JSON.stringify({ iceServers })});`);
    return;
  }
  const relative = rawPath === "/" ? "index.html" : rawPath.replace(/^\/+/, "");
  const target = normalize(join(root, relative));
  if (!target.startsWith(normalize(root))) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if (!(await stat(target)).isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": types[extname(target)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404).end("Not found");
  }
}).listen(port, host, () => {
  console.log(`AeroSupport disponível em http://127.0.0.1:${port}`);
});
