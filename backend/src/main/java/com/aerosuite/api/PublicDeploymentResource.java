package com.aerosuite.api;

import com.aerosuite.dto.DeploymentInfoResponse;
import com.aerosuite.service.EnvironmentLabelService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/public/deployment")
@Produces(MediaType.APPLICATION_JSON)
public class PublicDeploymentResource {

    @Inject
    EnvironmentLabelService environmentLabelService;

    @GET
    public DeploymentInfoResponse info() {
        DeploymentInfoResponse res = new DeploymentInfoResponse();
        res.environmentName = environmentLabelService.environmentName();
        res.kind = environmentLabelService.environmentKind();
        res.showBanner = environmentLabelService.showEnvironmentBanner();
        res.commitSha = readCommitSha(PublicDeploymentResource.class.getResourceAsStream("/deployment-sha.txt"));
        return res;
    }

    static String readCommitSha(java.io.InputStream resource) {
        if (resource == null) return "";
        try (resource) {
            String sha = new String(resource.readNBytes(128), java.nio.charset.StandardCharsets.US_ASCII).trim();
            return sha.matches("[a-fA-F0-9]{40}") ? sha : "";
        } catch (java.io.IOException ex) {
            return "";
        }
    }
}
