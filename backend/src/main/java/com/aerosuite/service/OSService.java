package com.aerosuite.service;

import org.jboss.logging.Logger;
import com.aerosuite.domain.TenantConstants;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsSolicitacaoTrocaItem;
import com.aerosuite.domain.TipoServico;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.Fabricante;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.FabricanteDto;
import com.aerosuite.dto.FcuDto;
import com.aerosuite.dto.OSFileDto;
import com.aerosuite.dto.OSPendenteTrocaPagamentoDto;
import com.aerosuite.dto.OsConsultaTrocasEventuaisLinhaDto;
import com.aerosuite.dto.OsPainelResumoDto;
import com.aerosuite.dto.OSSolicitacaoTrocaItemDto;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.dto.OSDto;
import com.aerosuite.mapping.OSMapper;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.OsReaberturaRequest;
import com.aerosuite.os.OsRegistroEncerradoGuard;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.NativeQueryTenant;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.hibernate.Hibernate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class OSService {
    @Inject OperacaoProntidaoGuard operacaoProntidao;
    @Inject OsAccessPolicy osAccess;

    private static final Logger LOG = Logger.getLogger(OSService.class);

    @Inject
    OSMapper mapper;
    
    @Inject
    OSFileService osFileService; // Pode ser null se não estiver disponível
    
    @Inject
    OSAuditoriaService auditoriaService;

    @Inject
    OsNotificacaoDeficitTrocaService osNotificacaoDeficitTrocaService;

    @Inject
    OsEstoqueSaidaAutomacaoService osEstoqueSaidaAutomacaoService;

    @Inject
    Event<OsServicoConcluidoEvent> osServicoConcluidoEvent;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    OsRegistroEncerradoGuard registroEncerradoGuard;

    @Inject
    OsTarefaDadoTecnicoService tarefaDadoTecnicoService;

    @Inject
    FcuService fcuService;

    @Inject
    FabricanteService fabricanteService;

    @Inject
    OsListMappingContext listMappingContext;

    @Inject
    InternalUserContext internalUser;

    @Inject
    NativeQueryTenant nativeQueryTenant;

    @PersistenceContext
    EntityManager em;

    private long currentTenantId() {
        return tenantDataAccess.currentTenantId();
    }

    private OS requireOS(Long id) {
        OS os = tenantDataAccess.requireOS(id);
        osAccess.visualizar(os);
        return os;
    }

    private OS requireOSByIdOs(Integer idOs) {
        OS os = tenantDataAccess.requireOSByIdOs(idOs);
        osAccess.visualizar(os);
        return os;
    }
    
    // Contexto do usuário atual (será preenchido pelo Resource)
    private String currentUserName;
    private String currentUserEmail;
    private Long currentUserId;
    private String currentIpOrigem;
    private String currentUserAgent;
    
    /**
     * Define o contexto do usuário atual para auditoria
     */
    public void setUserContext(String userName, String userEmail, Long userId, String ipOrigem, String userAgent) {
        this.currentUserName = userName;
        this.currentUserEmail = userEmail;
        this.currentUserId = userId;
        this.currentIpOrigem = ipOrigem;
        this.currentUserAgent = userAgent;
    }
    
    /**
     * Limpa o contexto do usuário
     */
    public void clearUserContext() {
        this.currentUserName = null;
        this.currentUserEmail = null;
        this.currentUserId = null;
        this.currentIpOrigem = null;
        this.currentUserAgent = null;
    }

    /** Contexto atual para auditoria de arquivos (upload/associação) durante create/update de OS. */
    public AuditoriaUsuarioContext buildAuditoriaUsuarioContext() {
        return new AuditoriaUsuarioContext(
            currentUserName != null ? currentUserName : "Usuário não identificado",
            currentUserEmail,
            currentUserId,
            currentIpOrigem != null ? currentIpOrigem : "IP não identificado",
            currentUserAgent
        );
    }

    /**
     * Preenche o tipoServicoId e tipoServicoObj no DTO baseado no nome do tipoServico.
     */
    private void fillTipoServicoInfo(OSDto dto, OS entity) {
        fillTipoServicoInfo(dto, entity, TipoServicoLookup.loadActive());
    }

    private void fillTipoServicoInfo(OSDto dto, OS entity, TipoServicoLookup lookup) {
        if (dto == null || entity == null || entity.tipoServico == null || entity.tipoServico.trim().isEmpty()) {
            return;
        }
        TipoServico tipoServico = lookup.resolve(entity.tipoServico.trim());
        if (tipoServico != null && tipoServico.id != null) {
            dto.tipoServicoId = tipoServico.id;
            dto.tipoServicoObj = new com.aerosuite.dto.TipoServicoDto(
                tipoServico.id,
                tipoServico.nome,
                tipoServico.isActive != null ? tipoServico.isActive : true
            );
        }
    }

    private static final class TipoServicoLookup {
        private final Map<Integer, TipoServico> byId = new HashMap<>();
        private final Map<String, TipoServico> byNameLower = new HashMap<>();

        static TipoServicoLookup loadActive() {
            TipoServicoLookup lookup = new TipoServicoLookup();
            List<TipoServico> tipos = TipoServico.find("isActive = ?1", true).list();
            if (tipos != null) {
                for (TipoServico ts : tipos) {
                    if (ts == null || ts.id == null) {
                        continue;
                    }
                    lookup.byId.put(ts.id, ts);
                    if (ts.nome != null) {
                        lookup.byNameLower.put(ts.nome.trim().toLowerCase(java.util.Locale.ROOT), ts);
                    }
                }
            }
            return lookup;
        }

        TipoServico resolve(String valorBusca) {
            if (valorBusca == null || valorBusca.isBlank()) {
                return null;
            }
            try {
                TipoServico byIdHit = byId.get(Integer.parseInt(valorBusca.trim()));
                if (byIdHit != null) {
                    return byIdHit;
                }
            } catch (NumberFormatException ignored) {
                // continua por nome
            }
            return byNameLower.get(valorBusca.trim().toLowerCase(java.util.Locale.ROOT));
        }
    }

    public PageResponse<OSDto> list(int page, int size, String sort, String q, Boolean isActive) {
        return list(page, size, sort, q, isActive, null, null);
    }
    public PageResponse<OSDto> list(int page, int size, String sort, String q, Boolean isActive, String fila, String status) {
        Sort.Direction sortDirection = Sort.Direction.Ascending;
        String sortField = "id";

        if (sort != null && !sort.isEmpty()) {
            String[] sortParts = sort.split(",");
            sortField = sortParts[0];
            if (sortParts.length > 1) {
                sortDirection = "desc".equalsIgnoreCase(sortParts[1]) ? Sort.Direction.Descending : Sort.Direction.Ascending;
            }
        }

        if (!Set.of("id", "idOs", "clienteNome", "dtAbertura", "createdAt", "updatedAt", "serialNumber", "partNumber", "numOsOriginal", "dataFechamento", "dataConclusaoServ", "tipoServico", "mecanicoResponsavelNome").contains(sortField)) sortField = "id";
        io.quarkus.panache.common.Page panachePage = Page.of(Math.max(0,page), Math.max(1,Math.min(200,size)));
        StringBuilder where = new StringBuilder("1 = 1");
        Map<String,Object> params = new HashMap<>();
        if (isActive == null || isActive) where.append(" and isActive = true");
        if (osAccess.mecanico()) { where.append(" and mecanicoResponsavelId = :mecanico"); params.put("mecanico",internalUser.getUserId()); }
        if (q != null && !q.isBlank()) {
            where.append(" and (lower(clienteNome) like :q or lower(serialNumber) like :q or lower(partNumber) like :q or lower(numOsOriginal) like :q or str(id) = :numero or str(idOs) = :numero)");
            params.put("q","%" + q.trim().toLowerCase(java.util.Locale.ROOT) + "%"); params.put("numero",q.trim());
        }
        if ("SEM_MECANICO".equals(fila) || "ALERTA_5_DIAS".equals(fila)) where.append(" and mecanicoResponsavelId is null and dataConclusaoServ is null");
        if ("ALERTA_5_DIAS".equals(fila)) { where.append(" and dtAbertura < :limite"); params.put("limite",LocalDate.now().minusDays(5)); }
        if (status != null && !status.isBlank()) {
            where.append(switch(status) {
                case "AGUARDANDO_DISTRIBUICAO" -> " and mecanicoResponsavelId is null and dataConclusaoServ is null and dataFechamento is null";
                case "ATRIBUIDA" -> " and mecanicoResponsavelId is not null and (statusExecucao is null or statusExecucao = 'NAO_INICIADA') and dataConclusaoServ is null and dataFechamento is null";
                case "EM_EXECUCAO" -> " and statusExecucao = 'EM_ANDAMENTO' and dataFechamento is null";
                case "PAUSADA" -> " and statusExecucao = 'PAUSADA' and dataFechamento is null";
                case "CONCLUIDA" -> " and (execucaoFinalizadaEm is not null or dataConclusaoServ is not null) and dataFechamento is null";
                case "FECHADA" -> " and dataFechamento is not null";
                default -> throw new jakarta.ws.rs.BadRequestException("Status operacional inválido.");
            });
        }
        var query = OS.find(where.toString(), Sort.by(sortField, sortDirection), params);
        long totalElements = query.count();
        List<OS> entities = query.page(panachePage).list();
        TipoServicoLookup tipoLookup = TipoServicoLookup.loadActive();

        List<OSDto> dtos;
        listMappingContext.beginListBatch();
        try {
            dtos = entities.stream()
                    .map(entity -> {
                    osAccess.visualizar(entity);
                        OSDto dto = mapper.toDto(entity);
                        fillTipoServicoInfo(dto, entity, tipoLookup);
                        dto.files = Collections.emptyList();
                        return dto;
                    })
                    .collect(Collectors.toList());
            enrichListRelations(dtos, entities);
        } finally {
            listMappingContext.endListBatch();
        }

        attachTrocasBatch(dtos);
        attachNaoConformidades(dtos);
        marcarOsComDeficitKitFcuListagem(dtos);

        int totalPages = (int) Math.ceil((double) totalElements / panachePage.size);
        return new PageResponse<OSDto>(dtos, totalElements, totalPages, panachePage.index, panachePage.size, sort);
    }

    private void enrichListRelations(List<OSDto> dtos, List<OS> entities) {
        if (dtos == null || entities == null || dtos.isEmpty() || entities.size() != dtos.size()) {
            return;
        }
        Set<Integer> fcuIds = entities.stream()
                .map(e -> e.idFcu)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Integer> fabricanteIds = entities.stream()
                .map(e -> e.idFabricante)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, FcuDto> fcuById = fcuService.findActiveByIds(fcuIds);
        Map<Integer, FabricanteDto> fabricanteById = fabricanteService.findByIds(fabricanteIds);
        for (int i = 0; i < dtos.size(); i++) {
            OSDto dto = dtos.get(i);
            OS entity = entities.get(i);
            if (entity.idFcu != null) {
                FcuDto fcu = fcuById.get(entity.idFcu);
                if (fcu != null) {
                    dto.idFcu = fcu;
                    dto.fcu = fcu;
                    applyFcuFlatFields(dto, fcu);
                }
            }
            if (entity.idFabricante != null) {
                FabricanteDto fabricante = fabricanteById.get(entity.idFabricante);
                if (fabricante != null) {
                    dto.idFabricante = fabricante;
                    dto.fabricante = fabricante;
                    dto.fabricanteNome = fabricante.nome();
                    dto.nomeFabricante = fabricante.nome();
                }
            }
        }
    }

    private static void applyFcuFlatFields(OSDto dto, FcuDto fcu) {
        if (dto == null || fcu == null) {
            return;
        }
        dto.fcuCodigo = fcu.fcuCodigo();
        dto.fcuDescription = fcu.fcuDescription();
        dto.fcuModelo = fcu.modelo();
        dto.fcuPn = fcu.pn();
        dto.fcuSerialNumber = fcu.serialNumber();
        dto.ata = fcu.ataManual();
        dto.modelo = fcu.modelo();
        dto.pn = fcu.pn();
    }

    /**
     * Indicador na listagem — lê {@code os_kit_fcu_deficit} sem recalcular estoque (rápido).
     */
    private void marcarOsComDeficitKitFcuListagem(List<OSDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }
        Set<Long> ids = dtos.stream()
                .map(d -> d.id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return;
        }
        Set<Long> comDeficit = osEstoqueSaidaAutomacaoService.osIdsComDeficitPersistido(ids);
        for (OSDto d : dtos) {
            d.temDeficitKitFcu = d.id != null && comDeficit.contains(d.id);
        }
    }

    /**
     * Marca o flag {@code temDeficitKitFcu} em cada DTO da lista, com uma única consulta agregada.
     */
    private void marcarOsComDeficitKitFcu(List<OSDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }
        Set<Long> ids = dtos.stream()
                .map(d -> d.id)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return;
        }
        Set<Long> comDeficit;
        try {
            comDeficit = osEstoqueSaidaAutomacaoService.filtrarOsIdsComDeficitKitFcu(ids);
        } catch (Exception e) {
            LOG.warnf(e, "OSService - falha ao consultar deficit kit FCU em lote: %s", e.getMessage());
            comDeficit = Set.of();
        }
        for (OSDto d : dtos) {
            d.temDeficitKitFcu = d.id != null && comDeficit.contains(d.id);
        }
    }

    public Optional<OSDto> findById(Long id) {
        return OS.<OS>find("id = ?1 and isActive = ?2", id, true)
                .firstResultOptional()
                .map(entity -> {
                    osAccess.visualizar(entity);
                    OSDto dto = mapper.toDto(entity);
                    // Preencher tipoServicoId e tipoServicoObj
                    fillTipoServicoInfo(dto, entity);
                    // Carregar arquivos associados
                    try {
                        if (osFileService != null) {
                            dto.files = osFileService.getFilesByOSId(entity.id);
                        } else {
                            dto.files = new ArrayList<>();
                        }
                    } catch (Exception e) {
                        LOG.warnf(e, "Erro ao carregar arquivos da OS %s: %s", entity.id, e.getMessage());
                        LOG.warnf(e, "Erro inesperado");
                        dto.files = new ArrayList<>();
                    }
                    attachTrocasToDto(dto, entity.id);
                    tarefaDadoTecnicoService.attachToDto(dto, entity.id);
                    marcarOsComDeficitKitFcu(List.of(dto));
                    return dto;
                });
    }

    public Optional<OSDto> findByIdOs(Integer idOs) {
        return OS.<OS>find("idOs = ?1 and isActive = ?2", idOs, true)
                .firstResultOptional()
                .map(entity -> {
                    osAccess.visualizar(entity);
                    OSDto dto = mapper.toDto(entity);
                    // Preencher tipoServicoId e tipoServicoObj
                    fillTipoServicoInfo(dto, entity);
                    // Carregar arquivos associados
                    try {
                        if (osFileService != null) {
                            dto.files = osFileService.getFilesByOSId(entity.id);
                        } else {
                            dto.files = new ArrayList<>();
                        }
                    } catch (Exception e) {
                        LOG.warnf(e, "Erro ao carregar arquivos da OS %s: %s", entity.id, e.getMessage());
                        LOG.warnf(e, "Erro inesperado");
                        dto.files = new ArrayList<>();
                    }
                    attachTrocasToDto(dto, entity.id);
                    tarefaDadoTecnicoService.attachToDto(dto, entity.id);
                    marcarOsComDeficitKitFcu(List.of(dto));
                    return dto;
                });
    }

    @Transactional
    public OSDto create(OSDto dto) {
        osAccess.criar();
        
        if (dto == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.OS_DTO_NULL));
        }
        
        // Garantir valores padrão antes de mapear
        if (dto.dtAbertura == null) {
            dto.dtAbertura = java.time.LocalDate.now();
        }
        if (dto.isActive == null) {
            dto.isActive = true;
        }
        
        // Usar o mapper para criar a entidade (já tem toda a lógica de mapeamento)
        OS entity = mapper.toEntity(dto);
        
        
        // Usar dados do FCU que já vêm no DTO (dto.idFcu ou dto.fcu)
        com.aerosuite.dto.FcuDto fcuDto = dto.idFcu != null ? dto.idFcu : dto.fcu;
        if (fcuDto != null) {
            
            // Preencher campos da OS com dados do FCU do DTO
            if (fcuDto.serialNumber() != null) {
                entity.serialNumber = fcuDto.serialNumber();
            }
            if (fcuDto.ataManual() != null) {
                entity.ataManual = fcuDto.ataManual();
            }
            if (fcuDto.dataRevManual() != null) {
                entity.dataRevManual = fcuDto.dataRevManual();
            }
            if (fcuDto.numRevisao() != null) {
                entity.numRevisao = fcuDto.numRevisao();
            }
            if (fcuDto.pn() != null) {
                entity.partNumber = fcuDto.pn();
            }
            
            // Se idFabricante não foi fornecido, usar o do FCU
            if ((entity.idFabricante == null || entity.idFabricante == 0) && fcuDto.idFabricante() != null) {
                entity.idFabricante = fcuDto.idFabricante();
            }
            
        } else {
            // Se não tem FCU no DTO, usar os valores do DTO diretamente
            entity.serialNumber = dto.serialNumber;
            entity.ataManual = dto.ataManual;
            entity.dataRevManual = dto.dataRevManual;
            entity.numRevisao = dto.numRevisao;
            entity.partNumber = dto.partNumber;
        }
        
        
        // Garantir valores finais antes de persistir
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        if (entity.dtAbertura == null) {
            entity.dtAbertura = java.time.LocalDate.now();
        }
        entity.tenantId = TenantConstants.tenantIdOf(currentTenantId());
        if (entity.idOs == null || entity.idOs == 0) {
            entity.idOs = alocarProximoIdOs(entity.tenantId);
        } else {
            assertIdOsDisponivel(entity.tenantId, entity.idOs, null);
        }
        
        // Validar foreign keys verificando se existem no banco de dados
        if (entity.idFcu != null && entity.idFcu > 0) {
            // Verificar se o FCU existe no banco de dados
            Fcu fcu = Fcu.findById(entity.idFcu);
            if (fcu == null) {
                throw new IllegalArgumentException(
                        ApiI18nMessages.encode(ApiI18nMessages.OS_FCU_NOT_FOUND, "id", String.valueOf(entity.idFcu)));
            }
            if (fcu.isActive != null && !fcu.isActive) {
                throw new IllegalArgumentException(
                        ApiI18nMessages.encode(ApiI18nMessages.OS_FCU_INACTIVE, "id", String.valueOf(entity.idFcu)));
            }
        }
        
        if (entity.idFabricante != null && entity.idFabricante > 0) {
            Fabricante fabricante = Fabricante.findById(entity.idFabricante);
            if (fabricante == null) {
                throw new IllegalArgumentException(
                        ApiI18nMessages.encode(
                                ApiI18nMessages.OS_FABRICANTE_NOT_FOUND, "id", String.valueOf(entity.idFabricante)));
            }
            if (fabricante.isActive != null && !fabricante.isActive) {
                throw new IllegalArgumentException(
                        ApiI18nMessages.encode(
                                ApiI18nMessages.OS_FABRICANTE_INACTIVE, "id", String.valueOf(entity.idFabricante)));
            }
        }
        
        // Validação final dos campos obrigatórios
        if (entity.dtAbertura == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OS_DT_ABERTURA_REQUIRED));
        }
        if (entity.idOs == null || entity.idOs == 0) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OS_ID_OS_REQUIRED));
        }
        
        
        try {
            // Persistir a entidade
            entity.persist();
            em.flush(); // Forçar a geração do ID
            
            
            // Registrar auditoria de criação
            try {
                if (auditoriaService != null) {
                    auditoriaService.registrarCriacao(
                        entity,
                        currentUserName != null ? currentUserName : "Sistema",
                        currentUserEmail,
                        currentUserId,
                        currentIpOrigem,
                        currentUserAgent
                    );
                } else {
                    LOG.warn("OSService.create - ERRO: auditoriaService é NULL!");
                }
            } catch (Exception auditEx) {
                LOG.warnf(auditEx, "OSService.create - ERRO ao registrar auditoria: %s", auditEx.getMessage());
                LOG.warnf(auditEx, "Erro inesperado");
            }
        } catch (IllegalArgumentException e) {
            // Propagação direta de IllegalArgumentException (validações de negócio)
            LOG.warnf(e, "OSService.create - Erro de validação: %s", e.getMessage());
            throw e;
        } catch (jakarta.persistence.PersistenceException e) {
            LOG.warnf(e, "OSService.create - Erro de persistência: %s", e.getMessage());
            if (e.getCause() != null) {
                LOG.warnf(e, "  - Causa: %s", e.getCause().getMessage());
                if (e.getCause().getCause() != null) {
                    LOG.warnf(e, "  - Causa raiz: %s", e.getCause().getCause().getMessage());
                }
            }
            LOG.warn("OSService.create - Estado da entidade antes do erro:");
            LOG.warnf("  - id: %s", entity.id);
            LOG.warnf("  - idOs: %s", entity.idOs);
            LOG.warnf("  - dtAbertura: %s", entity.dtAbertura);
            LOG.warnf("  - isActive: %s", entity.isActive);
            LOG.warnf("  - idFabricante: %s", entity.idFabricante);
            LOG.warnf("  - idFcu: %s", entity.idFcu);
            LOG.warnf("  - clienteNome: %s", entity.clienteNome);
            LOG.warnf(e, "Erro inesperado");
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.OS_CREATE_FAILED), e);
        } catch (Exception e) {
            LOG.warnf(e, "OSService.create - Erro ao persistir: %s", e.getMessage());
            LOG.warn("OSService.create - Estado da entidade antes do erro:");
            LOG.warnf("  - id: %s", entity.id);
            LOG.warnf("  - idOs: %s", entity.idOs);
            LOG.warnf("  - dtAbertura: %s", entity.dtAbertura);
            LOG.warnf("  - isActive: %s", entity.isActive);
            LOG.warnf("  - clienteNome: %s", entity.clienteNome);
            if (e.getCause() != null) {
                LOG.warnf(e, "  - Causa: %s", e.getCause().getMessage());
            }
            LOG.warnf(e, "Erro inesperado");
            throw e;
        }
        
        OSDto result = mapper.toDto(entity);
        // Preencher tipoServicoId e tipoServicoObj
        fillTipoServicoInfo(result, entity);
        
        // Processar arquivos se fornecidos
        try {
            if (osFileService != null && dto != null && dto.fileNames != null && !dto.fileNames.isEmpty()) {
                List<OSFileDto> associatedFiles = osFileService.associateFilesToOS(
                    entity.id, dto.fileNames, buildAuditoriaUsuarioContext());
                result.files = associatedFiles;
            } else {
                result.files = new ArrayList<>();
            }
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao processar arquivos da OS %s: %s", entity.id, e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            result.files = new ArrayList<>();
        }

        boolean notificarSolicitacaoTroca = replaceSolicitacaoTrocasItems(entity.id, dto);
        replaceTarefasDadosTecnicos(entity.id, dto);
        // Kit FCU em modo tolerante: faltas são sinalizadas pela notificação de déficit (logo abaixo),
        // não devem bloquear a criação da OS.
        try {
            osEstoqueSaidaAutomacaoService.registrarKitFcuAposSalvarOs(entity, currentUserId, currentUserName);
        } catch (Exception e) {
            LOG.warnf(e, "OSService.create - kit FCU não baixado totalmente (OS %s, FCU %s): %s",
                    entity.id, entity.idFcu, e.getMessage());
        }
        attachTrocasToDto(result, entity.id);
        tarefaDadoTecnicoService.attachToDto(result, entity.id);
        marcarOsComDeficitKitFcu(List.of(result));
        if (notificarSolicitacaoTroca) {
            osNotificacaoDeficitTrocaService.criarNotificacaoSolicitacaoTrocaEventual(entity.id);
        }
        notificarItensNaoPagosSeNecessario(entity);
        try {
            osNotificacaoDeficitTrocaService.criarSeDeficitAposSalvarOs(entity);
        } catch (Exception e) {
            LOG.warnf(e, "OSService.create - notificação déficit trocas: %s", e.getMessage());
        }
        
        return result;
    }

    @Transactional
    public OSDto update(Long id, OSDto dto) {
        
        OS entity = requireOS(id);
        registroEncerradoGuard.assertMutacaoPermitida(entity);
        if (dto == null) throw new jakarta.ws.rs.BadRequestException("Informe os dados da OS.");
        String escopo = osAccess.escopo(entity);
        if ("NENHUM".equals(escopo)) throw new jakarta.ws.rs.ForbiddenException("OS disponível somente para consulta neste perfil.");
        if (!"TOTAL".equals(escopo)) {
            if (Boolean.FALSE.equals(dto.isActive)) throw new jakarta.ws.rs.ForbiddenException("Sem permissão para excluir OS.");
            OS anterior = copiarOS(entity);
            if ("MECANICO".equals(escopo)) {
                if (dto.tipoServicoId != null) {
                    TipoServico tipo = TipoServico.find("id = ?1 and isActive = true", dto.tipoServicoId).firstResult();
                    if (tipo == null) throw new jakarta.ws.rs.BadRequestException("Tipo de serviço inválido.");
                    entity.tipoServico = tipo.nome;
                }
                entity.inicioServico = dto.inicioServico; entity.fimServico = dto.fimServico;
                if (dto.dataFechamento != null) operacaoProntidao.conferir(entity.id, "ENTREGA");
                entity.dataFechamento = dto.dataFechamento;
            } else {
                entity.manualPn = dto.manualPn; entity.numRevisao = dto.numRevisao; entity.dataRevManual = dto.dataRevManual;
                entity.ataManual = dto.ataManual; entity.tituloAds = dto.tituloAds; entity.tituloAfins = dto.tituloAfins;
                entity.boletinsServAfins = dto.boletinsServAfins;
            }
            entity.updatedAt = LocalDateTime.now(); entity.jaEditada = true;
            auditoriaService.registrarAlteracao(anterior, entity, currentUserName, currentUserEmail, currentUserId, currentIpOrigem, currentUserAgent);
            OSDto result = mapper.toDto(entity); fillTipoServicoInfo(result, entity);
            attachTrocasToDto(result, entity.id); tarefaDadoTecnicoService.attachToDto(result, entity.id);
            return result;
        }
        
        
        // Se o DTO contém isActive=false, fazer soft delete (inativar)
        if (dto != null && dto.isActive != null && !dto.isActive) {
            OSDto result = delete(id);
            return result;
        }
        
        
        // Fazer cópia do estado anterior para auditoria
        OS osAnterior = copiarOS(entity);
        
        // Caso contrário, atualizar normalmente
        // Salvar o valor atual de isActive antes do update
        Boolean currentIsActive = entity.isActive;
        entity.jaEditada = true;
        if (dto.dataFechamento != null) operacaoProntidao.conferir(entity.id, "ENTREGA");
        mapper.updateEntityFromDto(dto, entity);
        entity.updatedAt = LocalDateTime.now();
        // Restaurar o valor de isActive (não permitir alterar diretamente pelo update normal)
        entity.isActive = currentIsActive;
        entity.persist(); // Persist changes
        
        // Registrar auditoria de alteração
        try {
            if (auditoriaService != null) {
                auditoriaService.registrarAlteracao(
                    osAnterior,
                    entity,
                    currentUserName != null ? currentUserName : "Sistema",
                    currentUserEmail,
                    currentUserId,
                    currentIpOrigem,
                    currentUserAgent
                );
            } else {
                LOG.warn("OSService.update - ERRO: auditoriaService é NULL!");
            }
        } catch (Exception auditEx) {
            LOG.warnf(auditEx, "OSService.update - ERRO ao registrar auditoria: %s", auditEx.getMessage());
            LOG.warnf(auditEx, "Erro inesperado");
        }
        
        OSDto result = mapper.toDto(entity);
        // Preencher tipoServicoId e tipoServicoObj
        fillTipoServicoInfo(result, entity);
        
        // Processar arquivos se fornecidos
        try {
            if (osFileService != null) {
                if (dto != null && dto.fileNames != null && !dto.fileNames.isEmpty()) {
                    List<OSFileDto> associatedFiles = osFileService.associateFilesToOS(
                        entity.id, dto.fileNames, buildAuditoriaUsuarioContext());
                    result.files = associatedFiles;
                } else {
                    // Carregar arquivos existentes
                    result.files = osFileService.getFilesByOSId(entity.id);
                }
            } else {
                result.files = new ArrayList<>();
            }
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao processar arquivos da OS %s: %s", entity.id, e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            result.files = new ArrayList<>();
        }

        boolean notificarSolicitacaoTrocaUpd = replaceSolicitacaoTrocasItems(entity.id, dto);
        replaceTarefasDadosTecnicos(entity.id, dto);
        // Kit FCU só dispara no update quando o FCU é DEFINIDO AGORA (estava nulo/zero antes).
        // Edição de OS que já tinha FCU não deve voltar a tentar consumir o kit (evita falhas em OS
        // legadas e duplo débito; idempotência por chave já protege casos dentro do mesmo fluxo).
        boolean fcuRecemAdicionada = (osAnterior == null || osAnterior.idFcu == null || osAnterior.idFcu <= 0)
                && entity != null && entity.idFcu != null && entity.idFcu > 0;
        if (fcuRecemAdicionada) {
            try {
                osEstoqueSaidaAutomacaoService.registrarKitFcuAposSalvarOs(entity, currentUserId, currentUserName);
            } catch (Exception e) {
                // Não propagar: a OS já foi atualizada e auditada. Apenas registra para suporte.
                LOG.warnf(e, "OSService.update - kit FCU não baixado automaticamente (OS %s, FCU %s): %s",
                        entity.id, entity.idFcu, e.getMessage());
            }
        }
        attachTrocasToDto(result, entity.id);
        tarefaDadoTecnicoService.attachToDto(result, entity.id);
        marcarOsComDeficitKitFcu(List.of(result));
        if (notificarSolicitacaoTrocaUpd) {
            osNotificacaoDeficitTrocaService.criarNotificacaoSolicitacaoTrocaEventual(entity.id);
        }
        notificarItensNaoPagosSeNecessario(entity);
        try {
            osNotificacaoDeficitTrocaService.criarSeDeficitAposSalvarOs(entity);
        } catch (Exception e) {
            LOG.warnf(e, "OSService.update - notificação déficit trocas: %s", e.getMessage());
        }

        if (BlingPropostaFluxoService.transitionedToConcluded(osAnterior, entity)) {
            osServicoConcluidoEvent.fire(new OsServicoConcluidoEvent(currentTenantId(), entity.id));
        }
        
        return result;
    }

    @Transactional
    public OSDto delete(Long id) {

        OS entity = requireOS(id);
        if (!"TOTAL".equals(osAccess.escopo(entity))) throw new jakarta.ws.rs.ForbiddenException("Sem permissão para excluir OS.");
        registroEncerradoGuard.assertMutacaoPermitida(entity);


        // Se já está inativo, apenas retorna o DTO atual
        if (entity.isActive != null && !entity.isActive) {
            OSDto dto = mapper.toDto(entity);
            fillTipoServicoInfo(dto, entity);
            return dto;
        }

        // Soft delete: marcar como inativa e atualizar o timestamp
        entity.isActive = false;
        entity.updatedAt = LocalDateTime.now();
        entity.persist(); // Persistir a mudança
        
        // Registrar auditoria de exclusão
        try {
            auditoriaService.registrarExclusao(
                entity,
                currentUserName != null ? currentUserName : "Sistema",
                currentUserEmail,
                currentUserId,
                currentIpOrigem,
                currentUserAgent
            );
        } catch (Exception auditEx) {
            LOG.warnf(auditEx, "OSService.delete - Erro ao registrar auditoria (não crítico): %s", auditEx.getMessage());
        }

        OSDto dto = mapper.toDto(entity);
        fillTipoServicoInfo(dto, entity);
        return dto;
    }
    
    /**
     * Cria uma cópia da OS para comparação na auditoria
     */
    private OS copiarOS(OS original) {
        OS copia = new OS();
        copia.id = original.id;
        copia.tenantId = original.tenantId;
        copia.idOs = original.idOs;
        copia.adsDas = original.adsDas;
        copia.ataManual = original.ataManual;
        copia.clienteNome = original.clienteNome;
        copia.dataConclusaoServ = original.dataConclusaoServ;
        copia.dataFechamento = original.dataFechamento;
        copia.dataRevManual = original.dataRevManual;
        copia.dtAbertura = original.dtAbertura;
        copia.idFabricante = original.idFabricante;
        copia.idFcu = original.idFcu;
        copia.tsn = original.tsn;
        copia.tso = original.tso;
        copia.marcasMatricula = original.marcasMatricula;
        copia.motor = original.motor;
        copia.snMotor = original.snMotor;
        copia.manualPn = original.manualPn;
        copia.numOsOriginal = original.numOsOriginal;
        copia.numRevisao = original.numRevisao;
        copia.obsConclusaoServ = original.obsConclusaoServ;
        copia.obsFimServ = original.obsFimServ;
        copia.serialNumber = original.serialNumber;
        copia.obsIniServ = original.obsIniServ;
        copia.inicioServico = original.inicioServico;
        copia.fimServico = original.fimServico;
        copia.tipoServico = original.tipoServico;
        copia.tituloAds = original.tituloAds;
        copia.tituloAfins = original.tituloAfins;
        copia.boletinsServAfins = original.boletinsServAfins;
        copia.partNumber = original.partNumber;
        copia.solicitacaoTrocasComentario = original.solicitacaoTrocasComentario;
        copia.emailTrocasNaoPagasEnviado = original.emailTrocasNaoPagasEnviado;
        copia.createdAt = original.createdAt;
        copia.updatedAt = original.updatedAt;
        copia.createdBy = original.createdBy;
        copia.isActive = original.isActive;
        return copia;
    }
    
    @Transactional
    public OSDto inactivate(Long id) {
        return delete(id); // Alias para delete (soft delete)
    }

    /**
     * Reabre OS encerrada (data de fechamento e/ou CRS) com justificativa e trilha REABERTURA.
     */
    @Transactional
    public OSDto reabrir(Long id, OsReaberturaRequest req, AuditoriaUsuarioContext ctx) {
        OS entity = requireOS(id);
        registroEncerradoGuard.assertPodeReabrir(internalUser.getPerfilCodigo());
        registroEncerradoGuard.assertJustificativaValida(req != null ? req.justificativa : null);

        if (!registroEncerradoGuard.isRegistroEncerrado(entity)) {
            throw new BadRequestException(OsRegistroEncerradoGuard.ERROR_REABERTURA_NAO_NECESSARIA);
        }

        boolean crsAnulado = entity.crsEmitidoEm != null;
        String justificativa = req.justificativa.trim();

        entity.dataFechamento = null;
        if (crsAnulado) {
            entity.crsEmitidoEm = null;
            entity.crsLiberadoPorUsuarioId = null;
            entity.crsLiberadoPorNome = null;
            entity.crsLiberadoPorCargo = null;
            entity.crsCertificadoNumero = null;
            entity.crsObservacoes = null;
            entity.crsChecklistJson = null;
        }
        entity.updatedAt = LocalDateTime.now();
        entity.persist();

        String nome = ctx != null && ctx.nome != null ? ctx.nome : currentUserName;
        String email = ctx != null ? ctx.email : currentUserEmail;
        Long uid = ctx != null && ctx.userId != null ? ctx.userId : currentUserId;
        String ip = ctx != null ? ctx.ip : currentIpOrigem;
        String ua = ctx != null ? ctx.userAgent : currentUserAgent;

        if (auditoriaService != null) {
            auditoriaService.registrarReabertura(
                    entity, justificativa, crsAnulado, nome, email, uid, ip, ua);
        }

        OSDto result = mapper.toDto(entity);
        fillTipoServicoInfo(result, entity);
        return result;
    }

    @Transactional
    public OSDto deleteByIdOs(Integer idOs) {
        OS entity = requireOSByIdOs(idOs);
        if (!"TOTAL".equals(osAccess.escopo(entity))) throw new jakarta.ws.rs.ForbiddenException("Sem permissão para excluir OS.");
        registroEncerradoGuard.assertMutacaoPermitida(entity);
        
        // Soft delete - inativar ao invés de deletar fisicamente
        entity.isActive = false;
        entity.updatedAt = LocalDateTime.now();
        entity.persist();
        return mapper.toDto(entity);
    }

    public List<OSPendenteTrocaPagamentoDto> listPendentesPagamentoTrocas() {
        if (!podeMarcarPagoTrocas()) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.OS_TROCA_PAGAMENTO_FORBIDDEN));
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = nativeQueryTenant.bindFilterTid(em.createNativeQuery(
                """
                SELECT o.id, o.id_os, o.cliente_nome, COUNT(i.id)
                FROM os o
                INNER JOIN os_solicitacao_troca_item i ON i.os_id = o.id
                WHERE o.is_active = 1 AND o.tenant_id = :filterTid AND (i.pago IS NULL OR i.pago = 0)
                GROUP BY o.id, o.id_os, o.cliente_nome
                ORDER BY o.id DESC
                """
        )).getResultList();
        List<OSPendenteTrocaPagamentoDto> out = new ArrayList<>();
        for (Object row : rows) {
            Object[] r = (Object[]) row;
            Long oid = ((Number) r[0]).longValue();
            Integer idOs = r[1] != null ? ((Number) r[1]).intValue() : null;
            String cliente = r[2] != null ? r[2].toString() : null;
            int cnt = r[3] != null ? ((Number) r[3]).intValue() : 0;
            out.add(new OSPendenteTrocaPagamentoDto(oid, idOs, cliente, cnt));
        }
        return out;
    }

    /**
     * Lista paginada de OS ativas com solicitação de trocas eventuais (itens na tabela e/ou comentário preenchido).
     */
    @SuppressWarnings("unchecked")
    public PageResponse<OsConsultaTrocasEventuaisLinhaDto> listConsultaTrocasEventuais(int page, int size, String sort, String q) {
        if (size < 1) {
            size = 10;
        }
        if (size > 200) {
            size = 200;
        }
        if (page < 0) {
            page = 0;
        }

        String sortCol = "sub.id";
        String sortDir = "DESC";
        if (sort != null && !sort.isBlank()) {
            String[] p = sort.split(",");
            String f = p[0].trim();
            if (p.length > 1 && "asc".equalsIgnoreCase(p[1].trim())) {
                sortDir = "ASC";
            }
            sortCol = switch (f) {
                case "idOs" -> "sub.id_os";
                case "clienteNome" -> "sub.cliente_nome";
                case "dtAbertura" -> "sub.dt_abertura";
                case "quantidadeItens" -> "sub.n_itens";
                case "itensPagoPendente" -> "sub.n_pend";
                case "itensPagoSim" -> "sub.n_sim";
                case "itensPagoNao" -> "sub.n_nao";
                case "temComentario" -> "sub.tem_com";
                default -> "sub.id";
            };
        }

        StringBuilder search = new StringBuilder();
        Map<String, Object> params = new HashMap<>();
        if (q != null && !q.trim().isEmpty()) {
            String t = q.trim();
            search.append(" AND (LOWER(o.cliente_nome) LIKE :q ");
            params.put("q", "%" + t.toLowerCase(Locale.ROOT) + "%");
            try {
                long n = Long.parseLong(t);
                search.append(" OR o.id = :qid ");
                params.put("qid", n);
                if (n >= Integer.MIN_VALUE && n <= Integer.MAX_VALUE) {
                    search.append(" OR o.id_os = :qidos ");
                    params.put("qidos", (int) n);
                }
            } catch (NumberFormatException ignored) {
                // texto: só filtro por cliente
            }
            search.append(")");
        }

        String baseWhere = """
                o.is_active = 1 AND o.tenant_id = :filterTid AND (
                  EXISTS (SELECT 1 FROM os_solicitacao_troca_item x WHERE x.os_id = o.id)
                  OR (o.solicitacao_trocas_comentario IS NOT NULL AND TRIM(o.solicitacao_trocas_comentario) <> '')
                )
                """ + search;

        String countSql = "SELECT COUNT(*) FROM os o WHERE " + baseWhere;
        var qc = nativeQueryTenant.bindFilterTid(em.createNativeQuery(countSql));
        for (Map.Entry<String, Object> e : params.entrySet()) {
            qc.setParameter(e.getKey(), e.getValue());
        }
        long totalElements = ((Number) qc.getSingleResult()).longValue();

        int offset = page * size;
        String dataSql = """
                SELECT * FROM (
                  SELECT o.id, o.id_os, o.cliente_nome, o.dt_abertura,
                    COUNT(i.id) AS n_itens,
                    COALESCE(SUM(CASE WHEN i.pago IS NULL THEN 1 ELSE 0 END), 0) AS n_pend,
                    COALESCE(SUM(CASE WHEN i.pago = 1 THEN 1 ELSE 0 END), 0) AS n_sim,
                    COALESCE(SUM(CASE WHEN i.pago = 0 THEN 1 ELSE 0 END), 0) AS n_nao,
                    MAX(CASE WHEN o.solicitacao_trocas_comentario IS NOT NULL AND TRIM(o.solicitacao_trocas_comentario) <> '' THEN 1 ELSE 0 END) AS tem_com
                  FROM os o
                  LEFT JOIN os_solicitacao_troca_item i ON i.os_id = o.id
                  """
                + " WHERE "
                + baseWhere
                + """
                  GROUP BY o.id, o.id_os, o.cliente_nome, o.dt_abertura
                ) sub
                """
                + " ORDER BY "
                + sortCol
                + " "
                + sortDir
                + " LIMIT "
                + offset
                + ", "
                + size;

        var qd = nativeQueryTenant.bindFilterTid(em.createNativeQuery(dataSql));
        for (Map.Entry<String, Object> e : params.entrySet()) {
            qd.setParameter(e.getKey(), e.getValue());
        }
        List<Object[]> rows = qd.getResultList();
        List<OsConsultaTrocasEventuaisLinhaDto> items = new ArrayList<>();
        for (Object row : rows) {
            Object[] r = (Object[]) row;
            OsConsultaTrocasEventuaisLinhaDto dto = new OsConsultaTrocasEventuaisLinhaDto();
            dto.id = ((Number) r[0]).longValue();
            dto.idOs = r[1] != null ? ((Number) r[1]).intValue() : null;
            if (dto.idOs == null || dto.idOs == 0) {
                dto.idOs = dto.id != null ? dto.id.intValue() : null;
            }
            dto.clienteNome = r[2] != null ? r[2].toString() : null;
            dto.dtAbertura = toLocalDateSql(r[3]);
            dto.quantidadeItens = r[4] != null ? ((Number) r[4]).intValue() : 0;
            dto.itensPagoPendente = r[5] != null ? ((Number) r[5]).intValue() : 0;
            dto.itensPagoSim = r[6] != null ? ((Number) r[6]).intValue() : 0;
            dto.itensPagoNao = r[7] != null ? ((Number) r[7]).intValue() : 0;
            dto.temComentario = r[8] != null && ((Number) r[8]).intValue() != 0;
            items.add(dto);
        }

        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
        String sortEcho = sort != null && !sort.isBlank() ? sort : "id,desc";
        return new PageResponse<>(items, totalElements, totalPages, page, size, sortEcho);
    }

    private static LocalDate toLocalDateSql(Object v) {
        if (v == null) {
            return null;
        }
        if (v instanceof LocalDate) {
            return (LocalDate) v;
        }
        if (v instanceof java.sql.Date) {
            return ((java.sql.Date) v).toLocalDate();
        }
        if (v instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) v).toLocalDateTime().toLocalDate();
        }
        return null;
    }

    private boolean podeMarcarPagoTrocas() {
        if (currentUserId == null) {
            return false;
        }
        Usuario u = Usuario.findById(currentUserId.intValue());
        if (u == null || u.perfil == null) {
            return false;
        }
        Hibernate.initialize(u.perfil);
        String c = u.perfil.getCodigo();
        if (c == null) {
            return false;
        }
        c = c.trim().toUpperCase();
        return "ADMIN".equals(c) || "DIRETOR".equals(c) || "SUPRIMENTO".equals(c);
    }

    private void replaceTarefasDadosTecnicos(Long osId, OSDto dto) {
        if (dto == null || dto.tarefasDadosTecnicos == null) {
            return;
        }
        Integer uid = currentUserId != null ? currentUserId.intValue() : null;
        tarefaDadoTecnicoService.replaceParaOs(osId, dto.tarefasDadosTecnicos, uid);
    }

    private void attachTrocasToDto(OSDto dto, Long osId) {
        if (dto == null || osId == null) {
            return;
        }
        List<OsSolicitacaoTrocaItem> itens = OsSolicitacaoTrocaItem.find("osId = ?1 order by ordem asc, id asc", osId).list();
        dto.solicitacaoTrocasItens = itens.stream().map(this::entityToItemDto).collect(Collectors.toList());
        attachNaoConformidades(List.of(dto));
    }

    private void attachNaoConformidades(List<OSDto> dtos) {
        List<Integer> ids = dtos.stream().filter(d -> d.id != null && d.id <= Integer.MAX_VALUE).map(d -> d.id.intValue()).toList();
        if (ids.isEmpty()) return;
        List<Object[]> rows = com.aerosuite.domain.ConformidadeNaoConformidade.getEntityManager()
                .createQuery("select n.osId, count(n.id) from ConformidadeNaoConformidade n where n.osId in :ids group by n.osId", Object[].class)
                .setParameter("ids", ids).getResultList();
        Map<Long,Long> counts = new HashMap<>();
        rows.forEach(r -> counts.put(((Number)r[0]).longValue(), ((Number)r[1]).longValue()));
        dtos.forEach(d -> d.naoConformidadesTotal = counts.getOrDefault(d.id,0L));
    }

    private void attachTrocasBatch(List<OSDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }
        List<Long> osIds = dtos.stream()
                .map(d -> d.id)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        if (osIds.isEmpty()) {
            return;
        }
        List<OsSolicitacaoTrocaItem> allItens = OsSolicitacaoTrocaItem
                .find("osId in ?1 order by osId asc, ordem asc, id asc", osIds)
                .list();
        Map<Long, List<OsSolicitacaoTrocaItem>> byOsId = allItens.stream()
                .filter(i -> i.osId != null)
                .collect(Collectors.groupingBy(i -> i.osId.longValue()));
        for (OSDto dto : dtos) {
            if (dto.id == null) {
                dto.solicitacaoTrocasItens = Collections.emptyList();
                continue;
            }
            List<OsSolicitacaoTrocaItem> itens = byOsId.getOrDefault(dto.id, Collections.emptyList());
            dto.solicitacaoTrocasItens = itens.stream().map(this::entityToItemDto).collect(Collectors.toList());
        }
    }

    private OSSolicitacaoTrocaItemDto entityToItemDto(OsSolicitacaoTrocaItem e) {
        OSSolicitacaoTrocaItemDto d = new OSSolicitacaoTrocaItemDto();
        d.id = e.id;
        d.idProduto = e.idProduto;
        d.produtoNome = e.produtoNome;
        d.produtoDescricao = e.produtoDescricao;
        d.produtoPn = e.produtoPn;
        d.produtoSn = e.produtoSn;
        d.quantidade = e.quantidade;
        d.valorUnitario = e.valorUnitario != null ? e.valorUnitario.doubleValue() : null;
        d.valorTotal = e.valorTotal != null ? e.valorTotal.doubleValue() : null;
        d.pago = e.pago;
        d.ordem = e.ordem;
        return d;
    }

    private boolean replaceSolicitacaoTrocasItems(long osId, OSDto dto) {
        boolean can = podeMarcarPagoTrocas();
        List<OsSolicitacaoTrocaItem> existing = OsSolicitacaoTrocaItem.list("osId = ?1 order by ordem asc, id asc", osId);
        Map<Long, Boolean> pagoByOldId = new HashMap<>();
        for (OsSolicitacaoTrocaItem e : existing) {
            pagoByOldId.put(e.id, e.pago);
        }

        List<OSSolicitacaoTrocaItemDto> incoming = new ArrayList<>();
        if (dto != null && dto.solicitacaoTrocasItens != null) {
            incoming.addAll(dto.solicitacaoTrocasItens);
        }
        // Perfis sem permissão para marcar pago não podem remover linhas já analisadas (pago true/false)
        if (!can) {
            Set<Long> idsNoPayload = incoming.stream()
                    .map(it -> it.id)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            for (OsSolicitacaoTrocaItem e : existing) {
                if (e.id != null && e.pago != null && !idsNoPayload.contains(e.id)) {
                    incoming.add(entityToItemDto(e));
                }
            }
        }

        boolean novaLinhaProdutoTroca = contemNovaLinhaProdutoTrocaEventual(incoming);
        boolean mudouStatusPagamentoTroca = contemMudancaStatusPagamentoTroca(incoming, pagoByOldId, can);

        if (can) {
            // Defesa em profundidade: qualquer falha na baixa de estoque das trocas pagas NÃO pode
            // derrubar a confirmação do pagamento. O consumo de estoque já é tolerante a déficit
            // (vide OsEstoqueSaidaAutomacaoService.debitarLinhaTroca), e a notificação de déficit
            // ocorre após o save em OsNotificacaoDeficitTrocaService.criarSeDeficitAposSalvarOs.
            try {
                osEstoqueSaidaAutomacaoService.debitarTrocasEventuaisPagas(
                        osId,
                        existing,
                        incoming,
                        currentUserId,
                        currentUserName);
            } catch (Exception e) {
                LOG.warnf(e, "OSService.replaceSolicitacaoTrocasItems - falha na baixa de estoque "
                        + "das trocas eventuais pagas (OS %s): %s", osId, e.getMessage());
            }
        }

        OsSolicitacaoTrocaItem.delete("osId = ?1", osId);

        int idx = 0;
        for (OSSolicitacaoTrocaItemDto it : incoming) {
            OsSolicitacaoTrocaItem row = new OsSolicitacaoTrocaItem();
            row.osId = (int) osId;
            row.idProduto = it.idProduto;
            row.produtoNome = it.produtoNome;
            row.produtoDescricao = it.produtoDescricao;
            row.produtoPn = it.produtoPn;
            row.produtoSn = it.produtoSn;
            row.quantidade = it.quantidade != null ? it.quantidade : 1;
            row.valorUnitario = it.valorUnitario != null ? BigDecimal.valueOf(it.valorUnitario) : null;
            row.valorTotal = it.valorTotal != null ? BigDecimal.valueOf(it.valorTotal) : null;
            row.ordem = it.ordem != null ? it.ordem : idx;
            Boolean p = it.pago;
            if (!can) {
                if (it.id != null && pagoByOldId.containsKey(it.id)) {
                    p = pagoByOldId.get(it.id);
                } else {
                    p = null;
                }
            }
            row.pago = p;
            row.persist();
            idx++;
        }
        return novaLinhaProdutoTroca || mudouStatusPagamentoTroca;
    }

    private static boolean dtoLinhaTemProdutoTroca(OSSolicitacaoTrocaItemDto it) {
        if (it == null) {
            return false;
        }
        if (it.idProduto != null) {
            return true;
        }
        if (it.produtoPn != null && !it.produtoPn.isBlank()) {
            return true;
        }
        return it.produtoNome != null && !it.produtoNome.isBlank();
    }

    private static boolean contemNovaLinhaProdutoTrocaEventual(List<OSSolicitacaoTrocaItemDto> incoming) {
        if (incoming == null || incoming.isEmpty()) {
            return false;
        }
        return incoming.stream().anyMatch(it -> it.id == null && dtoLinhaTemProdutoTroca(it));
    }

    private static boolean contemMudancaStatusPagamentoTroca(
            List<OSSolicitacaoTrocaItemDto> incoming,
            Map<Long, Boolean> pagoByOldId,
            boolean canAlterarStatusPago) {
        if (!canAlterarStatusPago) {
            return false;
        }
        if (incoming == null || incoming.isEmpty() || pagoByOldId == null || pagoByOldId.isEmpty()) {
            return false;
        }
        for (OSSolicitacaoTrocaItemDto it : incoming) {
            if (it == null || it.id == null || !pagoByOldId.containsKey(it.id)) {
                continue;
            }
            Boolean antigo = pagoByOldId.get(it.id);
            Boolean novo = it.pago;
            if (!Objects.equals(antigo, novo)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Antigo envio por e-mail para itens não pagos foi substituído por notificações in-app
     * ({@link OsNotificacaoDeficitTrocaService}). Mantém apenas limpeza de flag legada quando não há itens não pagos.
     */
    private void notificarItensNaoPagosSeNecessario(OS os) {
        if (os == null || os.id == null) {
            return;
        }
        long n = OsSolicitacaoTrocaItem.count("osId = ?1 and pago = ?2", os.id, false);
        if (n == 0 && Boolean.TRUE.equals(os.emailTrocasNaoPagasEnviado)) {
            os.emailTrocasNaoPagasEnviado = false;
            os.persist();
        }
    }

    /** Painel estendido de OS (protegido por {@link com.aerosuite.security.RequiresTenantFeature} no resource). */
    public OsPainelResumoDto painelResumo() {
        String base = "isActive = true";
        long total = OS.count(base);
        long aguardando = OS.count(base + " and filaEstagio = ?1", "AGUARDANDO");
        long emExecucao = OS.count(base + " and filaEstagio = ?1", "EM_EXECUCAO");
        long aguardandoPecas = OS.count(base + " and filaEstagio = ?1", "AGUARDANDO_PECAS");
        long inspecao = OS.count(base + " and filaEstagio = ?1", "INSPECAO");
        long aog = OS.count(base + " and prioridadeFila = ?1", "AOG");
        long crsPendente = OS.count(base + " and crsEmitidoEm is null");
        return new OsPainelResumoDto(total, aguardando, emExecucao, aguardandoPecas, inspecao, aog, crsPendente);
    }

    /** Próximo número de OS de negócio ({@code id_os}) único no tenant. */
    int alocarProximoIdOs(String tenantId) {
        Number max =
                em.createQuery("select max(o.idOs) from OS o where o.tenantId = :tid and o.isActive = true", Number.class)
                        .setParameter("tid", tenantId)
                        .getSingleResult();
        return max == null ? 1 : max.intValue() + 1;
    }

    void assertIdOsDisponivel(String tenantId, int idOs, Long ignorarOsIdInterno) {
        if (idOs <= 0) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.OS_ID_OS_REQUIRED));
        }
        long count =
                ignorarOsIdInterno != null
                        ? OS.count("tenantId = ?1 and idOs = ?2 and id <> ?3", tenantId, idOs, ignorarOsIdInterno)
                        : OS.count("tenantId = ?1 and idOs = ?2", tenantId, idOs);
        if (count > 0) {
            throw new BadRequestException(
                    ApiI18nMessages.encode(ApiI18nMessages.OS_ID_OS_DUPLICATE, "idOs", String.valueOf(idOs)));
        }
    }
}
