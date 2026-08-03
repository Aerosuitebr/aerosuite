package com.aerosuite.api;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import com.aerosuite.security.RequiresFuncionalidades;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

/**
 * API da Biblioteca: carregamento sob demanda.
 * GET /api/biblioteca/children?path= → apenas diretórios e arquivos do primeiro nível (path vazio = raiz).
 * GET /api/biblioteca/conteudo?path=... → conteúdo do arquivo para visualização.
 */
@jakarta.ws.rs.Path("/api/biblioteca")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"BIBLIOTECA"})
public class BibliotecaResource {

    @Inject
    @ConfigProperty(name = "aero.suite.biblioteca.path", defaultValue = "./biblioteca")
    String bibliotecaPath;

    @GET
    @jakarta.ws.rs.Path("/info")
    public Response getInfo() {
        Path base = Paths.get(bibliotecaPath).toAbsolutePath().normalize();
        try {
            boolean exists = Files.exists(base);
            boolean isDir = exists && Files.isDirectory(base);
            return Response.ok(java.util.Map.of(
                    "path", base.toString(),
                    "exists", exists,
                    "isDirectory", isDir
            )).build();
        } catch (Exception e) {
            return Response.serverError().entity(new ErrorMsg(e.getMessage())).build();
        }
    }

    /**
     * Retorna apenas os filhos diretos (um nível): subpastas e arquivos.
     * path vazio ou null = raiz da biblioteca.
     */
    @GET
    @jakarta.ws.rs.Path("/children")
    public Response getChildren(@QueryParam("path") String pathEncoded) {
        Path base = Paths.get(bibliotecaPath).toAbsolutePath().normalize();
        if (!Files.isDirectory(base)) {
            return Response.ok(new ChildrenDto(List.of(), List.of())).build();
        }
        Path dir = base;
        if (pathEncoded != null && !pathEncoded.isBlank()) {
            String pathStr = URLDecoder.decode(pathEncoded.trim(), StandardCharsets.UTF_8);
            if (pathStr.contains("..") || pathStr.startsWith("/") || pathStr.startsWith("\\")) {
                return Response.status(Response.Status.FORBIDDEN).build();
            }
            dir = base.resolve(pathStr.replace('\\', '/')).normalize();
            if (!dir.startsWith(base) || !Files.isDirectory(dir)) {
                return Response.ok(new ChildrenDto(List.of(), List.of())).build();
            }
        }
        try {
            List<CategoriaItemDto> categorias = new ArrayList<>();
            List<ArquivoDto> arquivos = new ArrayList<>();
            try (Stream<Path> stream = Files.list(dir)) {
                List<Path> entries = stream
                        .sorted((a, b) -> {
                            boolean aDir = Files.isDirectory(a);
                            boolean bDir = Files.isDirectory(b);
                            if (aDir != bDir) return aDir ? -1 : 1;
                            return a.getFileName().toString().compareToIgnoreCase(b.getFileName().toString());
                        })
                        .toList();
                for (Path p : entries) {
                    String rel = base.relativize(p).toString().replace('\\', '/');
                    if (Files.isDirectory(p)) {
                        categorias.add(new CategoriaItemDto(p.getFileName().toString(), rel));
                    } else if (Files.isRegularFile(p)) {
                        arquivos.add(new ArquivoDto(p.getFileName().toString(), rel));
                    }
                }
            }
            return Response.ok(new ChildrenDto(categorias, arquivos)).build();
        } catch (IOException e) {
            return Response.serverError().entity(new ErrorMsg(e.getMessage())).build();
        }
    }

    public static class ChildrenDto {
        public List<CategoriaItemDto> categorias;
        public List<ArquivoDto> arquivos;

        public ChildrenDto(List<CategoriaItemDto> categorias, List<ArquivoDto> arquivos) {
            this.categorias = categorias;
            this.arquivos = arquivos;
        }
    }

    public static class CategoriaItemDto {
        public String nome;
        public String path;

        public CategoriaItemDto(String nome, String path) {
            this.nome = nome;
            this.path = path;
        }
    }

    @GET
    @jakarta.ws.rs.Path("/conteudo")
    @Produces(MediaType.WILDCARD)
    public Response getConteudo(@QueryParam("path") String pathEncoded) {
        if (pathEncoded == null || pathEncoded.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        String pathStr = URLDecoder.decode(pathEncoded, StandardCharsets.UTF_8);
        if (pathStr.contains("..") || pathStr.startsWith("/")) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        Path base = Paths.get(bibliotecaPath).toAbsolutePath().normalize();
        Path file = base.resolve(pathStr).normalize();
        if (!file.startsWith(base) || !Files.isRegularFile(file)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        try {
            byte[] bytes = Files.readAllBytes(file);
            String nome = file.getFileName().toString();
            String contentType = contentType(nome);
            return Response.ok(bytes)
                    .type(contentType)
                    .header("Content-Disposition", "inline; filename=\"" + nome + "\"")
                    .build();
        } catch (IOException e) {
            return Response.serverError().entity(new ErrorMsg(e.getMessage())).build();
        }
    }

    private static String contentType(String fileName) {
        String ext = "";
        int i = fileName.lastIndexOf('.');
        if (i > 0) ext = fileName.substring(i + 1).toLowerCase();
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "svg" -> "image/svg+xml";
            case "txt" -> "text/plain; charset=utf-8";
            case "html", "htm" -> "text/html; charset=utf-8";
            case "json" -> "application/json";
            case "xml" -> "application/xml";
            default -> "application/octet-stream";
        };
    }

    public static class ArquivoDto {
        public String nome;
        public String path;

        public ArquivoDto(String nome, String path) {
            this.nome = nome;
            this.path = path;
        }
    }

    public static class ErrorMsg {
        public String error;
        public ErrorMsg(String error) { this.error = error; }
    }
}
