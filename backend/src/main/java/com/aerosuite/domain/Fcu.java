package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.time.LocalDate;

@Entity
@Table(name = "fcu")
public class Fcu extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "fcu_codigo", length = 15)
    public String fcuCodigo;

    @Column(name = "fcu_description", length = 100)
    public String fcuDescription;

    @Column(name = "id_product")
    public Integer idProduct;

    @Column(name = "id_fabricante")
    public Integer idFabricante;

    @Column(name = "modelo", length = 200)
    public String modelo;

    @Column(name = "pn", length = 20)
    public String pn;

    @Column(name = "serial_number", length = 20)
    public String serialNumber;

    @Column(name = "ata_manual")
    public String ataManual;

    @Column(name = "data_rev_manual")
    public LocalDate dataRevManual;

    @Column(name = "num_revisao")
    public String numRevisao;

    @Column(name = "is_active")
    public Boolean isActive = true; // Valor padrão true para novos registros
}
