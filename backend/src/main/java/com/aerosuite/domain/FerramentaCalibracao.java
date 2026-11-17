package com.aerosuite.domain;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="ferramenta_calibracao")
public class FerramentaCalibracao extends PanacheEntityBase {
    @org.hibernate.annotations.TenantId @Column(name = "tenant_id", nullable = false) public String tenantId;
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
    public Long ferramentaId;
    public Long laboratorioId;
    public String status = "EM_LABORATORIO";
    public LocalDate enviadaEm;
    public LocalDate retornoPrevisto;
    public LocalDate recebidaEm;
    public LocalDate realizadaEm;
    public String certificado;
    @Column(length=500) public String arquivoNome;
    @Lob @com.fasterxml.jackson.annotation.JsonIgnore public byte[] arquivo;
    @Column(length=4000) public String resultados;
    @Column(length=4000) public String analise;
    @Column(length=2000) public String condicaoEnvio;
    public Integer enviadoPor;
    public Integer analisadoPor;
    public LocalDateTime analisadaEm;
    public boolean conferenciaFisica;
    public Integer intervaloAplicado;
    public String unidadeAplicada;
    public LocalDate proximaCalculada;
}
