package com.aerosuite.domain;

import com.aerosuite.model.Perfil;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario_perfil")
public class UsuarioPerfil extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "usuario_id", nullable = false)
    public Integer usuarioId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "perfil_id", nullable = false)
    public Perfil perfil;

    @Column(nullable = false)
    public boolean ativo;

    @Column(name = "vinculado_em")
    public LocalDateTime vinculadoEm;
}
