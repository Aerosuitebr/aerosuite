/**
 * Chat interno: apenas mensagens de texto.
 * Chamadas de voz/WebRTC e sons sintéticos ficam desligados (sem polling em /api/chamadas).
 */
export const CHAT_VOICE_CALLS_ENABLED = false;

/** Beeps de notificação via Web Audio API (desligado junto com voz). */
export const CHAT_SOUND_NOTIFICATIONS_ENABLED = false;

/** Intervalo do badge no layout (só GET /chat/nao-lidas). */
export const CHAT_BADGE_POLL_MS = 60_000;

/** Intervalo da lista de conversas com o chat aberto. */
export const CHAT_CONVERSAS_POLL_MS = 20_000;
