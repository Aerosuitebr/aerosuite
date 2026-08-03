package com.aerosuite.crs;

import jakarta.ws.rs.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Part145CrsSegregationEmitTest {

  private final Part145CrsSegregation segregation = new Part145CrsSegregation();

  @Test
  void rejectsEmitWhenUserIdNull() {
    BadRequestException ex =
        assertThrows(
            BadRequestException.class,
            () -> segregation.assertMayEmit(1L, null, "P145_EXECUCAO"));
    assertEquals(Part145CrsSegregation.ERROR_I18N_KEY, ex.getMessage());
  }

    @Test
    void bypassesHabilitacaoOnlyForGovernanceProfiles() {
        assertFalse(Part145CrsSegregation.bypassesHabilitacaoCrs("P145_RT"));
        assertTrue(Part145CrsSegregation.bypassesHabilitacaoCrs("ADMIN"));
    }

    @Test
    void isBlockedWhenUserIdNull() {
        assertTrue(new Part145CrsSegregation().isBlockedFromCrsEmit(1L, null, "P145_EXECUCAO"));
    }

    @Test
    void notBlockedForRtProfileIndependenceBypass() {
        assertFalse(new Part145CrsSegregation().isBlockedFromCrsEmit(99L, 1, "P145_RT"));
    }
}
