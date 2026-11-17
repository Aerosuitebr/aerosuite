package com.aerosuite.service;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialEnvio;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.dto.EnviarPropostaEmailDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sessão temporária de WhatsApp (Evolution): QR → conectar → enviar → desconectar.
 */
@ApplicationScoped
public class WhatsAppSessionService {

    private static final Logger LOGGER = Logger.getLogger(WhatsAppSessionService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Inject
    @ConfigProperty(name = "whatsapp.api.enabled", defaultValue = "false")
    boolean whatsappApiEnabled;

    @Inject
    @ConfigProperty(name = "whatsapp.api.url", defaultValue = "none")
    String whatsappApiUrl;

    @Inject
    @ConfigProperty(name = "whatsapp.api.token", defaultValue = "none")
    String whatsappApiToken;

    @Inject
    PropostaAceiteService aceiteService;

    @Inject
    PropostaComercialService propostaComercialService;

    @Inject CommercialBrandingService branding;
    @Inject com.aerosuite.security.TenantDataAccess tenants;
    @Inject com.aerosuite.security.InternalUserContext user;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final ConcurrentHashMap<String, SessionInfo> sessions = new ConcurrentHashMap<>();

    public static class SessionInfo {
        public String tenantId;
        public Integer userId;
        public String sessionId;
        public String instanceName;
        public Long propostaId;
        public String telefoneDestino;
        public String mensagemAdicional;
        public LocalDateTime createdAt = LocalDateTime.now();
        public String lastStatus = "starting";
    }

    public boolean isApiConfigured() {
        return whatsappApiEnabled
                && whatsappApiUrl != null && !whatsappApiUrl.isBlank() && !"none".equals(whatsappApiUrl)
                && whatsappApiToken != null && !whatsappApiToken.isBlank() && !"none".equals(whatsappApiToken);
    }

    public Map<String, Object> startSession(Long propostaId, String telefoneDestino, String mensagemAdicional) {
        PropostaComercial proposta = PropostaComercial.findById(propostaId);
        if (proposta == null) throw new NotFoundException("Proposta não encontrada");
        if (telefoneDestino == null || telefoneDestino.isBlank()) {
            telefoneDestino = proposta.clienteTelefone;
        }
        if (telefoneDestino == null || telefoneDestino.isBlank()) {
            throw new BadRequestException("Informe o WhatsApp do cliente");
        }

        String sessionId = "s" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String instanceName = "aerosuite-" + sessionId;

        SessionInfo info = new SessionInfo();
        info.tenantId = tenants.currentTenantIdStr();
        info.userId = user.getUserId();
        info.sessionId = sessionId;
        info.instanceName = instanceName;
        info.propostaId = propostaId;
        info.telefoneDestino = telefoneDestino;
        info.mensagemAdicional = mensagemAdicional;
        sessions.put(sessionId, info);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("propostaId", propostaId);
        result.put("telefoneDestino", telefoneDestino);
        result.put("mensagemPreview", buildCleanMessage(proposta, mensagemAdicional, null));
        result.put("apiConfigured", isApiConfigured());

        if (!isApiConfigured()) {
            info.lastStatus = "fallback";
            result.put("status", "fallback");
            result.put("fallback", true);
            result.putAll(buildFallbackPayloadTx(propostaId, telefoneDestino, mensagemAdicional));
            sessions.remove(sessionId);
            return result;
        }

        try {
            Map<String, Object> createBody = new HashMap<>();
            createBody.put("instanceName", instanceName);
            createBody.put("qrcode", true);
            createBody.put("integration", "WHATSAPP-BAILEYS");
            JsonNode created = requestJson("POST", "/instance/create", createBody);
            info.lastStatus = "qr";
            result.put("status", "qr");
            result.put("fallback", false);
            String qr = extractQrBase64(created);
            if (qr == null || qr.isBlank()) {
                JsonNode connect = requestJson("GET", "/instance/connect/" + instanceName, null);
                qr = extractQrBase64(connect);
            }
            result.put("qrcodeBase64", normalizeQrDataUri(qr));
            result.put("instanceName", instanceName);
            return result;
        } catch (Exception e) {
            LOGGER.warn("Falha ao iniciar sessão Evolution; usando fallback visual: " + e.getMessage());
            info.lastStatus = "fallback";
            result.put("status", "fallback");
            result.put("fallback", true);
            result.put("errorMessage", e.getMessage());
            result.putAll(buildFallbackPayloadTx(propostaId, telefoneDestino, mensagemAdicional));
            safeDeleteInstance(instanceName);
            sessions.remove(sessionId);
            return result;
        }
    }

    public Map<String, Object> sessionStatus(String sessionId) {
        SessionInfo info = requireSession(sessionId);
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("propostaId", info.propostaId);
        result.put("telefoneDestino", info.telefoneDestino);

        if ("fallback".equals(info.lastStatus) || !isApiConfigured()) {
            result.put("status", "fallback");
            result.put("fallback", true);
            result.putAll(buildFallbackPayloadTx(info.propostaId, info.telefoneDestino, info.mensagemAdicional));
            return result;
        }

        try {
            JsonNode stateNode = requestJson("GET", "/instance/connectionState/" + info.instanceName, null);
            String state = extractState(stateNode);
            result.put("rawState", state);

            if ("open".equalsIgnoreCase(state) || "connected".equalsIgnoreCase(state)) {
                info.lastStatus = "connected";
                result.put("status", "connected");
                result.put("qrcodeBase64", null);
                return result;
            }

            JsonNode connect = requestJson("GET", "/instance/connect/" + info.instanceName, null);
            String qr = extractQrBase64(connect);
            info.lastStatus = "qr";
            result.put("status", "qr");
            result.put("qrcodeBase64", normalizeQrDataUri(qr));
            return result;
        } catch (Exception e) {
            LOGGER.warn("Erro ao consultar status da sessão WA: " + e.getMessage());
            info.lastStatus = "fallback";
            result.put("status", "fallback");
            result.put("fallback", true);
            result.put("errorMessage", e.getMessage());
            result.putAll(buildFallbackPayloadTx(info.propostaId, info.telefoneDestino, info.mensagemAdicional));
            return result;
        }
    }

    @Transactional
    public Map<String, Object> sendAndDisconnect(String sessionId, EnviarPropostaEmailDto.SignatureDto signature) {
        SessionInfo info = requireSession(sessionId);
        PropostaComercial proposta = PropostaComercial.findById(info.propostaId);
        if (proposta == null) throw new NotFoundException("Proposta não encontrada");

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);

        String tokenAceite = aceiteService.garantirToken(proposta);
        String urlAceite = aceiteService.buildAceiteUrl(tokenAceite);
        String message = buildCleanMessage(proposta, info.mensagemAdicional, urlAceite);

        List<EnviarPropostaEmailDto.PropostaItemDto> itens = loadItens(proposta);
        byte[] pdfBytes;
        try {
            pdfBytes = propostaComercialService.generatePropostaPdfPublic(proposta, itens, signature);
        } catch (Exception e) {
            throw new BadRequestException("Falha ao gerar PDF: " + e.getMessage());
        }
        String pdfNome = "Proposta_Comercial_" + proposta.numeroProposta + ".pdf";

        boolean enviado = false;
        String erroEnvio = null;
        if (isApiConfigured() && !"fallback".equals(info.lastStatus)) {
            try {
                Map<String, Object> status = sessionStatus(sessionId);
                if (!"connected".equals(status.get("status"))) {
                    throw new BadRequestException("WhatsApp ainda não está conectado. Escaneie o QR.");
                }
                enviado = sendMedia(info.instanceName, cleanPhone(info.telefoneDestino), message, pdfBytes, pdfNome);
                if (!enviado) {
                    erroEnvio = "Evolution API não confirmou o envio";
                }
            } catch (Exception e) {
                erroEnvio = e.getMessage();
                LOGGER.warn("Envio via sessão falhou: " + erroEnvio);
            }
        }

        // Sempre desconecta/apaga a sessão após tentativa
        disconnect(sessionId);

        if (enviado) {
            proposta.status = "ENVIADA";
            proposta.persist();
            saveEnvio(proposta, info.telefoneDestino, "whatsapp_session", "ENVIADO", null);
            result.put("success", true);
            result.put("status", "sent");
            result.put("fallback", false);
            result.put("aceiteUrl", urlAceite);
            result.put("message", "Proposta enviada pelo WhatsApp. Sessão desconectada.");
            return result;
        }

        // Fallback visual: PDF + wa.me limpo
        saveEnvio(proposta, info.telefoneDestino, "whatsapp_web", "PENDENTE", erroEnvio);
        proposta.status = "ENVIADA";
        proposta.persist();
        result.put("success", true);
        result.put("status", "fallback");
        result.put("fallback", true);
        result.put("aceiteUrl", urlAceite);
        result.put("pdfBase64", Base64.getEncoder().encodeToString(pdfBytes));
        result.put("pdfNome", pdfNome);
        result.put("whatsappUrl", buildWaMeUrl(info.telefoneDestino, message));
        result.put("mensagemPreview", message);
        result.put("errorMessage", erroEnvio);
        result.put("message", "Não foi possível enviar pela sessão conectada. Use o fallback: PDF + abrir seu WhatsApp.");
        return result;
    }

    public Map<String, Object> disconnect(String sessionId) {
        SessionInfo info = requireSession(sessionId);
        sessions.remove(sessionId, info);
        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", sessionId);
        result.put("status", "disconnected");
        if (info != null) {
            safeLogout(info.instanceName);
            safeDeleteInstance(info.instanceName);
        }
        return result;
    }

    @Transactional
    Map<String, Object> buildFallbackPayloadTx(Long propostaId, String telefone, String mensagemAdicional) {
        PropostaComercial proposta = PropostaComercial.findById(propostaId);
        Map<String, Object> map = new HashMap<>();
        if (proposta == null) return map;
        String tokenAceite = aceiteService.garantirToken(proposta);
        String urlAceite = aceiteService.buildAceiteUrl(tokenAceite);
        String message = buildCleanMessage(proposta, mensagemAdicional, urlAceite);
        map.put("aceiteUrl", urlAceite);
        map.put("mensagemPreview", message);
        map.put("whatsappUrl", buildWaMeUrl(telefone, message));
        try {
            List<EnviarPropostaEmailDto.PropostaItemDto> itens = loadItens(proposta);
            byte[] pdf = propostaComercialService.generatePropostaPdfPublic(proposta, itens, null);
            map.put("pdfBase64", Base64.getEncoder().encodeToString(pdf));
            map.put("pdfNome", "Proposta_Comercial_" + proposta.numeroProposta + ".pdf");
        } catch (Exception e) {
            LOGGER.warn("PDF fallback indisponível: " + e.getMessage());
        }
        return map;
    }

    /** Mensagem limpa, sem emoji (evita losango/interrogação no WhatsApp Web). */
    public String buildCleanMessage(PropostaComercial proposta, String mensagemAdicional, String urlAceite) {
        StringBuilder msg = new StringBuilder();
        msg.append("Ola! Segue nossa proposta comercial:\n\n");
        msg.append("*Proposta:* ").append(nullSafe(proposta.numeroProposta)).append("\n");
        msg.append("*Data:* ").append(proposta.dataProposta != null ? proposta.dataProposta.format(DATE_FMT) : "-").append("\n");
        String moeda = (proposta.moedaProposta != null && !proposta.moedaProposta.isBlank())
                ? proposta.moedaProposta.trim().toUpperCase() : "USD";
        msg.append("*Moeda:* ").append(moeda).append("\n\n");
        if (mensagemAdicional != null && !mensagemAdicional.isBlank()) {
            msg.append(mensagemAdicional.trim()).append("\n\n");
        }
        msg.append("A proposta completa esta em anexo (PDF).\n\n");
        if (urlAceite != null && !urlAceite.isBlank()) {
            msg.append("Revisar e autorizar online:\n").append(urlAceite).append("\n\n");
        }
        msg.append("Atenciosamente,\n").append(branding.nameNormal());
        return msg.toString();
    }

    private String buildWaMeUrl(String telefone, String message) {
        String phone = cleanPhone(telefone);
        try {
            return "https://wa.me/" + phone + "?text=" + URLEncoder.encode(message, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "https://wa.me/" + phone;
        }
    }

    private boolean sendMedia(String instance, String phone, String caption, byte[] pdf, String fileName) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("number", phone);
        payload.put("mediatype", "document");
        payload.put("mimetype", "application/pdf");
        payload.put("caption", caption);
        payload.put("fileName", fileName);
        payload.put("media", Base64.getEncoder().encodeToString(pdf));
        JsonNode resp = requestJson("POST", "/message/sendMedia/" + instance, payload);
        return resp != null;
    }

    private List<EnviarPropostaEmailDto.PropostaItemDto> loadItens(PropostaComercial proposta) {
        List<EnviarPropostaEmailDto.PropostaItemDto> itens = new ArrayList<>();
        List<PropostaComercialItem> saved = PropostaComercialItem
                .find("propostaComercial = ?1", Sort.by("ordem").ascending(), proposta).list();
        for (PropostaComercialItem item : saved) {
            EnviarPropostaEmailDto.PropostaItemDto dto = new EnviarPropostaEmailDto.PropostaItemDto();
            dto.produtoNome = item.produtoNome;
            dto.produtoDescricao = item.produtoDescricao;
            dto.produtoPn = item.produtoPn;
            dto.produtoSn = item.produtoSn;
            dto.quantidade = item.quantidade;
            dto.valorUnitario = item.valorUnitario;
            dto.valorTotal = item.valorTotal;
            itens.add(dto);
        }
        return itens;
    }

    private void saveEnvio(PropostaComercial proposta, String telefone, String canal, String status, String erro) {
        PropostaComercialEnvio envio = new PropostaComercialEnvio();
        envio.propostaComercial = proposta;
        envio.tipoEnvio = "WHATSAPP";
        envio.canal = canal;
        envio.destinatarioTelefone = telefone;
        envio.destinatarioNome = proposta.clienteNome;
        envio.status = status;
        envio.mensagemErro = erro;
        envio.dataEnvio = LocalDateTime.now();
        envio.persist();
    }

    private SessionInfo requireSession(String sessionId) {
        SessionInfo info = sessions.get(sessionId);
        if (info == null || !java.util.Objects.equals(info.tenantId, tenants.currentTenantIdStr())
                || !java.util.Objects.equals(info.userId, user.getUserId())) throw new NotFoundException("Sessão WhatsApp não encontrada ou já encerrada");
        return info;
    }

    private String cleanPhone(String phone) {
        String cleaned = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (cleaned.length() == 10 || cleaned.length() == 11) cleaned = "55" + cleaned;
        return cleaned;
    }

    private String nullSafe(String v) { return v != null ? v : "-"; }

    private String extractState(JsonNode node) {
        if (node == null) return "";
        if (node.has("instance") && node.get("instance").has("state")) {
            return node.get("instance").get("state").asText("");
        }
        if (node.has("state")) return node.get("state").asText("");
        return "";
    }

    private String extractQrBase64(JsonNode node) {
        if (node == null) return null;
        if (node.has("base64") && !node.get("base64").asText("").isBlank()) return node.get("base64").asText();
        if (node.has("qrcode")) {
            JsonNode qr = node.get("qrcode");
            if (qr.isTextual() && qr.asText().startsWith("data:")) return qr.asText();
            if (qr.has("base64") && !qr.get("base64").asText("").isBlank()) return qr.get("base64").asText();
        }
        return null;
    }

    private String normalizeQrDataUri(String qr) {
        if (qr == null || qr.isBlank()) return null;
        if (qr.startsWith("data:")) return qr;
        return "data:image/png;base64," + qr;
    }

    private JsonNode requestJson(String method, String path, Map<String, Object> body) throws Exception {
        String base = whatsappApiUrl.endsWith("/") ? whatsappApiUrl.substring(0, whatsappApiUrl.length() - 1) : whatsappApiUrl;
        HttpRequest.Builder b = HttpRequest.newBuilder()
                .uri(URI.create(base + path))
                .timeout(Duration.ofSeconds(60))
                .header("apikey", whatsappApiToken)
                .header("Accept", "application/json");
        if ("POST".equalsIgnoreCase(method)) {
            String json = body == null ? "{}" : mapper.writeValueAsString(body);
            b.header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8));
        } else if ("DELETE".equalsIgnoreCase(method)) {
            b.DELETE();
        } else {
            b.GET();
        }
        HttpResponse<String> resp = httpClient.send(b.build(), HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() >= 400) {
            throw new IllegalStateException("Evolution HTTP " + resp.statusCode() + ": " + resp.body());
        }
        if (resp.body() == null || resp.body().isBlank()) return mapper.createObjectNode();
        return mapper.readTree(resp.body());
    }

    private void safeLogout(String instance) {
        try { requestJson("DELETE", "/instance/logout/" + instance, null); } catch (Exception ignored) {}
    }

    private void safeDeleteInstance(String instance) {
        try { requestJson("DELETE", "/instance/delete/" + instance + "?force=true", null); } catch (Exception ignored) {}
    }
}
