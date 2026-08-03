package com.aerosuite.mapping;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.TipoServico;
import com.aerosuite.dto.OSDto;
import com.aerosuite.service.FabricanteService;
import com.aerosuite.service.FcuService;
import com.aerosuite.service.OsListMappingContext;
import jakarta.inject.Inject;
import org.mapstruct.AfterMapping;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class OSMapper {

    @Inject
    FabricanteService fabricanteService;

    @Inject
    FcuService fcuService;

    @Inject
    OsListMappingContext listMappingContext;

    @Mapping(target = "fileNames", ignore = true)
    @Mapping(target = "files", ignore = true)
    @Mapping(target = "fabricanteNome", ignore = true)
    @Mapping(target = "fcuCodigo", ignore = true)
    @Mapping(target = "fcuDescription", ignore = true)
    @Mapping(target = "fcuModelo", ignore = true)
    @Mapping(target = "fcuPn", ignore = true)
    @Mapping(target = "fcuSerialNumber", ignore = true)
    @Mapping(target = "idFabricante", ignore = true)
    @Mapping(target = "idFabricanteId", source = "idFabricante")
    @Mapping(target = "idFcu", ignore = true)
    @Mapping(target = "idFcuId", source = "idFcu")
    @Mapping(target = "fcu", ignore = true)
    @Mapping(target = "fabricante", ignore = true)
    @Mapping(target = "ata", ignore = true)
    @Mapping(target = "modelo", ignore = true)
    @Mapping(target = "pn", ignore = true)
    @Mapping(target = "nomeFabricante", ignore = true)
    @Mapping(target = "tipoServicoId", ignore = true)
    @Mapping(target = "tipoServicoObj", ignore = true)
    @Mapping(target = "solicitacaoTrocasItens", ignore = true)
    @Mapping(target = "tarefasDadosTecnicos", ignore = true)
    @Mapping(target = "crsEmitido", ignore = true)
    public abstract OSDto toDto(OS entity);

    @AfterMapping
    protected void mapCrs(OS entity, @MappingTarget OSDto dto) {
        if (entity == null || dto == null) {
            return;
        }
        dto.crsEmitido = entity.crsEmitidoEm != null;
        dto.crsEmitidoEm = entity.crsEmitidoEm;
        dto.crsCertificadoNumero = entity.crsCertificadoNumero;
        dto.crsLiberadoPorNome = entity.crsLiberadoPorNome;
        dto.crsLiberadoPorCargo = entity.crsLiberadoPorCargo;
    }

    @AfterMapping
    protected void mapFabricante(OS entity, @MappingTarget OSDto dto) {
        if (listMappingContext.skipRelationFetches()) {
            return;
        }
        if (entity != null && entity.idFabricante != null) {
            dto.idFabricante = fabricanteService.getById(entity.idFabricante);
            dto.fabricante = dto.idFabricante; // Também preencher o campo fabricante
        }
    }

    @AfterMapping
    protected void mapFcu(OS entity, @MappingTarget OSDto dto) {
        if (listMappingContext.skipRelationFetches()) {
            return;
        }
        if (entity != null && entity.idFcu != null) {
            dto.idFcu = fcuService.getById(entity.idFcu.longValue());
            dto.fcu = dto.idFcu; // Também preencher o campo fcu
        }
    }


    // Mapeamento explícito para criação - ignorar campos auto-gerados
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "idFabricante", ignore = true)
    @Mapping(target = "idFcu", ignore = true)
    @Mapping(target = "tipoServico", ignore = true)
    @Mapping(target = "emailTrocasNaoPagasEnviado", ignore = true)
    @Mapping(target = "crsEmitidoEm", ignore = true)
    @Mapping(target = "crsLiberadoPorUsuarioId", ignore = true)
    @Mapping(target = "crsLiberadoPorNome", ignore = true)
    @Mapping(target = "crsLiberadoPorCargo", ignore = true)
    @Mapping(target = "crsCertificadoNumero", ignore = true)
    @Mapping(target = "crsObservacoes", ignore = true)
    @Mapping(target = "crsChecklistJson", ignore = true)
    public abstract OS toEntity(OSDto dto);

    @AfterMapping
    protected void mapFabricanteId(OSDto dto, @MappingTarget OS entity) {
        if (dto != null) {
            // Se idFabricanteId está definido, usar ele
            if (dto.idFabricanteId != null) {
                entity.idFabricante = dto.idFabricanteId;
            }
            // Caso contrário, se idFabricante (FabricanteDto) está definido, extrair o ID
            else if (dto.idFabricante != null && dto.idFabricante.id() != null) {
                entity.idFabricante = dto.idFabricante.id();
            }
            // Caso contrário, se fabricante está definido, extrair o ID
            else if (dto.fabricante != null && dto.fabricante.id() != null) {
                entity.idFabricante = dto.fabricante.id();
            }
        }
    }

    @AfterMapping
    protected void mapFcuId(OSDto dto, @MappingTarget OS entity) {
        if (dto != null) {
            // Se idFcuId está definido, usar ele
            if (dto.idFcuId != null) {
                entity.idFcu = dto.idFcuId;
            }
            // Caso contrário, se idFcu (FcuDto) está definido, extrair o ID
            else if (dto.idFcu != null && dto.idFcu.id() != null) {
                entity.idFcu = dto.idFcu.id().intValue();
            }
            // Caso contrário, se fcu está definido, extrair o ID
            else if (dto.fcu != null && dto.fcu.id() != null) {
                entity.idFcu = dto.fcu.id().intValue();
            }
        }
    }

    @AfterMapping
    protected void mapTipoServicoNome(OSDto dto, @MappingTarget OS entity) {
        if (dto == null) {
            return;
        }
        
        try {
            // Se tipoServicoId está definido, buscar o nome do TipoServico
            if (dto.tipoServicoId != null) {
                try {
                    TipoServico tipoServico = TipoServico.find("id = ?1 and isActive = ?2", dto.tipoServicoId, true).firstResult();
                    if (tipoServico != null && tipoServico.nome != null) {
                        entity.tipoServico = tipoServico.nome;
                        return;
                    }
                } catch (Exception ignored) {
                    // Se falhar, continuar para outras opções
                }
            }
            // Caso contrário, se tipoServicoObj está definido, usar o nome
            if (dto.tipoServicoObj != null && dto.tipoServicoObj.nome() != null) {
                entity.tipoServico = dto.tipoServicoObj.nome();
                return;
            }
            // Caso contrário, se tipoServico (String) está definido, usar diretamente
            if (dto.tipoServico != null && !dto.tipoServico.isEmpty()) {
                entity.tipoServico = dto.tipoServico;
            }
        } catch (Exception ignored) {
            // Silenciosamente ignorar erros
        }
    }

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "idFabricante", ignore = true)
    @Mapping(target = "idFcu", ignore = true)
    @Mapping(target = "tipoServico", ignore = true)
    @Mapping(target = "emailTrocasNaoPagasEnviado", ignore = true)
    @Mapping(target = "crsEmitidoEm", ignore = true)
    @Mapping(target = "crsLiberadoPorUsuarioId", ignore = true)
    @Mapping(target = "crsLiberadoPorNome", ignore = true)
    @Mapping(target = "crsLiberadoPorCargo", ignore = true)
    @Mapping(target = "crsCertificadoNumero", ignore = true)
    @Mapping(target = "crsObservacoes", ignore = true)
    @Mapping(target = "crsChecklistJson", ignore = true)
    public abstract void updateEntityFromDto(OSDto dto, @MappingTarget OS entity);

    @AfterMapping
    protected void updateFabricanteId(OSDto dto, @MappingTarget OS entity) {
        if (dto != null) {
            // Se idFabricanteId está definido, usar ele
            if (dto.idFabricanteId != null) {
                entity.idFabricante = dto.idFabricanteId;
            }
            // Caso contrário, se idFabricante (FabricanteDto) está definido, extrair o ID
            else if (dto.idFabricante != null && dto.idFabricante.id() != null) {
                entity.idFabricante = dto.idFabricante.id();
            }
            // Caso contrário, se fabricante está definido, extrair o ID
            else if (dto.fabricante != null && dto.fabricante.id() != null) {
                entity.idFabricante = dto.fabricante.id();
            }
        }
    }

    @AfterMapping
    protected void updateFcuId(OSDto dto, @MappingTarget OS entity) {
        if (dto != null) {
            // Se idFcuId está definido, usar ele
            if (dto.idFcuId != null) {
                entity.idFcu = dto.idFcuId;
            }
            // Caso contrário, se idFcu (FcuDto) está definido, extrair o ID
            else if (dto.idFcu != null && dto.idFcu.id() != null) {
                entity.idFcu = dto.idFcu.id().intValue();
            }
            // Caso contrário, se fcu está definido, extrair o ID
            else if (dto.fcu != null && dto.fcu.id() != null) {
                entity.idFcu = dto.fcu.id().intValue();
            }
        }
    }

    @AfterMapping
    protected void updateTipoServicoNome(OSDto dto, @MappingTarget OS entity) {
        if (dto == null) {
            return;
        }
        
        try {
            // Se tipoServicoId está definido, buscar o nome do TipoServico
            if (dto.tipoServicoId != null) {
                try {
                    TipoServico tipoServico = TipoServico.find("id = ?1 and isActive = ?2", dto.tipoServicoId, true).firstResult();
                    if (tipoServico != null && tipoServico.nome != null) {
                        entity.tipoServico = tipoServico.nome;
                        return;
                    }
                } catch (Exception ignored) {
                    // Se falhar, continuar para outras opções
                }
            }
            // Caso contrário, se tipoServicoObj está definido, usar o nome
            if (dto.tipoServicoObj != null && dto.tipoServicoObj.nome() != null) {
                entity.tipoServico = dto.tipoServicoObj.nome();
                return;
            }
            // Caso contrário, se tipoServico (String) está definido, usar diretamente
            if (dto.tipoServico != null && !dto.tipoServico.isEmpty()) {
                entity.tipoServico = dto.tipoServico;
            }
        } catch (Exception ignored) {
            // Silenciosamente ignorar erros
        }
    }
}
