package com.aerosuite.dto;

import com.aerosuite.domain.OSAuditoria.AcaoAuditoria;
import java.time.LocalDateTime;

/**
 * DTO para Auditoria de OS
 */
public class OSAuditoriaDto {

    public Long id;
    public Long idOs;
    public Integer numeroOs;
    public AcaoAuditoria acao;
    public String acaoDescricao;
    public String campoAlterado;
    public String campoAlteradoLabel; // Nome amigável do campo
    public String valorAnterior;
    public String valorNovo;
    public String snapshotOs;
    public Long usuarioId;
    public String usuarioNome;
    public String usuarioEmail;
    public String ipOrigem;
    public String userAgent;
    public LocalDateTime dataHora;

    // Construtor padrão
    public OSAuditoriaDto() {}

    // Método para obter label amigável do campo
    public static String getLabelCampo(String campo) {
        if (campo == null) return null;
        
        switch (campo) {
            case "idOs": return "Número da OS";
            case "clienteNome": return "Cliente";
            case "tipoServico": return "Tipo de Serviço";
            case "partNumber": return "Part Number";
            case "serialNumber": return "Serial Number";
            case "dtAbertura": return "Data de Abertura";
            case "dataFechamento": return "Data de Fechamento";
            case "dataConclusaoServ": return "Data Conclusão Serviço";
            case "marcasMatricula": return "Marcas/Matrícula";
            case "motor": return "Motor";
            case "snMotor": return "S/N Motor";
            case "manualPn": return "Manual P/N";
            case "ataManual": return "ATA Manual";
            case "dataRevManual": return "Data Rev. Manual";
            case "numRevisao": return "Número Revisão";
            case "tsn": return "TSN";
            case "tso": return "TSO";
            case "adsDas": return "ADs/DAs";
            case "tituloAds": return "Título ADs";
            case "tituloAfins": return "Título Afins";
            case "boletinsServAfins": return "Boletins Serv. Afins";
            case "obsIniServ": return "Obs. Início Serviço";
            case "inicioServico": return "Início Serviço";
            case "fimServico": return "Fim Serviço";
            case "obsFimServ": return "Obs. Fim Serviço";
            case "obsConclusaoServ": return "Obs. Conclusão Serviço";
            case "numOsOriginal": return "Nº OS Original";
            case "idFabricante": return "Fabricante";
            case "idFcu": return "FCU";
            case "isActive": return "Status Ativo";
            case "ARQUIVO_UPLOAD_MULTIPART": return "Arquivo (upload direto)";
            case "ARQUIVO_UPLOAD_DIVERSOS_OS": return "Arquivo (pasta diversos da OS)";
            case "ARQUIVO_UPLOAD_DIVERSOS_GLOBAL": return "Arquivo (diversos globais)";
            case "ARQUIVO_ASSOCIACAO": return "Arquivo (associação da biblioteca)";
            case "ARQUIVO_EXCLUSAO": return "Arquivo (remoção)";
            default: return campo;
        }
    }
}
