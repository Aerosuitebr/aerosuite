package com.aerosuite.service;

import com.aerosuite.domain.PropostaCcoEmail;
import com.aerosuite.domain.Usuario;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.util.*;

@ApplicationScoped
public class PropostaCcoEmailService {
    @Inject TenantDataAccess tenants;
    public record Item(Long id, String email, Integer usuarioId, String usuarioNome, String perfilNome, String perfilCodigo) {}
    public List<Item> listar() {
        return PropostaCcoEmail.<PropostaCcoEmail>list("order by email").stream().map(e -> item(e, usuario(e.usuarioId))).toList();
    }
    public List<Item> disponiveis() {
        Set<String> cadastrados = new HashSet<>(PropostaCcoEmail.<PropostaCcoEmail>listAll().stream().map(e -> e.email).toList());
        return Usuario.<Usuario>list("orgTenantId = ?1 and ativo = true order by nome", tenants.currentTenantId())
                .stream().filter(u -> u.email != null && !u.email.isBlank() && !cadastrados.contains(u.email.trim().toLowerCase(Locale.ROOT))).map(u -> new Item(null, u.email, u.id, u.nome,
                        u.perfil == null ? null : u.perfil.getNome(), u.perfil == null ? null : u.perfil.getCodigo())).toList();
    }
    private Usuario usuario(Integer id) {
        return id == null ? null : Usuario.find("id = ?1 and orgTenantId = ?2 and ativo = true", id, tenants.currentTenantId()).firstResult();
    }
    private Item item(PropostaCcoEmail e, Usuario u) {
        return new Item(e.id, e.email, e.usuarioId, u == null ? null : u.nome,
                u == null || u.perfil == null ? null : u.perfil.getNome(), u == null || u.perfil == null ? null : u.perfil.getCodigo());
    }
    @Transactional
    public Item adicionar(Item body) {
        if (body == null) throw new BadRequestException("Informe o destinatário.");
        Usuario u = usuario(body.usuarioId());
        if (body.usuarioId() != null && u == null) throw new BadRequestException("Usuário inválido.");
        String email = normalizarEmail(u != null ? u.email : body.email());
        PropostaCcoEmail e = PropostaCcoEmail.find("email", email).firstResult();
        if (e == null) {
            e = new PropostaCcoEmail(); e.tenantId = tenants.currentTenantIdStr(); e.email = email;
            e.usuarioId = u == null ? null : u.id; e.persistAndFlush();
        }
        return item(e, u);
    }
    public static String normalizarEmail(String value) {
        String email = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 254 || !email.matches("[^\\s@,;<>]+@[^\\s@,;<>]+\\.[^\\s@,;<>]+"))
            throw new BadRequestException("E-mail inválido.");
        return email;
    }
    @Transactional
    public void remover(Long id) {
        PropostaCcoEmail e = PropostaCcoEmail.findById(id);
        if (e == null) throw new NotFoundException();
        e.delete();
    }
    public List<String> destinatarios(String destino) {
        return PropostaCcoEmail.<PropostaCcoEmail>listAll().stream()
                .filter(e -> e.usuarioId == null || usuario(e.usuarioId) != null)
                .map(e -> e.email).filter(e -> !e.equalsIgnoreCase(destino)).distinct().toList();
    }
    public List<String> destinatarios(String destino, String informados) {
        if (informados == null) return destinatarios(destino);
        if (informados.length() > 16000) throw new BadRequestException("Lista de CCo muito longa.");
        LinkedHashSet<String> emails = new LinkedHashSet<>();
        for (String valor : informados.split("[;,\\r\\n]+")) {
            if (valor.isBlank()) continue;
            String email = normalizarEmail(valor);
            if (!email.equalsIgnoreCase(destino)) emails.add(email);
        }
        if (emails.size() > 50) throw new BadRequestException("Limite de 50 destinatários em cópia oculta.");
        return List.copyOf(emails);
    }
}
