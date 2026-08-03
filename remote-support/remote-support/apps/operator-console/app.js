const panel = document.querySelector("#sidePanel");
const panelContent = document.querySelector("#panelContent");
const panelTitle = panel.querySelector("h2");
const panelEyebrow = panel.querySelector("small");
const announcer = document.querySelector("#announcer");
const modal = document.querySelector("#modal");
const cursor = document.querySelector("#remoteCursor");
const screen = document.querySelector("#remoteScreen");
const remoteFrame = document.querySelector("#remoteFrame");
const appShell = document.querySelector(".app-shell");
const fullscreenButton = document.querySelector("#fullscreenButton");
let seconds = 18 * 60 + 42;
let modalMode = "end";
let controlsTimer;
let zoom = 1;
let zoomMode = "fit";
let panX = 0;
let panY = 0;
let dragStart = null;
let currentMonitor = 1;
const sessionId = new URLSearchParams(location.search).get("session");
let sessionStream;
let remoteEnded = false;
let operatorPeer = null;
let controlChannel = null;
let chatChannel = null;
const pendingOperatorIce = [];
let lastPointerSent = 0;
let sessionPermissions = [];

const templates = {
  chat: `
    <div class="messages" id="messages">
      <div class="panel-card chat-status"><p>As mensagens trafegam diretamente pela conexão da sessão e não são incluídas na auditoria.</p></div>
    </div>
    <form class="chat-compose" id="chatForm"><input id="chatInput" aria-label="Mensagem" placeholder="Escreva uma mensagem…" autocomplete="off"><button class="send-button" aria-label="Enviar">↑</button></form>`,
  display: `<div class="panel-card"><h3>Monitor em exibição</h3><p>Alterne sem interromper a sessão. A proporção e o zoom são preservados.</p></div><button class="option-row monitor-option" data-monitor="1"><span>Monitor 1 · Principal<br><small>1920 × 1080</small></span><b></b></button><button class="option-row monitor-option" data-monitor="2"><span>Monitor 2<br><small>2560 × 1440</small></span><b></b></button><button class="option-row monitor-option" data-monitor="all"><span>Exibir todos<br><small>Visão lado a lado</small></span><b></b></button><div class="panel-card scale-card" style="margin-top:12px"><h3>Escala e legibilidade</h3><button class="option-row zoom-option" data-zoom="fit"><span>Ajustar à tela<br><small>Exibe toda a área sem distorção</small></span><b></b></button><button class="option-row zoom-option" data-zoom="1"><span>Tamanho real · 100%<br><small>Arraste para navegar pelas bordas</small></span><b></b></button><button class="option-row zoom-option" data-zoom="1.25"><span>Zoom de leitura · 125%</span><b></b></button><button class="option-row zoom-option" data-zoom="1.5"><span>Zoom ampliado · 150%</span><b></b></button></div>`,
  quality: `<div class="panel-card"><h3>Qualidade inteligente</h3><p>18 ms · 12,4 Mbps · 60 FPS<br>Codec AV1 · cor 4:4:4</p></div><div class="option-row selected"><span>Precisão visual<br><small>Texto e detalhes máximos</small></span><b>✓</b></div><div class="option-row"><span>Equilibrado<br><small>Qualidade e fluidez</small></span></div><div class="option-row"><span>Baixa latência<br><small>Resposta mais rápida</small></span></div><div class="option-row"><span>Resolução nativa</span><div class="switch on"></div></div>`,
  files: `<div class="file-drop"><b>Solte arquivos aqui</b>ou selecione no computador</div><div class="panel-card" style="margin-top:12px"><h3>Transferências protegidas</h3><p>Arquivos são verificados, criptografados e registrados no histórico desta sessão.</p></div>`,
  more: `<div class="option-row"><span>Sincronizar área de transferência</span><div class="switch on"></div></div><div class="option-row"><span>Bloquear entrada do usuário</span><div class="switch"></div></div><div class="option-row"><span>Reiniciar e reconectar</span><b>›</b></div><div class="option-row"><span>Abrir gerenciador de tarefas</span><b>›</b></div><div class="option-row"><span>Informações do dispositivo</span><b>›</b></div><div class="panel-card" style="margin-top:12px"><h3>Privacidade e auditoria</h3><p>Todas as ações administrativas exigem confirmação e ficam registradas.</p></div>`
};

const headings = {
  chat: ["CONVERSA", "Chat da sessão"],
  display: ["EXIBIÇÃO", "Monitores remotos"],
  quality: ["TRANSMISSÃO", "Qualidade da imagem"],
  files: ["TRANSFERÊNCIA", "Arquivos"],
  more: ["FERRAMENTAS", "Mais ações"]
};

function openPanel(type) {
  const [eyebrow, title] = headings[type];
  panelEyebrow.textContent = eyebrow;
  panelTitle.textContent = title;
  panelContent.innerHTML = templates[type];
  panel.classList.add("open");
  document.querySelectorAll("[data-panel]").forEach(button => button.classList.toggle("active", button.dataset.panel === type));
  if (type === "chat") {
    document.querySelector(".notification")?.remove();
    renderChatHistory();
    document.querySelector("#chatForm").addEventListener("submit", event => {
      event.preventDefault();
      const input = document.querySelector("#chatInput");
      if (!input.value.trim()) return;
      if (chatChannel?.readyState !== "open") {
        announcer.textContent = "O chat estará disponível quando a transmissão for estabelecida";
        return;
      }
      const message = { id: crypto.randomUUID(), text: input.value.trim(), at: Date.now(), from: "operator" };
      chatChannel.send(JSON.stringify(message));
      chatHistory.push(message);
      appendChatMessage(message);
      input.value = "";
    });
    setTimeout(() => document.querySelector("#chatInput")?.focus(), 100);
  }
  if (type === "display") refreshDisplayControls();
}

function refreshDisplayControls() {
  document.querySelectorAll(".monitor-option").forEach(option => {
    const selected = String(currentMonitor) === option.dataset.monitor;
    option.classList.toggle("selected", selected);
    option.querySelector("b").textContent = selected ? "✓" : "";
  });
  document.querySelectorAll(".zoom-option").forEach(option => {
    const selected = option.dataset.zoom === zoomMode;
    option.classList.toggle("selected", selected);
    option.querySelector("b").textContent = selected ? "✓" : "";
  });
}

function setZoom(value, label) {
  zoomMode = value === "fit" ? "fit" : String(Math.max(1, Math.min(2, Number(value))));
  zoom = zoomMode === "fit" ? 1 : Number(zoomMode);
  if (zoom === 1) { panX = 0; panY = 0; }
  applyViewTransform();
  document.querySelector("#zoomLabel").textContent = label || (zoomMode === "fit" ? "Ajustar à tela" : `Zoom ${Math.round(zoom * 100)}%`);
  announcer.textContent = `Visualização em ${document.querySelector("#zoomLabel").textContent}`;
  refreshDisplayControls();
}

function applyViewTransform() {
  const maxX = remoteFrame.clientWidth * (zoom - 1) / 2;
  const maxY = remoteFrame.clientHeight * (zoom - 1) / 2;
  panX = Math.max(-maxX, Math.min(maxX, panX));
  panY = Math.max(-maxY, Math.min(maxY, panY));
  screen.style.setProperty("--zoom", zoom);
  screen.style.setProperty("--pan-x", `${panX}px`);
  screen.style.setProperty("--pan-y", `${panY}px`);
}

function selectMonitor(value) {
  currentMonitor = value === "all" ? "all" : Number(value);
  const label = value === "all" ? "Todos os monitores" : `Monitor ${value}`;
  document.querySelector("#monitorLabel").textContent = label;
  document.querySelector(".session-identity span:not(.status-pill)").textContent = value === "2" ? "DESIGN-02 · 2560 × 1440" : value === "all" ? "2 MONITORES · VISÃO CONJUNTA" : "FINANCEIRO-07 · Windows 11 Pro";
  screen.classList.toggle("monitor-two", value === "2");
  screen.classList.toggle("monitor-all", value === "all");
  announcer.textContent = `${label} selecionado`;
  refreshDisplayControls();
}

function applyRemoteSession(session) {
  if (remoteEnded) return;
  sessionPermissions = Array.isArray(session.permissions) ? session.permissions : [];
  const controlAllowed = sessionPermissions.includes("control");
  const paused = Boolean(session.controlPaused);
  document.querySelector("#remoteStage").classList.toggle("control-paused", paused);
  document.querySelector("#controlBlocked").hidden = !paused;
  const controlButton = document.querySelector('[data-action="control"]');
  controlButton.setAttribute("aria-disabled", String(paused || !controlAllowed));
  controlButton.classList.toggle("permission-denied", !controlAllowed);
  controlButton.querySelector("span").textContent = !controlAllowed ? "Sem controle" : paused ? "Pausado" : "Controle";
  if (session.customer?.name) document.querySelector(".session-identity strong").textContent = session.customer.name;
  if (session.device?.name) document.querySelector(".session-identity span:not(.status-pill)").textContent = `${session.device.name} · ${session.device.platform}`;
  if (session.status === "ended") {
    remoteEnded = true;
    sessionStream?.close();
    renderEnded("O usuário encerrou o atendimento", "O acesso à tela, ao áudio e ao controle foi revogado imediatamente.");
  }
}

function watchRemoteSession() {
  sessionStream?.close();
  sessionStream = new EventSource(`/api/sessions/${encodeURIComponent(sessionId)}/events`);
  sessionStream.addEventListener("session", event => {
    const { session } = JSON.parse(event.data);
    applyRemoteSession(session);
  });
  sessionStream.addEventListener("signal", event => handleOperatorSignal(JSON.parse(event.data)));
}

async function sendOperatorSignal(kind, payload) {
  await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "operator", kind, payload })
  });
}

const chatHistory = [];

function appendChatMessage(message) {
  const messages = document.querySelector("#messages");
  if (!messages) return;
  messages.querySelector(".chat-status")?.remove();
  const own = message.from === "operator";
  messages.insertAdjacentHTML("beforeend", `<div class="message${own ? "" : " mine"}"><span>${escapeHtml(message.text)}</span><small>${own ? "Você" : "Usuário"} · agora</small></div>`);
  messages.scrollTop = messages.scrollHeight;
}

function renderChatHistory() {
  for (const message of chatHistory) appendChatMessage(message);
}

function receiveChatMessage(event) {
  try {
    const message = JSON.parse(event.data);
    if (message?.from !== "agent" || typeof message.text !== "string" || !message.text.trim() || message.text.length > 2000) return;
    chatHistory.push(message);
    appendChatMessage(message);
    if (!panel.classList.contains("open") && !document.querySelector('[data-panel="chat"] .notification')) {
      document.querySelector('[data-panel="chat"]')?.insertAdjacentHTML("beforeend", '<i class="notification">1</i>');
    }
  } catch {}
}

async function handleOperatorSignal(signal) {
  if (signal.from !== "agent") return;
  if (signal.kind === "offer") {
    operatorPeer?.close();
    operatorPeer = new RTCPeerConnection({ iceServers: window.AeroSupportConfig?.iceServers || [] });
    controlChannel = operatorPeer.createDataChannel("control", { ordered: true });
    chatChannel = operatorPeer.createDataChannel("chat", { ordered: true });
    chatChannel.onmessage = receiveChatMessage;
    operatorPeer.ontrack = event => {
      document.querySelector("#remoteVideo").srcObject = event.streams[0];
      screen.classList.add("streaming");
      document.querySelector("#connectionToast strong").textContent = "TransmissÃ£o ao vivo";
    };
    operatorPeer.onicecandidate = event => {
      if (event.candidate) sendOperatorSignal("ice", event.candidate.toJSON());
    };
    await operatorPeer.setRemoteDescription(signal.payload);
    while (pendingOperatorIce.length) await operatorPeer.addIceCandidate(pendingOperatorIce.shift());
    const answer = await operatorPeer.createAnswer();
    await operatorPeer.setLocalDescription(answer);
    await sendOperatorSignal("answer", { type: answer.type, sdp: answer.sdp });
  }
  if (signal.kind === "ice") {
    if (operatorPeer?.remoteDescription) await operatorPeer.addIceCandidate(signal.payload);
    else pendingOperatorIce.push(signal.payload);
  }
}

function renderEnded(title, text) {
  operatorPeer?.close();
  operatorPeer = null;
  controlChannel = null;
  chatChannel = null;
  document.querySelector("#remoteStage").innerHTML = `<div style="text-align:center"><div class="modal-icon" style="color:var(--cyan);background:rgba(89,227,193,.1)">✓</div><h2>${title}</h2><p style="color:var(--muted);font-size:12px">${text}</p><a href="dashboard.html" style="display:inline-flex;margin-top:13px;color:var(--cyan);font-size:10px;text-decoration:none">Voltar à central →</a></div>`;
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

document.querySelectorAll("[data-panel]").forEach(button => button.addEventListener("click", () => {
  if (panel.classList.contains("open") && button.classList.contains("active")) {
    panel.classList.remove("open");
    button.classList.remove("active");
  } else openPanel(button.dataset.panel);
}));
document.querySelector("#closePanel").addEventListener("click", () => {
  panel.classList.remove("open");
  document.querySelectorAll("[data-panel]").forEach(button => button.classList.remove("active"));
});
panelContent.addEventListener("click", event => {
  const zoomOption = event.target.closest(".zoom-option");
  if (zoomOption) setZoom(zoomOption.dataset.zoom);
  const monitorOption = event.target.closest(".monitor-option");
  if (monitorOption) selectMonitor(monitorOption.dataset.monitor);
});
document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => {
  if (button.dataset.action === "control" && !sessionPermissions.includes("control")) {
    announcer.textContent = "O usuário não autorizou o controle remoto";
    return;
  }
  if (button.dataset.action === "control" && document.querySelector("#remoteStage").classList.contains("control-paused")) {
    announcer.textContent = "O usuário pausou o controle remoto";
    return;
  }
  button.classList.toggle("active");
  announcer.textContent = `${button.querySelector("span").textContent} ${button.classList.contains("active") ? "ativado" : "desativado"}`;
}));

screen.addEventListener("mousemove", event => {
  const bounds = screen.getBoundingClientRect();
  cursor.style.left = `${event.clientX - bounds.left}px`;
  cursor.style.top = `${event.clientY - bounds.top}px`;
});
function canSendControl() {
  return screen.classList.contains("streaming") &&
    sessionPermissions.includes("control") &&
    !document.querySelector("#remoteStage").classList.contains("control-paused") &&
    controlChannel?.readyState === "open";
}
function sendControl(command) {
  if (canSendControl()) controlChannel.send(JSON.stringify(command));
}
screen.addEventListener("pointermove", event => {
  if (!canSendControl() || event.buttons && dragStart) return;
  const now = performance.now();
  if (now - lastPointerSent < 16) return;
  lastPointerSent = now;
  const bounds = screen.getBoundingClientRect();
  sendControl({ type:"move", x:(event.clientX - bounds.left) / bounds.width, y:(event.clientY - bounds.top) / bounds.height });
});
screen.addEventListener("pointerdown", event => {
  if (zoom > 1 || !canSendControl()) return;
  event.preventDefault();
  sendControl({ type:"button", button:event.button, down:true });
});
screen.addEventListener("pointerup", event => {
  if (zoom > 1 || !canSendControl()) return;
  sendControl({ type:"button", button:event.button, down:false });
});
screen.addEventListener("contextmenu", event => event.preventDefault());
screen.addEventListener("wheel", event => {
  if (!canSendControl() || event.ctrlKey) return;
  event.preventDefault();
  sendControl({ type:"wheel", delta:Math.sign(-event.deltaY) });
}, { passive:false });
screen.addEventListener("keydown", event => {
  if (!canSendControl()) return;
  event.preventDefault();
  sendControl({ type:"key", code:event.code, down:true });
});
screen.addEventListener("keyup", event => {
  if (!canSendControl()) return;
  event.preventDefault();
  sendControl({ type:"key", code:event.code, down:false });
});
screen.addEventListener("pointerdown", event => {
  if (zoom <= 1 || event.button !== 0) return;
  dragStart = { x:event.clientX, y:event.clientY, panX, panY };
  screen.classList.add("panning");
  screen.setPointerCapture(event.pointerId);
});
screen.addEventListener("pointermove", event => {
  if (!dragStart) return;
  panX = dragStart.panX + event.clientX - dragStart.x;
  panY = dragStart.panY + event.clientY - dragStart.y;
  applyViewTransform();
});
screen.addEventListener("pointerup", () => {
  dragStart = null;
  screen.classList.remove("panning");
});
screen.addEventListener("wheel", event => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  setZoom(Math.max(1, Math.min(2, zoom + (event.deltaY < 0 ? .1 : -.1))));
}, { passive:false });

function setImmersive(active) {
  appShell.classList.toggle("immersive", active);
  fullscreenButton.setAttribute("aria-label", active ? "Sair da tela cheia" : "Entrar em tela cheia");
  fullscreenButton.querySelector("span").textContent = active ? "Sair" : "Tela cheia";
  announcer.textContent = active ? "Modo imersivo ativado" : "Modo imersivo encerrado";
  if (!active) appShell.classList.remove("controls-visible");
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await appShell.requestFullscreen({ navigationUI: "hide" });
    } else {
      await document.exitFullscreen();
    }
  } catch {
    setImmersive(!appShell.classList.contains("immersive"));
  }
}

fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", () => setImmersive(Boolean(document.fullscreenElement)));
document.addEventListener("mousemove", event => {
  if (!appShell.classList.contains("immersive")) return;
  const show = event.clientY >= window.innerHeight - 115;
  appShell.classList.toggle("controls-visible", show);
  clearTimeout(controlsTimer);
  if (show) controlsTimer = setTimeout(() => appShell.classList.remove("controls-visible"), 1800);
});

function showModal(mode) {
  modalMode = mode;
  const secure = mode === "secure";
  document.querySelector("#modalIcon").textContent = secure ? "⌘" : "⌁";
  document.querySelector("#modalEyebrow").textContent = secure ? "AÇÃO PROTEGIDA" : "SESSÃO REMOTA";
  document.querySelector("#modalTitle").textContent = secure ? "Enviar Ctrl + Alt + Del?" : "Encerrar atendimento?";
  document.querySelector("#modalText").textContent = secure ? "O Windows exibirá a tela de segurança no computador remoto. Esta ação será registrada." : "O controle, o áudio e todas as transferências serão interrompidos imediatamente.";
  document.querySelector("#noteRow").hidden = secure;
  document.querySelector("#confirmModal").textContent = secure ? "Enviar comando" : "Encerrar sessão";
  document.querySelector("#confirmModal").className = secure ? "danger-button secure-confirm" : "danger-button";
  modal.hidden = false;
  document.querySelector("#cancelModal").focus();
}
document.querySelector("#endSession").addEventListener("click", () => showModal("end"));
document.querySelector("#secureAttention").addEventListener("click", () => showModal("secure"));
document.querySelector("#cancelModal").addEventListener("click", () => modal.hidden = true);
modal.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });
document.querySelector("#confirmModal").addEventListener("click", async () => {
  modal.hidden = true;
  if (modalMode === "secure") {
    announcer.textContent = "Comando de segurança enviado";
    const toast = document.querySelector("#connectionToast");
    toast.querySelector("strong").textContent = "Ctrl + Alt + Del enviado";
    toast.querySelector("small").textContent = "Ação registrada com sucesso";
    toast.style.animation = "none";
    requestAnimationFrame(() => toast.style.animation = "toast 5s ease forwards");
  } else {
    if (sessionId) await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: "technician" })
    });
    remoteEnded = true;
    sessionStream?.close();
    renderEnded("Atendimento encerrado", "Resumo e trilha de auditoria salvos com sucesso.");
  }
});
document.addEventListener("keydown", event => {
  if (event.defaultPrevented) return;
  if (event.key === "F11") {
    event.preventDefault();
    toggleFullscreen();
    return;
  }
  if (event.ctrlKey && ["+", "=", "-", "0"].includes(event.key)) {
    event.preventDefault();
    if (event.key === "0") setZoom("fit");
    else setZoom(zoom + (event.key === "-" ? -.25 : .25));
    return;
  }
  if (event.key === "Escape") {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    if (appShell.classList.contains("immersive")) setImmersive(false);
    else if (!modal.hidden) modal.hidden = true;
    else if (panel.classList.contains("open")) document.querySelector("#closePanel").click();
    else showModal("end");
  }
});
setInterval(() => {
  seconds++;
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor(seconds % 3600 / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  document.querySelector("#timer").textContent = `${h}:${m}:${s}`;
}, 1000);
if (sessionId) {
  watchRemoteSession();
}
