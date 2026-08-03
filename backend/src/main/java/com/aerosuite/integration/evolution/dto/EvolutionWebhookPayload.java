package com.aerosuite.integration.evolution.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * Payload genérico de webhook Evolution API v2.
 * Eventos relevantes: {@code connection.update}, {@code qrcode.updated}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class EvolutionWebhookPayload {

    public String event;
    public String instance;
    public JsonNode data;
    public String destination;

    @JsonAlias("date_time")
    public String dateTime;

    public String apikey;
}