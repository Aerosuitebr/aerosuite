const sessionModal = document.querySelector("#sessionModal");
const createStep = document.querySelector("#createStep");
const readyStep = document.querySelector("#readyStep");
const codeLabel = document.querySelector("#generatedCode");
const expiryLabel = document.querySelector("#expiryTimer");
const toast = document.querySelector("#dashboardToast");
let code = "";
let remaining = 300;
let expiryInterval;
let currentSessionId = null;
let sessionStream;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function generateCode() {
  sessionStream?.close();
  const response = await fetch("/api/sessions", { method: "POST" });
  if (!response.ok) {
    notify("Não foi possível criar o atendimento.");
    return;
  }
  const session = await response.json();
  currentSessionId = session.id;
  code = session.code;
  codeLabel.textContent = `${code.slice(0, 3)} ${code.slice(3)}`;
  remaining = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
  updateExpiry();
  clearInterval(expiryInterval);
  expiryInterval = setInterval(() => {
    remaining--;
    updateExpiry();
    if (remaining <= 0) {
      clearInterval(expiryInterval);
      codeLabel.textContent = "EXPIRADO";
      notify("Código expirado. Gere um novo convite.");
    }
  }, 1000);
  watchSession(session.id);
}

function watchSession(id) {
  sessionStream?.close();
  sessionStream = new EventSource(`/api/sessions/${encodeURIComponent(id)}/events`);
  sessionStream.addEventListener("session", event => {
    const { session } = JSON.parse(event.data);
    handleSessionStatus(session);
  });
}

function handleSessionStatus(session) {
  if (session.status === "authorized") {
    sessionStream?.close();
    clearInterval(expiryInterval);
    createStep.hidden = true;
    readyStep.hidden = false;
    document.querySelector("#startSessionLink").href = `index.html?session=${encodeURIComponent(session.id)}`;
    notify("Marina autorizou o acesso.");
  }
}

function updateExpiry() {
  expiryLabel.textContent = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
}

function openSessionModal(ready = false) {
  sessionModal.hidden = false;
  createStep.hidden = ready;
  readyStep.hidden = !ready;
  if (!ready) generateCode();
}

document.querySelector("#newSessionButton").addEventListener("click", () => openSessionModal());
document.querySelectorAll("[data-connect]").forEach(button => button.addEventListener("click", () => openSessionModal(true)));
document.querySelector("#closeSessionModal").addEventListener("click", () => {
  sessionModal.hidden = true;
  clearInterval(expiryInterval);
  sessionStream?.close();
});
sessionModal.addEventListener("click", event => {
  if (event.target === sessionModal) document.querySelector("#closeSessionModal").click();
});
document.querySelector("#regenerateCode").addEventListener("click", generateCode);
document.querySelector("#copyCode").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(code);
    notify("Código copiado para a área de transferência.");
  } catch {
    notify(`Código: ${code.slice(0, 3)} ${code.slice(3)}`);
  }
});
document.querySelector("#simulateJoin").addEventListener("click", () => {
  clearInterval(expiryInterval);
  createStep.hidden = true;
  readyStep.hidden = false;
  document.querySelector("#startSessionLink").href = currentSessionId ? `index.html?session=${encodeURIComponent(currentSessionId)}` : "index.html";
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !sessionModal.hidden) document.querySelector("#closeSessionModal").click();
});
