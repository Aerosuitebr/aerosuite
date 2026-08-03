const views = {
  start: document.querySelector("#startView"),
  consent: document.querySelector("#consentView"),
  active: document.querySelector("#activeView"),
  finished: document.querySelector("#finishedView")
};
const codeInput = document.querySelector("#sessionCode");
const continueButton = document.querySelector("#continueButton");
const toast = document.querySelector("#agentToast");
let activeSeconds = 0;
let timerId;
let currentSessionId = null;
let captureStream = null;
let peerConnection = null;
let signalStream = null;
let chatChannel = null;
const pendingAgentIce = [];
let isControlPaused = false;

function showView(name) {
  Object.entries(views).forEach(([key, view]) => view.hidden = key !== name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

codeInput.addEventListener("input", () => {
  const digits = codeInput.value.replace(/\D/g, "").slice(0, 6);
  codeInput.value = digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
  const valid = digits.length === 6;
  continueButton.disabled = !valid;
  document.querySelector("#codeState").textContent = valid ? "Código válido" : `${digits.length}/6`;
});

document.querySelector("#codeForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (continueButton.disabled) return;
  continueButton.disabled = true;
  continueButton.firstChild.textContent = "Validando… ";
  const code = codeInput.value.replace(/\D/g, "");
  const response = await fetch(`/api/sessions/code/${code}`);
  if (!response.ok) {
    continueButton.firstChild.textContent = "Continuar ";
    continueButton.disabled = false;
    document.querySelector("#codeState").textContent = "Inválido ou expirado";
    notify("Confira o código informado ou solicite um novo ao técnico.");
    return;
  }
  const session = await response.json();
  currentSessionId = session.id;
  document.querySelector(".technician h2").textContent = session.technician.name;
  document.querySelector(".technician p").textContent = `${session.technician.organization} · Suporte técnico`;
  continueButton.firstChild.textContent = "Continuar ";
  showView("consent");
});
document.querySelector("#backButton").addEventListener("click", () => showView("start"));
document.querySelector("#denyButton").addEventListener("click", () => {
  showView("start");
  notify("Solicitação recusada. Nenhum acesso foi concedido.");
});

function selectedPermissions() {
  return [...document.querySelectorAll("[data-permission]:checked")].map(input => input.dataset.permission);
}

async function sendSignal(kind, payload) {
  if (!currentSessionId) return;
  await fetch(`/api/sessions/${currentSessionId}/signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from: "agent", kind, payload })
  });
}

function createAgentPeer() {
  peerConnection?.close();
  peerConnection = new RTCPeerConnection({ iceServers: window.AeroSupportConfig?.iceServers || [] });
  peerConnection.onicecandidate = event => {
    if (event.candidate) sendSignal("ice", event.candidate.toJSON());
  };
  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "connected") notify("TransmissÃ£o protegida estabelecida.");
    if (["failed", "disconnected"].includes(peerConnection.connectionState)) notify("A transmissÃ£o foi interrompida.");
  };
  peerConnection.ondatachannel = event => {
    if (event.channel.label === "control") event.channel.onmessage = message => {
      if (!captureStream || isControlPaused || !selectedPermissions().includes("control")) return;
      try {
        const input = JSON.parse(message.data);
        window.aeroSupportAgent?.applyInput(input);
      } catch {}
    };
    if (event.channel.label === "chat") {
      chatChannel = event.channel;
      const sendButton = document.querySelector("#agentChatForm button");
      chatChannel.onopen = () => {
        sendButton.disabled = false;
        document.querySelector("#agentChatMessages").innerHTML = "";
      };
      chatChannel.onclose = () => sendButton.disabled = true;
      chatChannel.onmessage = messageEvent => {
        try {
          const message = JSON.parse(messageEvent.data);
          if (message?.from !== "operator" || typeof message.text !== "string" || !message.text.trim() || message.text.length > 2000) return;
          appendAgentChat(message.text, false);
        } catch {}
      };
    }
  };
  signalStream?.close();
  signalStream = new EventSource(`/api/sessions/${currentSessionId}/events`);
  signalStream.addEventListener("signal", async event => {
    const signal = JSON.parse(event.data);
    if (signal.from !== "operator") return;
    if (signal.kind === "answer") {
      await peerConnection.setRemoteDescription(signal.payload);
      while (pendingAgentIce.length) await peerConnection.addIceCandidate(pendingAgentIce.shift());
    }
    if (signal.kind === "ice") {
      if (peerConnection.remoteDescription) await peerConnection.addIceCandidate(signal.payload);
      else pendingAgentIce.push(signal.payload);
    }
  });
}

async function startCapture() {
  if (!currentSessionId || captureStream) return;
  const wantsAudio = selectedPermissions().includes("audio");
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 60, max: 60 } },
      audio: wantsAudio
    });
  } catch {
    notify("Compartilhamento cancelado. Nenhuma tela foi transmitida.");
    return;
  }
  document.querySelector("#localPreview").srcObject = captureStream;
  document.querySelector("#localPreviewWrap").hidden = false;
  const shareButton = document.querySelector("#shareScreen");
  shareButton.classList.add("sharing");
  shareButton.querySelector("b").textContent = "Tela compartilhada";
  shareButton.querySelector("small").textContent = wantsAudio ? "VÃ­deo e Ã¡udio ativos" : "VÃ­deo ativo Â· Ã¡udio desativado";
  createAgentPeer();
  window.aeroSupportAgent?.setControlEnabled(selectedPermissions().includes("control") && !isControlPaused);
  captureStream.getTracks().forEach(track => peerConnection.addTrack(track, captureStream));
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  await sendSignal("offer", { type: offer.type, sdp: offer.sdp });
  captureStream.getVideoTracks()[0].addEventListener("ended", stopCapture);
}

function stopCapture() {
  captureStream?.getTracks().forEach(track => track.stop());
  captureStream = null;
  peerConnection?.close();
  peerConnection = null;
  chatChannel = null;
  signalStream?.close();
  window.aeroSupportAgent?.setControlEnabled(false);
  document.querySelector("#localPreview").srcObject = null;
  document.querySelector("#localPreviewWrap").hidden = true;
  const shareButton = document.querySelector("#shareScreen");
  shareButton.classList.remove("sharing");
  shareButton.querySelector("b").textContent = "Compartilhar tela";
  shareButton.querySelector("small").textContent = "Escolha o monitor que serÃ¡ exibido";
}

document.querySelector("#acceptButton").addEventListener("click", async () => {
  const selected = selectedPermissions();
  if (!selected.includes("screen")) {
    notify("Permita a visualização da tela para iniciar o atendimento.");
    return;
  }
  const response = await fetch(`/api/sessions/${currentSessionId}/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions: selected })
  });
  if (!response.ok) {
    notify("Esta solicitação não está mais disponível.");
    return;
  }
  const labels = { screen:"Tela visível", control:"Controle permitido", audio:"Áudio compartilhado", files:"Arquivos autorizados" };
  document.querySelector("#activePermissions").innerHTML = selected.map(key => `<span>✓ ${labels[key]}</span>`).join("");
  showView("active");
  activeSeconds = 0;
  clearInterval(timerId);
  timerId = setInterval(() => {
    activeSeconds++;
    const h = String(Math.floor(activeSeconds / 3600)).padStart(2, "0");
    const m = String(Math.floor(activeSeconds % 3600 / 60)).padStart(2, "0");
    const s = String(activeSeconds % 60).padStart(2, "0");
    document.querySelector("#activeTimer").textContent = `${h}:${m}:${s}`;
  }, 1000);
});

function appendAgentChat(text, own) {
  const messages = document.querySelector("#agentChatMessages");
  messages.querySelector("small")?.remove();
  const item = document.createElement("div");
  item.className = `session-chat-message${own ? " mine" : ""}`;
  item.textContent = text;
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
}

document.querySelector("#agentChatForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#agentChatInput");
  const text = input.value.trim();
  if (!text || chatChannel?.readyState !== "open") return;
  chatChannel.send(JSON.stringify({ id: crypto.randomUUID(), text, at: Date.now(), from: "agent" }));
  appendAgentChat(text, true);
  input.value = "";
});

document.querySelector("#shareScreen").addEventListener("click", () => captureStream ? stopCapture() : startCapture());

document.querySelector("#pauseControl").addEventListener("click", async event => {
  const button = event.currentTarget;
  const paused = button.classList.toggle("paused");
  isControlPaused = paused;
  window.aeroSupportAgent?.setControlEnabled(!paused && Boolean(captureStream) && selectedPermissions().includes("control"));
  button.querySelector("b").textContent = paused ? "Retomar controle" : "Pausar controle";
  button.querySelector("small").textContent = paused ? "Mouse e teclado estão bloqueados" : "O técnico continuará vendo a tela";
  button.querySelector("span").textContent = paused ? "▶" : "Ⅱ";
  if (currentSessionId) {
    await fetch(`/api/sessions/${currentSessionId}/control`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused })
    });
  }
  notify(paused ? "Controle remoto pausado" : "Controle remoto retomado");
});

document.querySelector("#localEnd").addEventListener("click", async () => {
  clearInterval(timerId);
  stopCapture();
  window.aeroSupportAgent?.setControlEnabled(false);
  if (currentSessionId) await fetch(`/api/sessions/${currentSessionId}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "customer" })
  });
  document.querySelector("#summaryDuration").textContent = document.querySelector("#activeTimer").textContent;
  showView("finished");
});
document.querySelector("#newSession").addEventListener("click", () => {
  codeInput.value = "";
  currentSessionId = null;
  continueButton.disabled = true;
  document.querySelector("#codeState").textContent = "6 dígitos";
  document.querySelector("#pauseControl").classList.remove("paused");
  showView("start");
  codeInput.focus();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !views.active.hidden) document.querySelector("#pauseControl").click();
});
