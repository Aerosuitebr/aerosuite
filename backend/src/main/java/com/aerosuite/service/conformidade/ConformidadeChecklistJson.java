package com.aerosuite.service.conformidade;

import com.aerosuite.dto.ConformidadeChecklistItemDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ConformidadeChecklistJson {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<ConformidadeChecklistItemDto>> LIST_TYPE = new TypeReference<>() {};

    public List<ConformidadeChecklistItemDto> parse(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            List<ConformidadeChecklistItemDto> items = MAPPER.readValue(json, LIST_TYPE);
            return items != null ? items : new ArrayList<>();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public String serialize(List<ConformidadeChecklistItemDto> items) {
        try {
            return MAPPER.writeValueAsString(items != null ? items : List.of());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao serializar checklist", e);
        }
    }

    public static List<ConformidadeChecklistItemDto> defaultContingenciaReconciliacao() {
        List<ConformidadeChecklistItemDto> items = new ArrayList<>();
        items.add(item("1", "Confirmar disponibilidade do sistema (TI)", "TI"));
        items.add(item("2", "Inserir ou importar OS do período offline (Produção)", "Produção"));
        items.add(item("3", "Anexar scans dos formulários papel (Qualidade)", "Qualidade"));
        items.add(item("4", "Revisar duplicidade e consistência (RT)", "RT"));
        items.add(item("5", "Registrar evento de contingência (Qualidade)", "Qualidade"));
        return items;
    }

    public static List<ConformidadeChecklistItemDto> defaultReleaseImpacto() {
        List<ConformidadeChecklistItemDto> items = new ArrayList<>();
        items.add(item("auditoria", "Afeta trilha os_auditoria?", null));
        items.add(item("crs", "Afeta emissão ou conteúdo do CRS?", null));
        items.add(item("rbac", "Afeta segregação de perfis?", null));
        items.add(item("retencao", "Afeta retenção/export dossiê?", null));
        items.add(item("migracao", "Exige migração de dados existentes?", null));
        items.add(item("treinamento", "Exige atualização MOM/MCQ ou treinamento?", null));
        items.add(item("matriz", "Matriz REQ-xxx atualizada?", null));
        return items;
    }

    private static ConformidadeChecklistItemDto item(String id, String label, String responsavel) {
        ConformidadeChecklistItemDto dto = new ConformidadeChecklistItemDto();
        dto.id = id;
        dto.label = label;
        dto.responsavel = responsavel;
        dto.concluido = false;
        return dto;
    }
}
