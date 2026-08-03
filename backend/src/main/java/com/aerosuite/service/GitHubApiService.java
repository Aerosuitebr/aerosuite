package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.List;

/**
 * Cliente REST para a API do GitHub
 */
@RegisterRestClient(baseUri = "https://api.github.com")
@RegisterClientHeaders(GitHubTokenHeaderProvider.class)
@ApplicationScoped
public interface GitHubApiService {
    
    /**
     * Busca a última release do repositório
     */
    @GET
    @Path("/repos/{owner}/{repo}/releases/latest")
    @Produces(MediaType.APPLICATION_JSON)
    GitHubRelease getLatestRelease(@PathParam("owner") String owner, @PathParam("repo") String repo);
    
    /**
     * Busca todas as releases do repositório
     */
    @GET
    @Path("/repos/{owner}/{repo}/releases")
    @Produces(MediaType.APPLICATION_JSON)
    List<GitHubRelease> getReleases(@PathParam("owner") String owner, @PathParam("repo") String repo);
    
    /**
     * Busca tags do repositório
     */
    @GET
    @Path("/repos/{owner}/{repo}/tags")
    @Produces(MediaType.APPLICATION_JSON)
    List<GitHubTag> getTags(@PathParam("owner") String owner, @PathParam("repo") String repo);
    
    /**
     * Classe para representar uma Release do GitHub
     */
    record GitHubRelease(
        String tag_name,
        String name,
        String body,
        Boolean prerelease,
        Boolean draft,
        String published_at,
        String html_url
    ) {}
    
    /**
     * Classe para representar uma Tag do GitHub
     */
    record GitHubTag(
        String name,
        String zipball_url,
        String tarball_url,
        GitHubCommit commit
    ) {}
    
    record GitHubCommit(
        String sha,
        String url
    ) {}
}

