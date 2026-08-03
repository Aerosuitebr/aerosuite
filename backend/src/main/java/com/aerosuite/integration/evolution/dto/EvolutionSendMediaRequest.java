package com.aerosuite.integration.evolution.dto;

/**
 * Payload para {@code POST /message/sendMedia/{instanceName}}.
 * <p>
 * MIME types comuns no Aero Suite:
 * <ul>
 *   <li>{@code application/pdf} — PDF de Ordem de Serviço ou proposta comercial</li>
 *   <li>{@code image/jpeg}, {@code image/png}, {@code image/webp} — fotos de peças com avaria</li>
 * </ul>
 * Priorize {@link #media} como URL pública (menor consumo de memória); use Base64 apenas quando
 * o arquivo não estiver acessível externamente.
 */
public class EvolutionSendMediaRequest {

    public String number;
    /** Valor Evolution: image | document | video | audio */
    public String mediatype;
    /** MIME type do arquivo (ex.: application/pdf, image/jpeg) */
    public String mimetype;
    /** URL pública HTTPS ou string Base64 do conteúdo */
    public String media;
    public String fileName;
    public String caption;

    public EvolutionSendMediaRequest() {}

    public static EvolutionSendMediaRequest fromUrl(
            String number,
            EvolutionMediaType mediaType,
            String mimeType,
            String mediaUrl,
            String fileName,
            String caption) {
        EvolutionSendMediaRequest req = new EvolutionSendMediaRequest();
        req.number = number;
        req.mediatype = mediaType.apiValue();
        req.mimetype = mimeType;
        req.media = mediaUrl;
        req.fileName = fileName;
        req.caption = caption;
        return req;
    }

    public static EvolutionSendMediaRequest fromBase64(
            String number,
            EvolutionMediaType mediaType,
            String mimeType,
            String base64Content,
            String fileName,
            String caption) {
        EvolutionSendMediaRequest req = new EvolutionSendMediaRequest();
        req.number = number;
        req.mediatype = mediaType.apiValue();
        req.mimetype = mimeType;
        req.media = base64Content;
        req.fileName = fileName;
        req.caption = caption;
        return req;
    }
}
