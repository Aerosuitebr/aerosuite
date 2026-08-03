package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.domain.ConformidadeCalibracaoFerramenta;
import com.aerosuite.domain.ConformidadeTreinamento;
import com.aerosuite.domain.Fabricante;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.Fornecedor;
import com.aerosuite.domain.GoLiveChecklistProgress;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.SgqDocumentoControlado;
import com.aerosuite.domain.SgqDocumentoControlado.StatusDocumento;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioExterno;
import com.aerosuite.dto.ClientePropostaDto;
import com.aerosuite.dto.ConformidadeCalibracaoWriteDto;
import com.aerosuite.dto.ConformidadeNaoConformidadeWriteDto;
import com.aerosuite.dto.ConformidadeTreinamentoWriteDto;
import com.aerosuite.dto.FcuDto;
import com.aerosuite.dto.FornecedorDto;
import com.aerosuite.dto.GoLiveImportRequestDto;
import com.aerosuite.dto.GoLiveImportResultDto;
import com.aerosuite.dto.GoLiveImportResultDto.GoLiveLinhaResultDto;
import com.aerosuite.dto.SgqDocumentoWriteDto;
import com.aerosuite.dto.UsuarioExternoDto;
import com.aerosuite.go_live.GoLiveCsvParser;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@ApplicationScoped
public class GoLiveMigracaoService {

    @Inject
    ClientePropostaService clientePropostaService;

    @Inject
    FcuService fcuService;

    @Inject
    UsuarioExternoService usuarioExternoService;

    @Inject
    EstoqueService estoqueService;

    @Inject
    ConformidadeTreinamentoService conformidadeTreinamentoService;

    @Inject
    SgqDocumentoService sgqDocumentoService;

    @Inject
    ConformidadeCalibracaoService conformidadeCalibracaoService;

    @Inject
    ConformidadeNaoConformidadeService conformidadeNaoConformidadeService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    EntityManager entityManager;

    @Transactional
    public List<GoLiveChecklistItemDto> checklist() {
        List<GoLiveChecklistItemDto> base = List.of(
                item(1, 1, "goLive.checklist.w1.t1", null),
                item(1, 2, "goLive.checklist.w1.t2", "/conformidade/habilitacoes"),
                item(1, 3, "goLive.checklist.w1.t3", "/dossie-auditoria"),
                item(2, 4, "goLive.checklist.w2.t1", "/go-live-migracao"),
                item(2, 5, "goLive.checklist.w2.t2", "/propostas-comerciais"),
                item(2, 6, "goLive.checklist.w2.t3", "/configuracoes"),
                item(3, 7, "goLive.checklist.w3.t1", "/os"),
                item(3, 8, "goLive.checklist.w3.t2", "/hangar"),
                item(3, 9, "goLive.checklist.w3.t3", "/aero/diretrizes"),
                item(4, 10, "goLive.checklist.w4.t1", "/configuracoes"),
                item(4, 11, "goLive.checklist.w4.t2", "/settings/backup"),
                item(4, 12, "goLive.checklist.w4.t3", null),
                item(5, 13, "goLive.checklist.w5.t1", "/conformidade/painel"),
                item(5, 14, "goLive.checklist.w5.t2", "/conformidade/treinamentos-obrigatorios"),
                item(5, 15, "goLive.checklist.w5.t3", "/conformidade/documentos"));
        for (GoLiveChecklistItemDto row : base) {
            GoLiveChecklistProgress saved = GoLiveChecklistProgress.findByItemKey(row.itemKey);
            if (saved != null) {
                row.concluido = Boolean.TRUE.equals(saved.concluido);
                row.concluidoEm = saved.concluidoEm != null ? saved.concluidoEm.toString() : null;
            }
        }
        sanitizarProgressoInflado(base);
        return base;
    }

    @Transactional
    public List<GoLiveChecklistItemDto> salvarChecklist(GoLiveChecklistSaveDto body, Integer usuarioId) {
        if (body == null || body.itens == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.GOLIVE_CHECKLIST_REQUIRED));
        }
        for (GoLiveChecklistItemSaveDto item : body.itens) {
            if (item == null || item.itemKey == null || item.itemKey.isBlank()) {
                continue;
            }
            String itemKey = item.itemKey.trim();
            GoLiveChecklistProgress row = GoLiveChecklistProgress.findByItemKey(itemKey);
            if (row == null) {
                row = new GoLiveChecklistProgress();
                row.itemKey = itemKey;
            }
            row.concluido = Boolean.TRUE.equals(item.concluido);
            if (row.concluido) {
                row.concluidoEm = java.time.LocalDateTime.now();
                row.concluidoPorUsuarioId = usuarioId;
            } else {
                row.concluidoEm = null;
                row.concluidoPorUsuarioId = null;
            }
            row.persist();
        }
        entityManager.flush();
        return checklist();
    }

    /**
     * Remove falso positivo de checklist 100% em tenants sem evidência operacional
     * (dados residuais de homologação anterior no mesmo tenant de teste).
     */
    void sanitizarProgressoInflado(List<GoLiveChecklistItemDto> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        long concluidos = items.stream().filter(i -> i.concluido).count();
        if (concluidos < items.size()) {
            return;
        }
        if (!pareceTenantSemAtividadeReal()) {
            return;
        }
        GoLiveChecklistProgress.deleteAll();
        for (GoLiveChecklistItemDto row : items) {
            row.concluido = false;
            row.concluidoEm = null;
        }
    }

    private boolean pareceTenantSemAtividadeReal() {
        long tid = tenantDataAccess.currentTenantId();
        long usuariosInternos = Usuario.count("orgTenantId = ?1 and ativo = true", tid);
        long ordensServico = OS.count("isActive = true");
        long propostas = ClienteProposta.count("isActive = true");
        long fcus = Fcu.count("isActive = true");
        long documentosSgq = SgqDocumentoControlado.count("ativo = true");
        long calibracoes = ConformidadeCalibracaoFerramenta.count("ativo = true");
        return usuariosInternos <= 1
                && ordensServico == 0
                && propostas == 0
                && fcus == 0
                && documentosSgq == 0
                && calibracoes == 0;
    }

    public List<GoLiveTemplateInfoDto> templates() {
        return List.of(
                tpl("clientes-proposta", "goLive.template.clientes", "clientes-proposta.csv"),
                tpl("fcu", "goLive.template.fcu", "fcu.csv"),
                tpl("usuarios-externos", "goLive.template.usuariosExternos", "usuarios-externos.csv"),
                tpl("fornecedores", "goLive.template.fornecedores", "fornecedores.csv"),
                tpl("treinamentos", "goLive.template.treinamentos", "treinamentos.csv"),
                tpl("documentos-sgq", "goLive.template.documentosSgq", "documentos-sgq.csv"),
                tpl("calibracao", "goLive.template.calibracao", "calibracao.csv"),
                tpl("nao-conformidades", "goLive.template.naoConformidades", "nao-conformidades.csv"));
    }

    public String loadTemplateCsv(String templateId) {
        String file = switch (templateId) {
            case "clientes-proposta" -> "go-live/templates/clientes-proposta.csv";
            case "fcu" -> "go-live/templates/fcu.csv";
            case "usuarios-externos" -> "go-live/templates/usuarios-externos.csv";
            case "fornecedores" -> "go-live/templates/fornecedores.csv";
            case "treinamentos" -> "go-live/templates/treinamentos.csv";
            case "documentos-sgq" -> "go-live/templates/documentos-sgq.csv";
            case "calibracao" -> "go-live/templates/calibracao.csv";
            case "nao-conformidades" -> "go-live/templates/nao-conformidades.csv";
            default -> throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEMPLATE_INVALID, "id", templateId));
        };
        try (InputStream in = Thread.currentThread().getContextClassLoader().getResourceAsStream(file)) {
            if (in == null) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.GOLIVE_TEMPLATE_NOT_FOUND, "file", String.valueOf(file)));
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.GOLIVE_TEMPLATE_READ_FAILED, templateId), e);
        }
    }

    @Transactional
    public GoLiveImportResultDto importClientesProposta(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String nome = GoLiveCsvParser.cell(row, "nome");
            String email = GoLiveCsvParser.cell(row, "email");
            if (isBlank(nome)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_NAME_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            if (!isBlank(email)) {
                ClienteProposta existEmail = ClienteProposta.find(
                        "lower(email) = ?1 and isActive = true", email.trim().toLowerCase(Locale.ROOT)).firstResult();
                if (existEmail != null) {
                    lr.status = "IGNORADO";
                    lr.mensagem = ApiI18nMessages.encode(
                            ApiI18nMessages.GOLIVE_IMPORT_CLIENT_EMAIL_EXISTS,
                            "id",
                            String.valueOf(existEmail.id));
                    lr.referencia = nome;
                    lr.idCriado = existEmail.id;
                    result.ignorados++;
                    result.linhas.add(lr);
                    continue;
                }
            }
            if (!dryRun) {
                ClientePropostaDto dto = new ClientePropostaDto();
                dto.nome = nome;
                dto.cnpjCpf = GoLiveCsvParser.cell(row, "cnpj_cpf", "cnpj");
                dto.email = email;
                dto.telefone = GoLiveCsvParser.cell(row, "telefone");
                dto.contato = GoLiveCsvParser.cell(row, "contato");
                dto.endereco = GoLiveCsvParser.cell(row, "endereco");
                dto.cidade = GoLiveCsvParser.cell(row, "cidade");
                dto.estado = GoLiveCsvParser.cell(row, "estado");
                dto.cep = GoLiveCsvParser.cell(row, "cep");
                dto.observacao = GoLiveCsvParser.cell(row, "observacao");
                dto.isActive = true;
                ClientePropostaDto created = clientePropostaService.create(dto);
                lr.idCriado = toIdCriado(created.id);
            }
            lr.status = "OK";
            lr.mensagem = dryRun
                    ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                    : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = nome;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importFcu(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String pn = GoLiveCsvParser.cell(row, "pn", "part_number");
            String sn = GoLiveCsvParser.cell(row, "serial_number", "sn");
            if (isBlank(pn)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_PN_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            if (!isBlank(sn)) {
                Fcu exist = Fcu.find("pn = ?1 and serialNumber = ?2", pn, sn).firstResult();
                if (exist != null) {
                    lr.status = "IGNORADO";
                    lr.mensagem = ApiI18nMessages.encode(
                            ApiI18nMessages.GOLIVE_IMPORT_FCU_EXISTS,
                            "id",
                            String.valueOf(exist.id));
                    lr.referencia = pn + " / " + sn;
                    lr.idCriado = toIdCriado(exist.id);
                    result.ignorados++;
                    result.linhas.add(lr);
                    continue;
                }
            }
            Integer idFabricante = resolveFabricanteId(GoLiveCsvParser.cell(row, "fabricante_nome", "fabricante"));
            if (!dryRun) {
                String codigo = GoLiveCsvParser.cell(row, "fcu_codigo", "codigo");
                FcuDto dto = new FcuDto(
                        null,
                        isBlank(codigo) ? pn : codigo,
                        GoLiveCsvParser.cell(row, "fcu_description", "descricao"),
                        null,
                        idFabricante,
                        GoLiveCsvParser.cell(row, "modelo"),
                        pn,
                        sn,
                        GoLiveCsvParser.cell(row, "ata_manual", "ata"),
                        null,
                        null,
                        true);
                FcuDto created = fcuService.create(dto);
                lr.idCriado = created.id() != null ? created.id().intValue() : null;
            }
            lr.status = "OK";
            lr.mensagem = dryRun
                    ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                    : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = pn;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importUsuariosExternos(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        Integer criadoPor = internalUserContext.getUserId();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String nome = GoLiveCsvParser.cell(row, "nome");
            String email = GoLiveCsvParser.cell(row, "email");
            if (isBlank(nome) || isBlank(email)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_NAME_EMAIL_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            String emailNorm = email.trim().toLowerCase(Locale.ROOT);
            long tid = tenantDataAccess.currentTenantId();
            UsuarioExterno exist = UsuarioExterno.find("email = ?1 and orgTenantId = ?2", emailNorm, tid).firstResult();
            if (exist != null) {
                lr.status = "IGNORADO";
                lr.mensagem = ApiI18nMessages.encode(
                        ApiI18nMessages.GOLIVE_IMPORT_EMAIL_EXISTS,
                        "id",
                        String.valueOf(exist.id));
                lr.referencia = emailNorm;
                lr.idCriado = exist.id;
                result.ignorados++;
                result.linhas.add(lr);
                continue;
            }
            if (!dryRun) {
                UsuarioExternoDto dto = new UsuarioExternoDto(
                        nome,
                        emailNorm,
                        GoLiveCsvParser.cell(row, "empresa"),
                        GoLiveCsvParser.cell(row, "telefone"),
                        GoLiveCsvParser.cell(row, "cargo"));
                UsuarioExternoDto created = usuarioExternoService.create(dto, criadoPor);
                lr.idCriado = created.id();
            }
            lr.status = "OK";
            lr.mensagem = dryRun
                    ? "Seria criado (senha temporária enviada por e-mail no apply)"
                    : "Criado; credenciais enviadas por e-mail se SMTP configurado";
            lr.referencia = emailNorm;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importFornecedores(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String razao = GoLiveCsvParser.cell(row, "razao_social", "razao");
            if (isBlank(razao)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_RAZAO_SOCIAL_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            String codigo = GoLiveCsvParser.cell(row, "codigo");
            if (!isBlank(codigo)) {
                Fornecedor exist =
                        Fornecedor.find("codigo = ?1", codigo.trim()).firstResult();
                if (exist != null) {
                    lr.status = "IGNORADO";
                    lr.mensagem =
                            ApiI18nMessages.encode(
                                    ApiI18nMessages.GOLIVE_IMPORT_FORNECEDOR_CODIGO_EXISTS,
                                    "id",
                                    String.valueOf(exist.id));
                    lr.referencia = codigo;
                    lr.idCriado = toIdCriado(exist.id);
                    result.ignorados++;
                    result.linhas.add(lr);
                    continue;
                }
            }
            if (!dryRun) {
                FornecedorDto dto = new FornecedorDto();
                dto.codigo = codigo;
                dto.razaoSocial = razao;
                dto.email = GoLiveCsvParser.cell(row, "email");
                dto.telefone = GoLiveCsvParser.cell(row, "telefone");
                dto.aslStatus = GoLiveCsvParser.cell(row, "asl_status", "aslstatus");
                dto.aslValidade = GoLiveCsvParser.cell(row, "asl_validade");
                dto.aslEscopo = GoLiveCsvParser.cell(row, "asl_escopo");
                dto.observacoes = GoLiveCsvParser.cell(row, "observacoes");
                FornecedorDto created = estoqueService.salvarFornecedor(dto);
                lr.idCriado = toIdCriado(created.id);
            }
            lr.status = "OK";
            lr.mensagem =
                    dryRun
                            ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                            : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = razao;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importTreinamentos(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        long tid = tenantDataAccess.currentTenantId();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String curso = GoLiveCsvParser.cell(row, "curso");
            if (isBlank(curso)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CURSO_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            Integer usuarioId = resolveUsuarioId(row, tid);
            if (usuarioId == null) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_USUARIO_NOT_FOUND);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            if (!dryRun) {
                ConformidadeTreinamentoWriteDto dto = new ConformidadeTreinamentoWriteDto();
                dto.usuarioId = usuarioId;
                dto.curso = curso;
                dto.dataConclusao = GoLiveCsvParser.cell(row, "data_conclusao");
                dto.dataValidade = GoLiveCsvParser.cell(row, "data_validade");
                dto.certificador = GoLiveCsvParser.cell(row, "certificador");
                dto.observacoes = GoLiveCsvParser.cell(row, "observacoes");
                String ch = GoLiveCsvParser.cell(row, "carga_horaria");
                if (!isBlank(ch)) {
                    try {
                        dto.cargaHoraria = new java.math.BigDecimal(ch.replace(',', '.'));
                    } catch (NumberFormatException ignored) {
                    }
                }
                var created = conformidadeTreinamentoService.criar(dto);
                lr.idCriado = toIdCriado(created.id);
            }
            lr.status = "OK";
            lr.mensagem =
                    dryRun
                            ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                            : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = curso;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importDocumentosSgq(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String codigo = GoLiveCsvParser.cell(row, "codigo");
            String titulo = GoLiveCsvParser.cell(row, "titulo");
            if (isBlank(codigo) || isBlank(titulo)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_DOC_CAMPOS_OBRIGATORIOS);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            String revisao = GoLiveCsvParser.cell(row, "revisao", "revision");
            if (isBlank(revisao)) {
                revisao = "00";
            }
            SgqDocumentoControlado exist =
                    SgqDocumentoControlado.find(
                                    "codigo = ?1 and revisao = ?2 and ativo = true",
                                    codigo.trim(),
                                    revisao.trim())
                            .firstResult();
            if (exist != null) {
                lr.status = "IGNORADO";
                lr.mensagem =
                        ApiI18nMessages.encode(
                                ApiI18nMessages.GOLIVE_IMPORT_DOC_EXISTS, "id", String.valueOf(exist.id));
                lr.referencia = codigo + " rev." + revisao;
                lr.idCriado = toIdCriado(exist.id);
                result.ignorados++;
                result.linhas.add(lr);
                continue;
            }
            if (!dryRun) {
                SgqDocumentoWriteDto dto = new SgqDocumentoWriteDto();
                dto.tipo = GoLiveCsvParser.cell(row, "tipo", "type");
                dto.codigo = codigo.trim();
                dto.titulo = titulo.trim();
                dto.revisao = revisao.trim();
                dto.dataVigencia = GoLiveCsvParser.cell(row, "data_vigencia");
                dto.status = GoLiveCsvParser.cell(row, "status");
                dto.observacoes = GoLiveCsvParser.cell(row, "observacoes");
                if (isBlank(dto.status)) {
                    dto.status = StatusDocumento.VIGENTE.name();
                }
                var created = sgqDocumentoService.criar(dto);
                lr.idCriado = toIdCriado(created.id);
            }
            lr.status = "OK";
            lr.mensagem =
                    dryRun
                            ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                            : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = codigo;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importCalibracao(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String identificador = GoLiveCsvParser.cell(row, "identificador", "id");
            if (isBlank(identificador)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CALIB_ID_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            ConformidadeCalibracaoFerramenta exist =
                    ConformidadeCalibracaoFerramenta.find("identificador = ?1", identificador.trim())
                            .firstResult();
            if (exist != null) {
                lr.status = "IGNORADO";
                lr.mensagem =
                        ApiI18nMessages.encode(
                                ApiI18nMessages.GOLIVE_IMPORT_CALIB_EXISTS, "id", String.valueOf(exist.id));
                lr.referencia = identificador;
                lr.idCriado = toIdCriado(exist.id);
                result.ignorados++;
                result.linhas.add(lr);
                continue;
            }
            if (!dryRun) {
                ConformidadeCalibracaoWriteDto dto = new ConformidadeCalibracaoWriteDto();
                dto.identificador = identificador.trim();
                dto.descricao = GoLiveCsvParser.cell(row, "descricao");
                dto.tipo = GoLiveCsvParser.cell(row, "tipo");
                dto.localizacao = GoLiveCsvParser.cell(row, "localizacao");
                dto.dataUltimaCalibracao = GoLiveCsvParser.cell(row, "data_ultima_calibracao");
                dto.dataProximaCalibracao = GoLiveCsvParser.cell(row, "data_proxima_calibracao");
                dto.certificadoRef = GoLiveCsvParser.cell(row, "certificado_ref");
                dto.observacoes = GoLiveCsvParser.cell(row, "observacoes");
                var created = conformidadeCalibracaoService.criar(dto);
                lr.idCriado = toIdCriado(created.id);
            }
            lr.status = "OK";
            lr.mensagem =
                    dryRun
                            ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                            : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = identificador;
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    @Transactional
    public GoLiveImportResultDto importNaoConformidades(GoLiveImportRequestDto request) {
        boolean dryRun = request != null && Boolean.TRUE.equals(request.dryRun);
        GoLiveImportResultDto result = baseResult(dryRun);
        List<Map<String, String>> rows = GoLiveCsvParser.parseRows(request != null ? request.csv : null);
        result.totalLinhas = rows.size();
        int lineNum = 1;
        for (Map<String, String> row : rows) {
            lineNum++;
            GoLiveLinhaResultDto lr = new GoLiveLinhaResultDto();
            lr.linha = lineNum;
            String titulo = GoLiveCsvParser.cell(row, "titulo", "title");
            if (isBlank(titulo)) {
                lr.status = "ERRO";
                lr.mensagem = ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_NC_TITULO_REQUIRED);
                result.erros++;
                result.linhas.add(lr);
                continue;
            }
            if (!dryRun) {
                ConformidadeNaoConformidadeWriteDto dto = new ConformidadeNaoConformidadeWriteDto();
                dto.titulo = titulo.trim();
                dto.descricao = GoLiveCsvParser.cell(row, "descricao", "description");
                dto.severidade = GoLiveCsvParser.cell(row, "severidade", "severity");
                dto.status = GoLiveCsvParser.cell(row, "status");
                dto.dataAbertura = GoLiveCsvParser.cell(row, "data_abertura", "dataAbertura");
                dto.capaFase = GoLiveCsvParser.cell(row, "capa_fase", "capaFase");
                dto.observacoes = GoLiveCsvParser.cell(row, "observacoes", "obs");
                String osRaw = GoLiveCsvParser.cell(row, "os_id", "osId");
                if (!isBlank(osRaw)) {
                    try {
                        dto.osId = Integer.parseInt(osRaw.trim());
                    } catch (NumberFormatException ignored) {
                        /* opcional */
                    }
                }
                var created = conformidadeNaoConformidadeService.criar(dto);
                lr.idCriado = toIdCriado(created.id);
            }
            lr.status = "OK";
            lr.mensagem =
                    dryRun
                            ? ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_WOULD_CREATE)
                            : ApiI18nMessages.domain(ApiI18nMessages.GOLIVE_IMPORT_CREATED);
            lr.referencia = titulo.trim();
            result.criados++;
            result.linhas.add(lr);
        }
        return result;
    }

    private Integer resolveUsuarioId(Map<String, String> row, long tenantId) {
        String idRaw = GoLiveCsvParser.cell(row, "usuario_id", "usuarioId");
        if (!isBlank(idRaw)) {
            try {
                return Integer.parseInt(idRaw.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        String email = GoLiveCsvParser.cell(row, "usuario_email", "email");
        if (isBlank(email)) {
            return null;
        }
        Usuario u =
                Usuario.find(
                                "lower(email) = ?1 and orgTenantId = ?2",
                                email.trim().toLowerCase(Locale.ROOT),
                                tenantId)
                        .firstResult();
        return u != null ? u.id : null;
    }

    private Integer resolveFabricanteId(String nomeFabricante) {
        if (isBlank(nomeFabricante)) {
            return null;
        }
        Fabricante f = Fabricante.find("lower(nome) = ?1 and isActive = true",
                nomeFabricante.trim().toLowerCase(Locale.ROOT)).firstResult();
        return f != null ? f.id : null;
    }

    private static GoLiveImportResultDto baseResult(boolean dryRun) {
        GoLiveImportResultDto r = new GoLiveImportResultDto();
        r.dryRun = dryRun;
        return r;
    }

    private static Integer toIdCriado(Number id) {
        return id == null ? null : id.intValue();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static GoLiveChecklistItemDto item(int week, int order, String i18nKey, String routeLink) {
        GoLiveChecklistItemDto i = new GoLiveChecklistItemDto();
        i.week = week;
        i.order = order;
        i.i18nKey = i18nKey;
        i.itemKey = i18nKey;
        i.routeLink = routeLink;
        return i;
    }

    private static GoLiveTemplateInfoDto tpl(String id, String i18nKey, String fileName) {
        GoLiveTemplateInfoDto t = new GoLiveTemplateInfoDto();
        t.id = id;
        t.i18nKey = i18nKey;
        t.fileName = fileName;
        return t;
    }

    public static class GoLiveChecklistItemDto {
        public int week;
        public int order;
        public String i18nKey;
        public String itemKey;
        public String routeLink;
        public boolean concluido;
        public String concluidoEm;
    }

    public static class GoLiveChecklistSaveDto {
        public List<GoLiveChecklistItemSaveDto> itens;
    }

    public static class GoLiveChecklistItemSaveDto {
        public String itemKey;
        public Boolean concluido;
    }

    public static class GoLiveTemplateInfoDto {
        public String id;
        public String i18nKey;
        public String fileName;
    }
}
