package com.aerosuite.service;

import com.aerosuite.dto.studio.AeroStudioStockImageDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class AeroStudioStockService {

    @Inject
    ObjectMapper objectMapper;

    private List<AeroStudioStockImageDto> catalog = List.of();

    @PostConstruct
    void load() {
        try (InputStream in =
                Thread.currentThread().getContextClassLoader().getResourceAsStream("studio/stock-catalog.json")) {
            if (in != null) {
                catalog = objectMapper.readValue(in, new TypeReference<List<AeroStudioStockImageDto>>() {});
            }
        } catch (Exception e) {
            catalog = List.of();
        }
    }

    public List<AeroStudioStockImageDto> search(String query, int limit) {
        int max = Math.min(Math.max(limit, 1), 40);
        if (catalog.isEmpty()) {
            return List.of();
        }
        String q = query != null ? query.trim().toLowerCase(Locale.ROOT) : "";
        List<AeroStudioStockImageDto> out = new ArrayList<>();
        for (AeroStudioStockImageDto img : catalog) {
            if (q.isEmpty() || matches(img, q)) {
                out.add(img);
                if (out.size() >= max) {
                    break;
                }
            }
        }
        return out;
    }

    private static boolean matches(AeroStudioStockImageDto img, String q) {
        if (img.id != null && img.id.toLowerCase(Locale.ROOT).contains(q)) {
            return true;
        }
        if (img.tags != null) {
            for (String tag : img.tags) {
                if (tag != null && tag.toLowerCase(Locale.ROOT).contains(q)) {
                    return true;
                }
            }
        }
        return false;
    }
}
