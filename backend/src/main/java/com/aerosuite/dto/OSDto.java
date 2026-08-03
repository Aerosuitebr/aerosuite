package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OSDto {
    public Long id;
    public Integer idOs;
    public String adsDas;
    public String ataManual;
    public String clienteNome;
    public LocalDate dataConclusaoServ;
    public LocalDate dataFechamento;
    public LocalDate dataRevManual;
    public LocalDate dtAbertura;
    // IDs originais (para persistência no banco)
    public Integer idFabricanteId;
    public Integer idFcuId;
    // Objetos relacionados (como no sistema antigo: idFabricante é um objeto Fabricante)
    public FabricanteDto idFabricante;
    public FcuDto idFcu;
    // Objeto FCU relacionado (para acesso como os.fcu.pn, os.fcu.modelo, etc.)
    public FcuDto fcu;
    
    // Objeto Fabricante relacionado (para acesso como os.fabricante.nome)
    public FabricanteDto fabricante;
    
    // Dados do Fabricante (carregados via relacionamento) - campos planos
    public String fabricanteNome;
    public String nomeFabricante;      // Alias para compatibilidade
    
    // Dados do FCU (carregados via relacionamento) - campos planos
    public String fcuCodigo;
    public String fcuDescription;
    public String fcuModelo;
    public String fcuPn;
    public String fcuSerialNumber;
    public String ata;                 // Preenchido de fcu.ataManual
    public String modelo;               // Preenchido de fcu.modelo (alias)
    public String pn;                  // Preenchido de fcu.pn (alias)
    
    public String tsn;
    public String tso;
    public String marcasMatricula;
    public String motor;
    public String snMotor;
    public String manualPn;
    public String numOsOriginal;
    public String numRevisao;
    public String obsConclusaoServ;
    public String obsFimServ;
    public String serialNumber;
    public String obsIniServ;
    // Campos de observações do serviço
    public String inicioServico;
    public String fimServico;
    // Tipo de Serviço - nome armazenado no banco (para compatibilidade)
    public String tipoServico;
    // ID do tipo de serviço (para o frontend selecionar na combo)
    public Integer tipoServicoId;
    // Objeto TipoServico relacionado (para acesso como os.tipoServico.nome)
    public TipoServicoDto tipoServicoObj;
    public String tituloAds;
    public String tituloAfins;
    public String boletinsServAfins;
    public String partNumber;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public String createdBy;
    public Boolean isActive;
    
    // Lista de nomes de arquivos para associar à OS
    public List<String> fileNames;
    
    // Lista de arquivos associados (preenchida ao consultar)
    public List<OSFileDto> files;

    /** Comentário do mecânico na Solicitação de Troca Eventual */
    public String solicitacaoTrocasComentario;

    /** Itens de produto solicitados (Troca Eventual), com coluna pago para suprimento/admin/diretor */
    public List<OSSolicitacaoTrocaItemDto> solicitacaoTrocasItens;

    /**
     * Indica que a OS foi salva com déficit de estoque em itens do kit FCU
     * (existe registro em {@code os_kit_fcu_deficit}). Usado pela listagem para
     * mostrar um indicador específico (distinto da Solicitação de Troca Eventual).
     */
    public Boolean temDeficitKitFcu;

    /** CRS / liberação para serviço (somente leitura na listagem e detalhe). */
    public Boolean crsEmitido;
    public LocalDateTime crsEmitidoEm;
    public String crsCertificadoNumero;
    public String crsLiberadoPorNome;
    public String crsLiberadoPorCargo;

    /** Vínculos estruturados tarefa ↔ AD/SB/manual (REQ-007). */
    public List<OsTarefaDadoTecnicoDto> tarefasDadosTecnicos;
    
    @Override
    public String toString() {
        return "OSDto{" +
                "id=" + id +
                ", idOs=" + idOs +
                ", idFcu=" + idFcu +
                ", idFabricante=" + idFabricante +
                ", clienteNome='" + clienteNome + '\'' +
                ", serialNumber='" + serialNumber + '\'' +
                ", ataManual='" + ataManual + '\'' +
                ", partNumber='" + partNumber + '\'' +
                ", dtAbertura=" + dtAbertura +
                ", isActive=" + isActive +
                ", fileNames=" + fileNames +
                '}';
    }
}
