package com.aerosuite.service;

import com.aerosuite.api.VitrineResource;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@ApplicationScoped
public class VitrineMediaService {

    @ConfigProperty(name = "aero.suite.vitrine.path", defaultValue = "./vitrine-videos")
    String vitrinePath;

    public Path resolveFile(String fileName) {
        if (fileName == null || fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return null;
        }
        Path base = Paths.get(vitrinePath).toAbsolutePath().normalize();
        Path file = base.resolve(fileName).normalize();
        if (!file.startsWith(base) || !Files.isRegularFile(file)) {
            return null;
        }
        return file;
    }

    public jakarta.ws.rs.core.Response stream(Path file, boolean download, String rangeHeader) {
        try {
            long fileSize = Files.size(file);
            String contentType = contentType(file.getFileName().toString());
            String disposition = (download ? "attachment" : "inline") + "; filename=\"" + file.getFileName() + "\"";

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                long[] range = parseRange(rangeHeader, fileSize);
                if (range == null) {
                    return jakarta.ws.rs.core.Response.status(jakarta.ws.rs.core.Response.Status.REQUESTED_RANGE_NOT_SATISFIABLE)
                            .header("Content-Range", "bytes */" + fileSize)
                            .build();
                }

                long start = range[0];
                long end = range[1];
                long contentLength = end - start + 1;

                jakarta.ws.rs.core.StreamingOutput stream = output -> copyRange(file, start, contentLength, output);
                return jakarta.ws.rs.core.Response.status(jakarta.ws.rs.core.Response.Status.PARTIAL_CONTENT)
                        .entity(stream)
                        .type(contentType)
                        .header("Accept-Ranges", "bytes")
                        .header("Content-Length", contentLength)
                        .header("Content-Range", "bytes " + start + "-" + end + "/" + fileSize)
                        .header("Content-Disposition", disposition)
                        .build();
            }

            jakarta.ws.rs.core.StreamingOutput stream = output -> Files.copy(file, output);
            return jakarta.ws.rs.core.Response.ok(stream)
                    .type(contentType)
                    .header("Accept-Ranges", "bytes")
                    .header("Content-Length", fileSize)
                    .header("Content-Disposition", disposition)
                    .build();
        } catch (IOException e) {
            return jakarta.ws.rs.core.Response.serverError().entity(new VitrineResource.ErrorMsg("media_unavailable")).build();
        }
    }

    public jakarta.ws.rs.core.Response streamPublic(Path file, String rangeHeader) {
        jakarta.ws.rs.core.Response response = stream(file, false, rangeHeader);
        if (response.getStatus() == jakarta.ws.rs.core.Response.Status.OK.getStatusCode()
                || response.getStatus() == jakarta.ws.rs.core.Response.Status.PARTIAL_CONTENT.getStatusCode()) {
            return jakarta.ws.rs.core.Response.fromResponse(response)
                    .header("Cache-Control", "public, max-age=86400")
                    .build();
        }
        return response;
    }

    private static long[] parseRange(String rangeHeader, long fileSize) {
        if (fileSize <= 0) {
            return null;
        }
        String spec = rangeHeader.substring("bytes=".length()).trim();
        int dash = spec.indexOf('-');
        if (dash < 0) {
            return null;
        }
        String startPart = spec.substring(0, dash).trim();
        String endPart = spec.substring(dash + 1).trim();

        long start;
        long end;
        try {
            if (startPart.isEmpty()) {
                long suffix = Long.parseLong(endPart);
                if (suffix <= 0) {
                    return null;
                }
                start = Math.max(fileSize - suffix, 0);
                end = fileSize - 1;
            } else {
                start = Long.parseLong(startPart);
                end = endPart.isEmpty() ? fileSize - 1 : Long.parseLong(endPart);
            }
        } catch (NumberFormatException e) {
            return null;
        }

        if (start < 0 || end < start || start >= fileSize) {
            return null;
        }
        end = Math.min(end, fileSize - 1);
        return new long[]{start, end};
    }

    private static void copyRange(Path file, long start, long length, java.io.OutputStream output) throws IOException {
        try (InputStream input = Files.newInputStream(file)) {
            long skipped = input.skip(start);
            if (skipped < start) {
                throw new IOException("Failed to seek media stream");
            }
            byte[] buffer = new byte[8192];
            long remaining = length;
            while (remaining > 0) {
                int read = input.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                if (read == -1) {
                    break;
                }
                output.write(buffer, 0, read);
                remaining -= read;
            }
        }
    }

    private static String contentType(String fileName) {
        String ext = "";
        int i = fileName.lastIndexOf('.');
        if (i > 0) {
            ext = fileName.substring(i + 1).toLowerCase();
        }
        return switch (ext) {
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            default -> "application/octet-stream";
        };
    }
}
