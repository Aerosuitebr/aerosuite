package com.aerosuite.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

class ServerUrlUtilTest {

    @Test
    void identifiesLoopbackUrls() {
        assertTrue(ServerUrlUtil.isLoopbackFrontendUrl("http://localhost:4200"));
        assertTrue(ServerUrlUtil.isLoopbackFrontendUrl("http://127.0.0.1:8081/path"));
        assertTrue(ServerUrlUtil.isLoopbackFrontendUrl("http://0.0.0.0:8081"));
        assertTrue(ServerUrlUtil.isLoopbackFrontendUrl("not-a-url-localhost"));
        assertFalse(ServerUrlUtil.isLoopbackFrontendUrl("https://app.aerosuite.app"));
        assertFalse(ServerUrlUtil.isLoopbackFrontendUrl(null));
        assertFalse(ServerUrlUtil.isLoopbackFrontendUrl(" "));
    }

    @Test
    void extractsExplicitAndDefaultPorts() {
        assertEquals(8443, ServerUrlUtil.extractPortFromUrl("https://example.com:8443/a", 8081));
        assertEquals(443, ServerUrlUtil.extractPortFromUrl("https://example.com", 8081));
        assertEquals(80, ServerUrlUtil.extractPortFromUrl("http://example.com", 8081));
        assertEquals(8081, ServerUrlUtil.extractPortFromUrl("invalid", 8081));
    }

    @Test
    void classifiesPrivateIpv4Ranges() {
        assertTrue(ServerUrlUtil.isPrivateIpv4(null));
        assertTrue(ServerUrlUtil.isPrivateIpv4("localhost"));
        assertTrue(ServerUrlUtil.isPrivateIpv4("10.2.3.4"));
        assertTrue(ServerUrlUtil.isPrivateIpv4("127.0.0.1"));
        assertTrue(ServerUrlUtil.isPrivateIpv4("172.16.0.1"));
        assertTrue(ServerUrlUtil.isPrivateIpv4("172.31.255.255"));
        assertTrue(ServerUrlUtil.isPrivateIpv4("192.168.1.1"));
        assertTrue(ServerUrlUtil.isPrivateIpv4("169.254.1.2"));
        assertFalse(ServerUrlUtil.isPrivateIpv4("172.32.0.1"));
        assertFalse(ServerUrlUtil.isPrivateIpv4("8.8.8.8"));
        assertFalse(ServerUrlUtil.isPrivateIpv4("app.aerosuite.app"));
        assertFalse(ServerUrlUtil.isPrivateIpv4("1.bad.3.4"));
    }

    @Test
    void acceptsOnlyPublicHttpFrontendUrls() {
        assertTrue(ServerUrlUtil.isUsablePublicFrontendUrl("https://app.aerosuite.app/"));
        assertTrue(ServerUrlUtil.isUsablePublicFrontendUrl("http://8.8.8.8:8081"));
        assertFalse(ServerUrlUtil.isUsablePublicFrontendUrl(null));
        assertFalse(ServerUrlUtil.isUsablePublicFrontendUrl("${FRONTEND_URL:}"));
        assertFalse(ServerUrlUtil.isUsablePublicFrontendUrl("ftp://example.com"));
        assertFalse(ServerUrlUtil.isUsablePublicFrontendUrl("http://localhost:4200"));
        assertFalse(ServerUrlUtil.isUsablePublicFrontendUrl("http://192.168.1.10:8081"));
        assertFalse(ServerUrlUtil.isUsablePublicFrontendUrl("https://"));
    }
}
