import { readFile } from "node:fs/promises";

const base = new URL("../apps/operator-console/", import.meta.url);
const [html, css, js, agentHtml, agentJs, dashboardHtml, dashboardJs] = await Promise.all([
  readFile(new URL("index.html", base), "utf8"),
  readFile(new URL("styles.css", base), "utf8"),
  readFile(new URL("app.js", base), "utf8"),
  readFile(new URL("agent.html", base), "utf8"),
  readFile(new URL("agent.js", base), "utf8"),
  readFile(new URL("dashboard.html", base), "utf8"),
  readFile(new URL("dashboard.js", base), "utf8")
]);

const checks = [
  ["documento em português", html.includes('lang="pt-BR"')],
  ["atalho de pânico", js.includes("Escape")],
  ["tela cheia real", js.includes("requestFullscreen")],
  ["atalho de tela cheia", js.includes('event.key === "F11"')],
  ["zoom e escala", js.includes("function setZoom")],
  ["navegação ampliada", js.includes("setPointerCapture")],
  ["seleção de monitores", js.includes("function selectMonitor")],
  ["consentimento granular", agentHtml.includes("Escolha o que deseja permitir")],
  ["encerramento pelo usuário", agentJs.includes("localEnd")],
  ["código temporário", agentHtml.includes("autocomplete=\"one-time-code\"")],
  ["central do técnico", dashboardHtml.includes("Fila de atendimentos")],
  ["expiração do convite", dashboardJs.includes("remaining = 300")],
  ["entrada na sessão", dashboardHtml.includes('id="startSessionLink"')],
  ["API de sessões", (await readFile(new URL("../../tools/dev-server.mjs", base), "utf8")).includes("/api/sessions")],
  ["consentimento conectado", agentJs.includes("/consent")],
  ["pausa sincronizada", agentJs.includes("/control") && js.includes("controlPaused")],
  ["controle condicionado ao consentimento", js.includes('sessionPermissions.includes("control")') && (await readFile(new URL("../../tools/dev-server.mjs", base), "utf8")).includes('permissions.includes("control")')],
  ["encerramento propagado", js.includes("O usuário encerrou o atendimento")],
  ["eventos em tempo real", dashboardJs.includes("EventSource") && js.includes("EventSource")],
  ["sinalizaÃ§Ã£o WebRTC", js.includes("RTCPeerConnection") && agentJs.includes("RTCPeerConnection")],
  ["captura consentida", agentJs.includes("getDisplayMedia")],
  ["canal de controle dedicado", js.includes('createDataChannel("control"') && agentJs.includes("ondatachannel")],
  ["chat bidirecional real", js.includes('createDataChannel("chat"') && agentJs.includes('event.channel.label === "chat"')],
  ["chat sem conteúdo simulado", !js.includes("Acontece quando tento exportar este relatório")],
  ["proxy para Control Plane", (await readFile(new URL("../../tools/dev-server.mjs", base), "utf8")).includes("AEROSUPPORT_CONTROL_PLANE_URL")],
  ["STUN/TURN configurável", js.includes("AeroSupportConfig?.iceServers") && agentJs.includes("AeroSupportConfig?.iceServers")],
  ["persistência SQLite", (await readFile(new URL("../../tools/dev-server.mjs", base), "utf8")).includes("AEROSUPPORT_DB_PATH")],
  ["autenticação do técnico", (await readFile(new URL("../../tools/dev-server.mjs", base), "utf8")).includes("AEROSUPPORT_OPERATOR_TOKEN")],
  ["consentimento visível", html.includes("Sessão autorizada")],
  ["layout responsivo", css.includes("@media")],
  ["diálogo acessível", html.includes('role="dialog"')],
  ["política de movimento reduzido", css.includes("prefers-reduced-motion")]
];

const desktopMain = await readFile(new URL("../../desktop/main.mjs", base), "utf8");
checks.push(
  ["isolamento do aplicativo desktop", desktopMain.includes("contextIsolation: true") && desktopMain.includes("nodeIntegration: false")],
  ["sandbox do aplicativo desktop", desktopMain.includes("sandbox: true")],
  ["instância única", desktopMain.includes("requestSingleInstanceLock")]
);

let failed = false;
for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
