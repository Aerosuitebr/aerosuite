package com.aerosuite.service;

import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioPerfil;
import com.aerosuite.dto.UsuarioPerfisDto;
import com.aerosuite.model.Perfil;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ClientErrorException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class UsuarioPerfilService {
    @Inject EntityManager entityManager;
    @Inject TenantDataAccess tenant;
    @Inject PerfilService perfis;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfis;

    public List<UsuarioPerfisDto> listar() {
        long tenantId = tenant.currentTenantId();
        List<Usuario> usuarios = entityManager.createQuery(
                "SELECT u FROM Usuario u LEFT JOIN FETCH u.perfil WHERE u.orgTenantId = :tid ORDER BY u.nome, u.id",
                Usuario.class).setParameter("tid", tenantId).getResultList();
        Map<Integer, List<UsuarioPerfil>> vinculos = entityManager.createQuery(
                "SELECT v FROM UsuarioPerfil v JOIN FETCH v.perfil WHERE v.usuarioId IN "
                        + "(SELECT u.id FROM Usuario u WHERE u.orgTenantId = :tid) ORDER BY v.id",
                UsuarioPerfil.class).setParameter("tid", tenantId).getResultStream()
                .collect(Collectors.groupingBy(v -> v.usuarioId));
        return usuarios.stream().map(u -> dto(u, vinculos.getOrDefault(u.id, List.of()))).toList();
    }

    @Transactional
    public UsuarioPerfisDto salvar(int usuarioId, UsuarioPerfisDto.Atualizacao request) {
        Usuario usuario = Usuario.<Usuario>find("id = ?1 and orgTenantId = ?2", usuarioId, tenant.currentTenantId())
                .withLock(LockModeType.PESSIMISTIC_WRITE).firstResult();
        if (usuario == null) {
            throw new NotFoundException("Usuário não encontrado.");
        }
        if (request == null || request.revisao() == null || request.perfis() == null) {
            throw new BadRequestException("Informe a revisão e os vínculos de perfil.");
        }
        if (request.revisao() != usuario.perfisRevisao) {
            throw new ClientErrorException("Os vínculos foram alterados. Reabra o usuário para revisar.", 409);
        }

        List<UsuarioPerfil> existentes = vinculos(usuario.id);
        if (existentes.isEmpty() && usuario.perfil != null && usuario.perfil.disponivelParaTenant(usuario.orgTenantId)) {
            existentes = List.of(novoVinculo(usuario, usuario.perfil, true, null));
        }
        Map<Long, UsuarioPerfil> porPerfil = existentes.stream()
                .collect(Collectors.toMap(v -> v.perfil.getId(), v -> v));
        List<UsuarioPerfil> resultado = new ArrayList<>();
        Set<Long> selecionados = new HashSet<>();
        for (UsuarioPerfisDto.Alteracao alteracao : request.perfis()) {
            if (alteracao == null || alteracao.perfilId() == null || alteracao.ativo() == null
                    || !selecionados.add(alteracao.perfilId())) {
                throw new BadRequestException("Informe um estado por perfil, sem vínculos duplicados.");
            }
            Perfil perfil = perfis.buscarPorId(alteracao.perfilId());
            UsuarioPerfil existente = porPerfil.get(alteracao.perfilId());
            if (perfil == null || (!Boolean.TRUE.equals(perfil.getAtivo()) && (existente == null
                    || (alteracao.ativo() && !existente.ativo)))) {
                throw new BadRequestException("Um perfil informado está indisponível nesta organização.");
            }
            UsuarioPerfil vinculo = existente == null
                    ? novoVinculo(usuario, perfil, alteracao.ativo(), LocalDateTime.now()) : existente;
            vinculo.ativo = alteracao.ativo();
            resultado.add(vinculo);
        }
        for (UsuarioPerfil existente : existentes) {
            if (Boolean.TRUE.equals(existente.perfil.getOculto())) {
                resultado.add(existente);
            } else if (!selecionados.contains(existente.perfil.getId())) {
                existente.delete();
            }
        }
        atualizarPrincipal(usuario, resultado, usuario.perfil);
        return dto(usuario, resultado);
    }

    /** Compatibilidade com a edição simples de usuário, que troca somente o vínculo principal. */
    public void trocarPrincipal(Usuario usuario, Perfil novoPerfil) {
        List<UsuarioPerfil> vinculos = new ArrayList<>(vinculos(usuario.id));
        if (usuario.perfil != null && !Objects.equals(usuario.perfil.getId(), novoPerfil.getId())) {
            vinculos.removeIf(v -> {
                if (!Objects.equals(v.perfil.getId(), usuario.perfil.getId())) return false;
                v.delete();
                return true;
            });
        }
        UsuarioPerfil vinculo = vinculos.stream().filter(v -> Objects.equals(v.perfil.getId(), novoPerfil.getId()))
                .findFirst().orElse(null);
        if (vinculo == null) {
            vinculos.add(novoVinculo(usuario, novoPerfil, true, LocalDateTime.now()));
        } else {
            vinculo.ativo = true;
        }
        atualizarPrincipal(usuario, vinculos, novoPerfil);
    }

    public List<Perfil> efetivos(Usuario usuario) {
        if (usuario == null || usuario.id == null || !Boolean.TRUE.equals(usuario.ativo)) return List.of();
        List<UsuarioPerfil> vinculos = vinculos(usuario.id);
        if (vinculos.isEmpty()) {
            return disponivel(usuario, usuario.perfil) ? List.of(usuario.perfil) : List.of();
        }
        return efetivos(usuario, vinculos);
    }

    public Perfil principal(List<Perfil> ativos, Perfil atual) {
        return ativos.stream().filter(p -> SistemaEmpresaConfigService.isSuperPerfil(p.getCodigo(), superPerfis))
                .findFirst().orElseGet(() -> ativos.stream()
                        .filter(p -> atual != null && Objects.equals(p.getId(), atual.getId()))
                        .findFirst().orElse(ativos.isEmpty() ? null : ativos.get(0)));
    }

    private List<UsuarioPerfil> vinculos(int usuarioId) {
        return entityManager.createQuery(
                "SELECT v FROM UsuarioPerfil v JOIN FETCH v.perfil WHERE v.usuarioId = :id ORDER BY v.id",
                UsuarioPerfil.class).setParameter("id", usuarioId).getResultList();
    }

    private static List<Perfil> efetivos(Usuario usuario, List<UsuarioPerfil> vinculos) {
        return vinculos.stream().filter(v -> v.ativo && disponivel(usuario, v.perfil)).map(v -> v.perfil).toList();
    }

    private static boolean disponivel(Usuario usuario, Perfil perfil) {
        return perfil != null && Boolean.TRUE.equals(perfil.getAtivo()) && perfil.disponivelParaTenant(usuario.orgTenantId);
    }

    private void atualizarPrincipal(Usuario usuario, List<UsuarioPerfil> vinculos, Perfil preferido) {
        usuario.perfil = principal(efetivos(usuario, vinculos), preferido);
        usuario.perfisRevisao++;
    }

    private static UsuarioPerfil novoVinculo(Usuario usuario, Perfil perfil, boolean ativo, LocalDateTime desde) {
        UsuarioPerfil vinculo = new UsuarioPerfil();
        vinculo.usuarioId = usuario.id;
        vinculo.perfil = perfil;
        vinculo.ativo = ativo;
        vinculo.vinculadoEm = desde;
        vinculo.persist();
        return vinculo;
    }

    private static UsuarioPerfisDto dto(Usuario usuario, List<UsuarioPerfil> vinculos) {
        List<UsuarioPerfisDto.Vinculo> itens;
        if (vinculos.isEmpty() && usuario.perfil != null && !Boolean.TRUE.equals(usuario.perfil.getOculto())
                && usuario.perfil.disponivelParaTenant(usuario.orgTenantId)) {
            itens = List.of(dtoVinculo(usuario.perfil, true, null));
        } else {
            itens = vinculos.stream()
                    .filter(v -> !Boolean.TRUE.equals(v.perfil.getOculto()) && v.perfil.disponivelParaTenant(usuario.orgTenantId))
                    .map(v -> dtoVinculo(v.perfil, v.ativo, v.vinculadoEm)).toList();
        }
        return new UsuarioPerfisDto(usuario.id, usuario.nome, usuario.email, Boolean.TRUE.equals(usuario.ativo),
                usuario.perfisRevisao, itens);
    }

    private static UsuarioPerfisDto.Vinculo dtoVinculo(Perfil perfil, boolean ativo, LocalDateTime desde) {
        return new UsuarioPerfisDto.Vinculo(perfil.getId(), perfil.getNome(), perfil.getDescricao(), ativo,
                Boolean.TRUE.equals(perfil.getAtivo()), desde);
    }
}
