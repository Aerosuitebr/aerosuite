package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "associacao_fcu")
public class AssociacaoFcu extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    @TenantId    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    
    @Column(name = "id_fcu")
    public Long idFcu;
    
    @Column(name = "id_product")
    public Integer idProduct;
    
    @Column(name = "qtd_product")
    public Integer qtdProduct;
    
    @Column(name = "isActive", nullable = false)
    public Boolean isActive = true; // Valor padrão true para novos registros
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_fcu", insertable = false, updatable = false)
    public Fcu fcu;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_product", insertable = false, updatable = false)
    public Product product;
}
