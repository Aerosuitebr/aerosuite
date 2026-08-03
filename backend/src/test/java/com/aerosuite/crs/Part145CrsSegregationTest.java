package com.aerosuite.crs;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Part145CrsSegregationTest {

    @Test
    void rtAndInspectorBypassIndependence() {
        assertTrue(Part145CrsSegregation.bypassesIndependence("P145_RT"));
        assertTrue(Part145CrsSegregation.bypassesIndependence("p145_inspetor"));
        assertTrue(Part145CrsSegregation.bypassesIndependence("ADMIN"));
    }

    @Test
    void executionProfileDoesNotBypass() {
        assertFalse(Part145CrsSegregation.bypassesIndependence("P145_EXECUCAO"));
        assertFalse(Part145CrsSegregation.bypassesIndependence("OPERADOR"));
        assertFalse(Part145CrsSegregation.bypassesIndependence(null));
    }
}
