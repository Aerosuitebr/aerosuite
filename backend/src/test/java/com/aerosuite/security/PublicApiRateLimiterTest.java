package com.aerosuite.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicApiRateLimiterTest {

    private PublicApiRateLimiter limiter;

    @BeforeEach
    void setUp() throws Exception {
        limiter = new PublicApiRateLimiter();
        setField("enabled", true);
        setField("requestsPerMinute", 3);
        limiter.resetForTests();
    }

    @Test
    void allowsUnderLimit() {
        assertTrue(limiter.tryAcquire("1.2.3.4", "/api/public/signup").granted());
        assertTrue(limiter.tryAcquire("1.2.3.4", "/api/public/signup").granted());
        assertTrue(limiter.tryAcquire("1.2.3.4", "/api/public/signup").granted());
    }

    @Test
    void deniesOverLimitPerPrefix() {
        for (int i = 0; i < 3; i++) {
            assertTrue(limiter.tryAcquire("10.0.0.1", "/api/public/lgpd").granted());
        }
        assertFalse(limiter.tryAcquire("10.0.0.1", "/api/public/lgpd").granted());
        assertTrue(limiter.tryAcquire("10.0.0.1", "/api/public/signup").granted());
    }

    @Test
    void disabledAlwaysAllows() throws Exception {
        setField("enabled", false);
        for (int i = 0; i < 10; i++) {
            assertTrue(limiter.tryAcquire("10.0.0.2", "/api/public/signup").granted());
        }
    }

    private void setField(String name, Object value) throws Exception {
        Field f = PublicApiRateLimiter.class.getDeclaredField(name);
        f.setAccessible(true);
        f.set(limiter, value);
    }
}
