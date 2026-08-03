package com.aerosuite.integration.evolution.dto;

/**
 * Tipos de mídia suportados pela Evolution API ({@code mediatype} no payload).
 */
public enum EvolutionMediaType {
    IMAGE("image"),
    DOCUMENT("document"),
    VIDEO("video"),
    AUDIO("audio");

    private final String apiValue;

    EvolutionMediaType(String apiValue) {
        this.apiValue = apiValue;
    }

    public String apiValue() {
        return apiValue;
    }

  /**
   * Infere o {@code mediatype} a partir do MIME type do arquivo.
   * PDFs de OS → {@code document}; fotos de peças → {@code image}.
   */
    public static EvolutionMediaType fromMimeType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return DOCUMENT;
        }
        String m = mimeType.toLowerCase().trim();
        if (m.startsWith("image/")) {
            return IMAGE;
        }
        if (m.startsWith("video/")) {
            return VIDEO;
        }
        if (m.startsWith("audio/")) {
            return AUDIO;
        }
        return DOCUMENT;
    }
}
