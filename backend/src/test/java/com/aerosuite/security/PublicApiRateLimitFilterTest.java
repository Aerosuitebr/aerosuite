package com.aerosuite.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PublicApiRateLimitFilterTest {

    @Test
    void publicPathPrefixGroupsByFirstSegment() {
        assertEquals("/api/public/signup", PublicApiRateLimitFilter.publicPathPrefix("/api/public/signup/trial"));
        assertEquals("/api/public/lgpd", PublicApiRateLimitFilter.publicPathPrefix("/api/public/lgpd/termos"));
        assertEquals("/api/public/empresa-asset", PublicApiRateLimitFilter.publicPathPrefix("/api/public/empresa-asset/logo"));
    }
}
