package com.aerosuite.util;

import jakarta.ws.rs.BadRequestException;
import java.util.Objects;

public final class JobCardSignatureRules {
    private JobCardSignatureRules() {}

    public static void assertReplacementAllowed(boolean exists, Boolean confirmed, String currentHash, String expectedHash) {
        if (!exists) return;
        if (!Boolean.TRUE.equals(confirmed)) {
            throw new BadRequestException("A assinatura já está salva. Confirme uma nova assinatura antes de substituí-la.");
        }
        if (!Objects.equals(currentHash, expectedHash)) {
            throw new BadRequestException("A assinatura foi alterada. Atualize a OS antes de assinar novamente.");
        }
    }
}
