package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="ferramenta_movimento")
public class FerramentaMovimento extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    public Long ferramentaId;
    public Long custodiaOrigemId;
    public Long osId;
    public Integer mecanicoId;
    public Integer solicitanteId;
    public String tipo;
    @Column(name = "pn_solicitacao", length = 100)
    public String pnSolicitacao;
    @Column(name = "solicitacao_origem_id")
    public Long solicitacaoOrigemId;
    public String terminalId;
    public String estacaoCodigo;
    public String estacaoNome;
    public String maquina;
    public String status = "PENDENTE";
    public String localizacao;
    public LocalDateTime retornoPrevisto;
    public Integer entregaPor;
    public Integer recebidoPor;
    public Integer cienciaPor;
    public LocalDateTime entregaEm;
    public LocalDateTime recebidoEm;
    public LocalDateTime cienciaEm;
    public LocalDateTime criadoEm;
}
