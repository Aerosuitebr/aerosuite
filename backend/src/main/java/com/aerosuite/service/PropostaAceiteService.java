package com.aerosuite.service;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.dto.PropostaAceitePublicaDto;
import com.aerosuite.dto.PropostaAceiteRequest;
import com.aerosuite.dto.PropostaSolicitacaoRequest;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class PropostaAceiteService {

    @jakarta.inject.Inject CommercialBrandingService branding;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final List<String> CONDICOES = List.of(
        "Após o recebimento do item no setor RECEX, o acessório e/ou componente aeronáutico será submetido à inspeção de recebimento, teste de entrada para detectar falhas ocultas não relatadas pelo cliente, desmontagem, limpeza, inspeções visuais, dimensionais, END (Ensaio Não Destrutivo) quando aplicado, montagem, teste e calibração/ajuste e envio ao cliente.",
        "O serviço será executado conforme solicitação da etiqueta informativa, em conformidade com o manual do fabricante.",
        "A garantia do serviço será de 3 (três) meses ou 150 (cento e cinquenta) horas, segundo especificações da OM (Organização de Manutenção) Organização de Manutenção.",
        "O transporte do material é de responsabilidade do cliente, salvo acordo em contrário.",
        "A Organização de Manutenção se reserva o direito de alterar os valores caso haja mudança significativa no escopo do serviço.",
        "A Organização de Manutenção cobrará a título de handling (manuseio) uma taxa de 8% (oito por cento) do valor do price list sobre materiais fornecidos pelo cliente.",
        "Caso venha a ocorrer correção das discrepâncias encontradas durante a realização dos serviços, será emitida uma proposta complementar àquela já existente para sua apreciação e aprovação prévia.",
        "Os valores expressos em dólares norte-americanos deverão ser convertidos para a moeda nacional pelo câmbio oficial na data do faturamento e/ou condição de pagamento.",
        "O prazo de entrega começa a contar após o recebimento do material.",
        "Será elaborado um orçamento preliminar para a aprovação do cliente. Após a desmontagem e inspeção, o valor da proposta antecedente poderá sofrer alterações, com o intuito de se obter a performance desejada segundo o fabricante.",
        "Em motores com programa de extensão ou estando abaixo da performance desejada, serão avaliados por outro critério. Podendo em caso de pesquisa de pane na pista ser acrescido um custo, cujo estará relacionado às despesas tais como: viagem, hospedagem, alimentação e mão de obra, sob o valor final da proposta.",
        "Os valores acima incluem impostos, que serão calculados conforme a legislação vigente."
    );

    @ConfigProperty(name = "frontend.url", defaultValue = "https://app.aerosuite.app")
    String frontendUrl;

    public String buildAceiteUrl(String token) {
        if (token == null || token.isBlank()) return null;
        String base = frontendUrl == null ? "https://app.aerosuite.app" : frontendUrl.trim();
        while (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return base + "/p/" + token;
    }

    @Transactional
    public String garantirToken(PropostaComercial proposta) {
        if (proposta == null) throw new NotFoundException("Proposta não encontrada");
        if ("ACEITA".equalsIgnoreCase(proposta.aceiteStatus) || "APROVADA".equalsIgnoreCase(proposta.status)) {
            if (proposta.aceiteToken != null && !proposta.aceiteToken.isBlank()) return proposta.aceiteToken;
        }
        if (proposta.aceiteToken == null || proposta.aceiteToken.isBlank()
                || proposta.aceiteTokenExpiraEm == null
                || proposta.aceiteTokenExpiraEm.isBefore(LocalDateTime.now())) {
            proposta.aceiteToken = gerarToken();
        }
        proposta.aceiteTokenExpiraEm = calcularExpiracao(proposta);
        if (proposta.aceiteStatus == null || proposta.aceiteStatus.isBlank()
                || "EXPIRADA".equalsIgnoreCase(proposta.aceiteStatus)) {
            proposta.aceiteStatus = "PENDENTE";
        }
        preencherSolicitantePadrao(proposta);
        proposta.persist();
        return proposta.aceiteToken;
    }

    @Transactional
    public Map<String, Object> gerarLinkInterno(Long id) {
        PropostaComercial p = PropostaComercial.findById(id);
        if (p == null) throw new NotFoundException("Proposta não encontrada: " + id);
        garantirToken(p);
        return Map.of(
            "id", p.id,
            "numeroProposta", nullSafe(p.numeroProposta),
            "aceiteToken", nullSafe(p.aceiteToken),
            "aceiteUrl", buildAceiteUrl(p.aceiteToken),
            "aceiteStatus", nullSafe(p.aceiteStatus),
            "aceiteTokenExpiraEm", p.aceiteTokenExpiraEm == null ? "" : p.aceiteTokenExpiraEm.toString()
        );
    }

    @Transactional
    public PropostaAceitePublicaDto getPublica(String token) {
        PropostaComercial p = porToken(token);
        atualizarExpiracaoSeNecessario(p);
        return toPublica(p);
    }

    @Transactional
    public PropostaAceitePublicaDto salvarSolicitacao(String token, PropostaSolicitacaoRequest req) {
        PropostaComercial p = porToken(token);
        exigirEditavel(p);
        if (req == null) throw new BadRequestException("Dados da solicitação inválidos.");
        if (Boolean.TRUE.equals(req.incidenteAcidente)) {
            if (req.descricaoIncidente == null || req.descricaoIncidente.isBlank()) {
                throw new BadRequestException("Descreva o incidente/acidente.");
            }
            if (req.submersoAgua == null) {
                throw new BadRequestException("Informe se o equipamento foi submerso em água.");
            }
        }
        aplicarSolicitacao(p, req);
        p.aceiteStatus = "PREENCHIDA";
        p.persist();
        return toPublica(p);
    }

    @Transactional
    public PropostaAceitePublicaDto aceitar(String token, PropostaAceiteRequest req, String ip, String ua) {
        PropostaComercial p = porToken(token);
        exigirEditavel(p);
        if (req == null) throw new BadRequestException("Dados do aceite inválidos.");
        if (req.nome == null || req.nome.isBlank()) throw new BadRequestException("Informe o nome completo.");
        if (!Boolean.TRUE.equals(req.declaracao)) {
            throw new BadRequestException("É necessário confirmar a declaração de responsabilidade.");
        }
        if (!Boolean.TRUE.equals(req.autorizacao)) {
            throw new BadRequestException("É necessário autorizar a execução do serviço.");
        }
        if (p.incidenteAcidente == null) {
            throw new BadRequestException("Complete a solicitação de serviços antes de autorizar.");
        }
        p.aceiteNome = trim(req.nome);
        p.aceiteEmail = trim(req.email);
        p.aceiteCargo = trim(req.cargo);
        p.aceiteEmpresa = trim(req.empresa);
        p.aceiteDeclaracao = true;
        p.aceiteAutorizacao = true;
        p.aceitoEm = LocalDateTime.now();
        p.aceitoIp = trimTo(ip, 255);
        p.aceitoUserAgent = trimTo(ua, 500);
        p.aceiteStatus = "ACEITA";
        p.status = "APROVADA";
        if (p.solicitanteNome == null || p.solicitanteNome.isBlank()) p.solicitanteNome = p.aceiteNome;
        if (p.solicitanteEmpresa == null || p.solicitanteEmpresa.isBlank()) p.solicitanteEmpresa = p.aceiteEmpresa;
        if (p.solicitanteCargo == null || p.solicitanteCargo.isBlank()) p.solicitanteCargo = p.aceiteCargo;
        if (p.solicitanteData == null) p.solicitanteData = LocalDate.now();
        p.persist();
        return toPublica(p);
    }

    @Transactional
    public PropostaAceitePublicaDto recusar(String token, PropostaAceiteRequest req, String ip, String ua) {
        PropostaComercial p = porToken(token);
        exigirEditavel(p);
        if (req == null || req.motivo == null || req.motivo.isBlank()) {
            throw new BadRequestException("Informe o motivo da recusa.");
        }
        p.recusaMotivo = trimTo(req.motivo, 2000);
        p.aceiteNome = trim(req.nome);
        p.aceiteEmail = trim(req.email);
        p.aceiteCargo = trim(req.cargo);
        p.aceiteEmpresa = trim(req.empresa);
        p.aceitoEm = LocalDateTime.now();
        p.aceitoIp = trimTo(ip, 255);
        p.aceitoUserAgent = trimTo(ua, 500);
        p.aceiteStatus = "RECUSADA";
        p.status = "REJEITADA";
        p.persist();
        return toPublica(p);
    }



    public Map<String, Object> payloadAbrirOs(Long id) {
        PropostaComercial p = PropostaComercial.findById(id);
        if (p == null) throw new NotFoundException("Proposta não encontrada: " + id);
        return Map.ofEntries(
            Map.entry("propostaId", p.id),
            Map.entry("numeroProposta", nullSafe(p.numeroProposta)),
            Map.entry("clienteNome", nullSafe(p.clienteNome)),
            Map.entry("partNumber", nullSafe(p.produtoPn)),
            Map.entry("serialNumber", nullSafe(p.produtoSn)),
            Map.entry("tsn", nullSafe(p.tsn)),
            Map.entry("tso", nullSafe(p.tso)),
            Map.entry("motor", firstNonBlank(p.modeloMotor, p.aplicacaoMotor)),
            Map.entry("snMotor", nullSafe(p.pnMotor)),
            Map.entry("marcasMatricula", nullSafe(p.aeronavePrefixo)),
            Map.entry("tipoServico", nullSafe(p.tipoServicoNome)),
            Map.entry("idTipoServico", p.idTipoServico == null ? "" : p.idTipoServico),
            Map.entry("servicoExecutado", nullSafe(p.servicoExecutado)),
            Map.entry("obsIniServ", nullSafe(p.reporteCliente)),
            Map.entry("manualPn", nullSafe(p.produtoManual))
        );
    }


    private PropostaComercial porToken(String token) {
        if (token == null || token.isBlank()) throw new NotFoundException("Link inválido.");
        PropostaComercial p = PropostaComercial.<PropostaComercial>find("aceiteToken", token.trim()).withLock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE).firstResult();
        if (p == null) throw new NotFoundException("Proposta não encontrada para este link.");
        return p;
    }

    private void exigirEditavel(PropostaComercial p) {
        atualizarExpiracaoSeNecessario(p);
        if ("CANCELADA".equalsIgnoreCase(p.status)) {
            throw new BadRequestException("Esta proposta foi cancelada.");
        }
        if ("ACEITA".equalsIgnoreCase(p.aceiteStatus) || "APROVADA".equalsIgnoreCase(p.status)) {
            throw new BadRequestException("Esta proposta já foi autorizada.");
        }
        if ("RECUSADA".equalsIgnoreCase(p.aceiteStatus) || "REJEITADA".equalsIgnoreCase(p.status)) {
            throw new BadRequestException("Esta proposta já foi recusada.");
        }
        if ("EXPIRADA".equalsIgnoreCase(p.aceiteStatus)
                || (p.aceiteTokenExpiraEm != null && p.aceiteTokenExpiraEm.isBefore(LocalDateTime.now()))) {
            p.aceiteStatus = "EXPIRADA";
            p.persist();
            throw new BadRequestException("Este link de autorização expirou. Solicite um novo envio ao comercial.");
        }
        if (!"ENVIADA".equalsIgnoreCase(p.status)) {
            throw new BadRequestException("A proposta ainda não está disponível para autorização.");
        }
    }

    private void atualizarExpiracaoSeNecessario(PropostaComercial p) {
        if (p.aceiteTokenExpiraEm != null && p.aceiteTokenExpiraEm.isBefore(LocalDateTime.now())
                && !"ACEITA".equalsIgnoreCase(p.aceiteStatus) && !"RECUSADA".equalsIgnoreCase(p.aceiteStatus)) {
            p.aceiteStatus = "EXPIRADA";
        }
    }

    private void aplicarSolicitacao(PropostaComercial p, PropostaSolicitacaoRequest req) {
        if (req.produtoNome != null) p.produtoNome = trim(req.produtoNome);
        if (req.produtoPn != null) p.produtoPn = trim(req.produtoPn);
        if (req.produtoSn != null) p.produtoSn = trim(req.produtoSn);
        if (req.aeronavePrefixo != null) p.aeronavePrefixo = trim(req.aeronavePrefixo);
        if (req.modeloMotor != null) {
            p.modeloMotor = trim(req.modeloMotor);
            if (p.aplicacaoMotor == null || p.aplicacaoMotor.isBlank()) p.aplicacaoMotor = p.modeloMotor;
        }
        if (req.pnMotor != null) p.pnMotor = trim(req.pnMotor);
        if (req.tsn != null) p.tsn = trim(req.tsn);
        if (req.tso != null) p.tso = trim(req.tso);
        if (req.csn != null) p.csn = trim(req.csn);
        if (req.cso != null) p.cso = trim(req.cso);
        if (req.tempoDesdeHsi != null) p.tempoDesdeHsi = trim(req.tempoDesdeHsi);
        if (req.servicosFlags != null) p.servicosFlags = trim(req.servicosFlags);
        if (req.servicoExecutado != null) p.servicoExecutado = trim(req.servicoExecutado);
        if (req.reporteCliente != null) p.reporteCliente = trim(req.reporteCliente);
        p.incidenteAcidente = req.incidenteAcidente;
        p.submersoAgua = Boolean.TRUE.equals(req.incidenteAcidente) ? req.submersoAgua : null;
        p.descricaoIncidente = Boolean.TRUE.equals(req.incidenteAcidente) ? trim(req.descricaoIncidente) : null;
        if (req.solicitanteNome != null) p.solicitanteNome = trim(req.solicitanteNome);
        if (req.solicitanteEmpresa != null) p.solicitanteEmpresa = trim(req.solicitanteEmpresa);
        if (req.solicitanteCargo != null) p.solicitanteCargo = trim(req.solicitanteCargo);
        if (req.solicitanteData != null) p.solicitanteData = req.solicitanteData;
    }

    private void preencherSolicitantePadrao(PropostaComercial p) {
        if (p.solicitanteNome == null || p.solicitanteNome.isBlank()) {
            p.solicitanteNome = firstNonBlank(p.clienteContato, p.clienteNome);
        }
        if (p.solicitanteEmpresa == null || p.solicitanteEmpresa.isBlank()) {
            p.solicitanteEmpresa = p.clienteNome;
        }
        if (p.modeloMotor == null || p.modeloMotor.isBlank()) {
            p.modeloMotor = p.aplicacaoMotor;
        }
        if (p.solicitanteData == null) p.solicitanteData = LocalDate.now();
    }

    private PropostaAceitePublicaDto toPublica(PropostaComercial p) {
        PropostaAceitePublicaDto d = new PropostaAceitePublicaDto();
        d.oficinaNome = branding.nameNormal();
        d.oficinaContato = branding.supportEmail();
        d.id = p.id;
        d.numeroProposta = p.numeroProposta;
        d.status = p.status;
        d.aceiteStatus = p.aceiteStatus;
        boolean expirada = "EXPIRADA".equalsIgnoreCase(p.aceiteStatus)
            || (p.aceiteTokenExpiraEm != null && p.aceiteTokenExpiraEm.isBefore(LocalDateTime.now())
                && !"ACEITA".equalsIgnoreCase(p.aceiteStatus) && !"RECUSADA".equalsIgnoreCase(p.aceiteStatus));
        d.expirada = expirada;
        d.podeEditar = !expirada && "ENVIADA".equalsIgnoreCase(p.status)
            && !"ACEITA".equalsIgnoreCase(p.aceiteStatus) && !"RECUSADA".equalsIgnoreCase(p.aceiteStatus);
        d.podeAceitar = d.podeEditar;
        if (expirada) d.mensagem = "Este link expirou. Solicite um novo envio ao comercial da oficina.";
        else if ("ACEITA".equalsIgnoreCase(p.aceiteStatus)) d.mensagem = "Proposta autorizada. Obrigado.";
        else if ("RECUSADA".equalsIgnoreCase(p.aceiteStatus)) d.mensagem = "Proposta recusada.";
        else if (!"ENVIADA".equalsIgnoreCase(p.status)
                && !"APROVADA".equalsIgnoreCase(p.status)
                && !"REJEITADA".equalsIgnoreCase(p.status)) {
            d.mensagem = "Esta proposta ainda não foi liberada para autorização. "
                    + "O comercial da oficina precisa enviar a proposta (status Enviada) "
                    + "para você preencher a solicitação e dar o aceite.";
        }
        d.dataProposta = p.dataProposta;
        d.validadeProposta = p.validadeProposta;
        d.prazoEntrega = p.prazoEntrega;
        d.formaPagamento = p.formaPagamento;
        d.observacoes = p.observacoes;
        d.moedaExibicao = p.moedaProposta;
        d.totalGeralExibicao = total(p);
        d.totalGeralUsd = p.totalGeralUsd;
        d.freteUsd = p.freteUsd;
        d.maoDeObraUsd = p.maoDeObraUsd;
        d.subtotalProdutosUsd = p.subtotalProdutosUsd;
        d.descontoValorCalculado = p.descontoValorCalculado;
        d.cotacaoDolar = p.cotacaoDolar;
        d.clienteNome = p.clienteNome;
        d.clienteCidade = p.clienteCidade;
        d.clienteEstado = p.clienteEstado;
        d.clienteContato = p.clienteContato;
        d.produtoNome = p.produtoNome;
        d.produtoPn = p.produtoPn;
        d.produtoSn = p.produtoSn;
        d.produtoManual = p.produtoManual;
        d.aplicacaoMotor = p.aplicacaoMotor;
        d.aeronavePrefixo = p.aeronavePrefixo;
        d.servicoExecutado = p.servicoExecutado;
        d.tipoServicoNome = p.tipoServicoNome;
        d.tsn = p.tsn;
        d.tso = p.tso;
        d.csn = p.csn;
        d.cso = p.cso;
        d.pnMotor = p.pnMotor;
        d.modeloMotor = firstNonBlank(p.modeloMotor, p.aplicacaoMotor);
        d.tempoDesdeHsi = p.tempoDesdeHsi;
        d.servicosFlags = p.servicosFlags;
        d.reporteCliente = p.reporteCliente;
        d.incidenteAcidente = p.incidenteAcidente;
        d.submersoAgua = p.submersoAgua;
        d.descricaoIncidente = p.descricaoIncidente;
        d.solicitanteNome = p.solicitanteNome;
        d.solicitanteEmpresa = p.solicitanteEmpresa;
        d.solicitanteCargo = p.solicitanteCargo;
        d.solicitanteData = p.solicitanteData;
        d.aceitoEm = p.aceitoEm;
        d.aceiteNome = p.aceiteNome;
        d.aceiteEmail = p.aceiteEmail;
        d.aceiteCargo = p.aceiteCargo;
        d.aceiteEmpresa = p.aceiteEmpresa;
        d.condicoesGerais = p.condicoesGerais == null || p.condicoesGerais.isBlank() ? CONDICOES : p.condicoesGerais.lines().filter(linha -> !linha.isBlank()).toList();
        List<PropostaComercialItem> itens = PropostaComercialItem.find("propostaComercial = ?1", Sort.by("ordem").ascending(), p).list();
        d.itens = itens.stream().map(i -> {
            PropostaAceitePublicaDto.ItemDto it = new PropostaAceitePublicaDto.ItemDto();
            it.produtoNome = i.produtoNome;
            it.produtoDescricao = i.produtoDescricao;
            it.produtoPn = i.produtoPn;
            it.produtoSn = i.produtoSn;
            it.quantidade = i.quantidade;
            it.valorUnitario = i.valorUnitario;
            it.valorTotal = i.valorTotal;
            return it;
        }).collect(Collectors.toList());
        return d;
    }

    private LocalDateTime calcularExpiracao(PropostaComercial p) {
        LocalDateTime porValidade = p.validadeProposta == null
            ? LocalDateTime.now().plusDays(30)
            : LocalDateTime.of(p.validadeProposta, LocalTime.of(23, 59, 59));
        LocalDateTime minimo = LocalDateTime.now().plusDays(7);
        return porValidade.isAfter(minimo) ? porValidade : minimo;
    }

    private String gerarToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static java.math.BigDecimal total(PropostaComercial p) {
        return "BRL".equals(p.moedaProposta) ? p.totalGeralBrl : "EUR".equals(p.moedaProposta) ? p.totalGeralEur : p.totalGeralUsd;
    }
    private static String trim(String s) {
        return s == null ? null : s.trim();
    }

    private static String trimTo(String s, int max) {
        if (s == null) return null;
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max);
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return nullSafe(b);
    }
}
