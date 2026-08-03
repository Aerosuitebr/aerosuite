package com.aerosuite.integration.evolution.dto;

public class EvolutionCreateInstanceResponse {

    public Instance instance;
    public Hash hash;

    public static class Instance {
        public String instanceId;
        public String instanceName;
        public String status;
        public String integration;
    }

    public static class Hash {
        public String apikey;
    }
}
