package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeNaoConformidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import com.aerosuite.domain.ConformidadeNcAnexo;
import com.aerosuite.domain.ConformidadeNcCapaEtapa;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.ConformidadeNcAnexoDto;
import com.aerosuite.dto.ConformidadeNcCapaEtapaDto;
import com.aerosuite.dto.ConformidadeNcCapaEtapaWriteDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class ConformidadeNcAnexoService {

    private static final long MAX_BYTES = 25L * 1024 * 1024;

    private static final Set<String> TIPOS_PERMITIDOS =
            Set.of(
                    "application/pdf",
                    "application/x-pdf",
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/vnd.ms-excel",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    @ConfigProperty(name = "conformidade.nc.anexos.base.path")
    Optional<String> basePath;

    @Inject
    InternalUserContext userContext;

    public List<ConformidadeNcAnexoDto> listar(Long ncId, String capaFase) {
        requireNc(ncId);
        String jpql = "ncId = ?1 and ativo = true";
        List<Object> params = new ArrayList<>();
        params.add(ncId);
        if (capaFase != null && !capaFase.isBlank()) {
            jpql += " and capaFase = ?2";
            params.add(CapaFase.valueOf(capaFase.trim().toUpperCase(Locale.ROOT)));
        }
        List<ConformidadeNcAnexo> rows =
                ConformidadeNcAnexo.find(jpql + " order by dataUpload desc", params.toArray()).list();
        return toDtoList(rows);
    }

    @Transactional
    public ConformidadeNcAnexoDto upload(Long ncId, FileUpload upload, String descricao, String capaFase) {
        requireNc(ncId);
        if (upload == null || upload.fileName() == null || upload.fileName().isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.anexo_obrigatorio"));
        }
        String contentType =
                upload.contentType() != null ? upload.contentType().toLowerCase(Locale.ROOT) : "";
        if (!contentType.isBlank() && !TIPOS_PERMITIDOS.contains(contentType)) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.anexo_tipo_invalido"));
        }
        try {
            Path source = upload.uploadedFile();
            if (source == null || !Files.exists(source)) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.anexo_obrigatorio"));
            }
            long size = Files.size(source);
            if (size > MAX_BYTES) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.anexo_grande"));
            }
            String ext = extensionFrom(upload.fileName());
            String storedName = UUID.randomUUID() + ext;
            ConformidadeNaoConformidade nc = requireNc(ncId);
            String relative =
                    (nc.tenantId != null ? nc.tenantId : "default") + "/" + ncId + "/" + storedName;
            Path target = getBasePath().resolve(relative);
            Files.createDirectories(target.getParent());
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);

            ConformidadeNcAnexo row = new ConformidadeNcAnexo();
            row.ncId = ncId;
            row.nomeArquivo = storedName;
            row.nomeOriginal = sanitizeFileName(upload.fileName());
            row.tipoArquivo = contentType.isBlank() ? "application/octet-stream" : contentType;
            row.tamanhoBytes = size;
            row.caminhoArquivo = relative;
            row.descricao = descricao;
            if (capaFase != null && !capaFase.isBlank()) {
                row.capaFase = CapaFase.valueOf(capaFase.trim().toUpperCase(Locale.ROOT));
            }
            Integer uid = userContext.getUserId();
            row.usuarioId = uid;
            row.usuarioNome = userContext.getNome();
            row.persist();
            return toDto(row);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.anexo_upload_falhou"));
        }
    }

    public Path resolvePath(Long ncId, Long anexoId) {
        ConformidadeNcAnexo row = requireAnexo(ncId, anexoId);
        Path path = getBasePath().resolve(row.caminhoArquivo);
        if (!Files.exists(path)) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.anexo_nao_encontrado"));
        }
        return path;
    }

    public ConformidadeNcAnexo meta(Long ncId, Long anexoId) {
        return requireAnexo(ncId, anexoId);
    }

    @Transactional
    public void excluir(Long ncId, Long anexoId) {
        ConformidadeNcAnexo row = requireAnexo(ncId, anexoId);
        row.ativo = false;
        row.persist();
    }

    private ConformidadeNcAnexo requireAnexo(Long ncId, Long anexoId) {
        if (anexoId == null) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.id_invalido"));
        }
        ConformidadeNcAnexo row = ConformidadeNcAnexo.findById(anexoId);
        if (row == null || !Boolean.TRUE.equals(row.ativo) || !ncId.equals(row.ncId)) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.anexo_nao_encontrado"));
        }
        return row;
    }

    private ConformidadeNaoConformidade requireNc(Long ncId) {
        if (ncId == null) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.id_invalido"));
        }
        ConformidadeNaoConformidade nc = ConformidadeNaoConformidade.findById(ncId);
        if (nc == null) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.nao_encontrada"));
        }
        return nc;
    }

    private Path getBasePath() {
        if (basePath != null && basePath.isPresent() && !basePath.get().isBlank()) {
            return Paths.get(basePath.get()).toAbsolutePath().normalize();
        }
        return Paths.get(System.getProperty("user.dir"), "uploads", "conformidade-nc")
                .toAbsolutePath()
                .normalize();
    }

    private String extensionFrom(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot > 0 && dot < fileName.length() - 1) {
            return fileName.substring(dot).toLowerCase(Locale.ROOT);
        }
        return "";
    }

    private String sanitizeFileName(String name) {
        if (name == null) {
            return "anexo";
        }
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private List<ConformidadeNcAnexoDto> toDtoList(List<ConformidadeNcAnexo> rows) {
        List<ConformidadeNcAnexoDto> out = new ArrayList<>();
        for (ConformidadeNcAnexo row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeNcAnexoDto toDto(ConformidadeNcAnexo row) {
        ConformidadeNcAnexoDto dto = new ConformidadeNcAnexoDto();
        dto.id = row.id;
        dto.ncId = row.ncId;
        dto.capaFase = row.capaFase != null ? row.capaFase.name() : null;
        dto.nomeArquivo = row.nomeArquivo;
        dto.nomeOriginal = row.nomeOriginal;
        dto.tipoArquivo = row.tipoArquivo;
        dto.tamanhoBytes = row.tamanhoBytes;
        dto.descricao = row.descricao;
        dto.usuarioId = row.usuarioId;
        dto.usuarioNome = row.usuarioNome;
        dto.dataUpload = row.dataUpload != null ? row.dataUpload.toString() : null;
        return dto;
    }
}
