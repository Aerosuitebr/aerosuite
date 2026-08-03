package com.aerosuite.integration.evolution.dto;

public class EvolutionSendTextRequest {

    public String number;
    public String text;

    public EvolutionSendTextRequest() {}

    public EvolutionSendTextRequest(String number, String text) {
        this.number = number;
        this.text = text;
    }
}
