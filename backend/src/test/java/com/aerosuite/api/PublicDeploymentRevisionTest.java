package com.aerosuite.api;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PublicDeploymentRevisionTest {
    @Test void reportsOnlyFullCommitFromPublishedArtifact() {
        String sha = "a".repeat(40);
        assertEquals(sha, PublicDeploymentResource.readCommitSha(new ByteArrayInputStream((sha + "\n").getBytes(StandardCharsets.US_ASCII))));
    }
    @Test void missingOrInvalidMetadataDoesNotInventVersion() {
        assertEquals("", PublicDeploymentResource.readCommitSha(null));
        assertEquals("", PublicDeploymentResource.readCommitSha(new ByteArrayInputStream("unknown".getBytes(StandardCharsets.US_ASCII))));
        assertEquals("", PublicDeploymentResource.readCommitSha(new ByteArrayInputStream("abcdef0".getBytes(StandardCharsets.US_ASCII))));
    }
}