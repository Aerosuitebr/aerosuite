package com.aerosuite.integration.evolution.dto;

import java.util.List;

public class EvolutionCreateInstanceRequest {

    public String instanceName;
    public String token;
    public boolean qrcode = true;
    public String integration = "WHATSAPP-BAILEYS";

    public EvolutionCreateInstanceRequest() {}

    public EvolutionCreateInstanceRequest(String instanceName, String token) {
        this.instanceName = instanceName;
        this.token = token;
    }
}
