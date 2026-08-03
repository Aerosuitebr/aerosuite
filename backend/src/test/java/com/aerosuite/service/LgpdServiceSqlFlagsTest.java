package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class LgpdServiceSqlFlagsTest {

    @Test
    void acceptsBooleanTrue() {
        assertTrue(LgpdService.isSqlTrue(Boolean.TRUE));
        assertFalse(LgpdService.isSqlTrue(Boolean.FALSE));
    }

    @Test
    void acceptsNumericFlags() {
        assertTrue(LgpdService.isSqlTrue(1));
        assertTrue(LgpdService.isSqlTrue(1L));
        assertFalse(LgpdService.isSqlTrue(0));
    }

    @Test
    void nullIsFalse() {
        assertFalse(LgpdService.isSqlTrue(null));
    }
}
