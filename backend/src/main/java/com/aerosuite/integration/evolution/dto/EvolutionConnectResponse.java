package com.aerosuite.integration.evolution.dto;

/**
 * Resposta do endpoint {@code GET /instance/connect/{instanceName}} com QR Code.
 */
public class EvolutionConnectResponse {

    public String pairingCode;
    public String code;
    public String base64;
    public String count;
}
