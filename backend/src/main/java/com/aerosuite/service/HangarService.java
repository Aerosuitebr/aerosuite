package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.Hangar;
import com.aerosuite.dto.HangarDto;
import com.aerosuite.dto.HangarWriteDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class HangarService {

    public List<HangarDto> listarAtivos() {
        return listar(false);
    }

    public List<HangarDto> listar(boolean incluirInativos) {
        String query = incluirInativos
                ? "order by ordem asc, nome asc"
                : "ativo = true order by ordem asc, nome asc";
        return Hangar.<Hangar>find(query).list().stream().map(HangarService::toDto).toList();
    }

    @Transactional
    public HangarDto criar(HangarWriteDto body) {
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.error.body_obrigatorio"));
        }
        String codigo = normalizarCodigo(body.codigo);
        String nome = normalizarNome(body.nome);
        if (Hangar.count("codigo = ?1", codigo) > 0) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.error.codigo_duplicado"));
        }
        Hangar h = new Hangar();
        h.codigo = codigo;
        h.nome = nome;
        h.ordem = body.ordem != null ? body.ordem : 0;
        h.ativo = body.ativo == null || body.ativo;
        h.persist();
        return toDto(h);
    }

    @Transactional
    public HangarDto atualizar(Long id, HangarWriteDto body) {
        Hangar h = Hangar.findById(id);
        if (h == null) {
            throw new NotFoundException(ApiI18nMessages.domain("hangar.error.nao_encontrado"));
        }
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.error.body_obrigatorio"));
        }
        if (body.codigo != null && !body.codigo.isBlank()) {
            String codigo = normalizarCodigo(body.codigo);
            if (Hangar.count("codigo = ?1 and id <> ?2", codigo, id) > 0) {
                throw new BadRequestException(ApiI18nMessages.domain("hangar.error.codigo_duplicado"));
            }
            h.codigo = codigo;
        }
        if (body.nome != null && !body.nome.isBlank()) {
            h.nome = normalizarNome(body.nome);
        }
        if (body.ordem != null) {
            h.ordem = body.ordem;
        }
        if (body.ativo != null) {
            h.ativo = body.ativo;
        }
        h.persist();
        return toDto(h);
    }

    private static String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.error.codigo_obrigatorio"));
        }
        return codigo.trim().toUpperCase(Locale.ROOT);
    }

    private static String normalizarNome(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("hangar.error.nome_obrigatorio"));
        }
        return nome.trim();
    }

    static HangarDto toDto(Hangar h) {
        HangarDto dto = new HangarDto();
        dto.id = h.id;
        dto.codigo = h.codigo;
        dto.nome = h.nome;
        dto.ordem = h.ordem;
        dto.ativo = h.ativo;
        return dto;
    }
}
