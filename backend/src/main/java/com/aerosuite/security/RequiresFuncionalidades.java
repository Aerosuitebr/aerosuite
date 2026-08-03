package com.aerosuite.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declara requisitos de acesso alinhados aos códigos da tabela {@code funcionalidade}
 * (e ao menu Angular). Avaliado por {@link PermissionAuthorizationFilter}.
 * Migração opcional para {@code @RolesAllowed} / Quarkus Security permanece adiada.
 * <p>
 * Combinação: o utilizador deve satisfazer {@link #allOf()} (todos) e, se
 * {@link #anyOf()} ou {@link #anyCodigoStartingWith()} forem não vazios, pelo menos
 * um requisito em cada grupo não vazio.
 * <p>
 * Quando a anotação existe ao mesmo tempo na classe JAX-RS e no método,
 * {@link com.aerosuite.security.PermissionAuthorizationFilter} aplica <strong>ambas</strong>
 * em sequência (intersecção).
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
public @interface RequiresFuncionalidades {

    /**
     * Quando {@code true}, basta utilizador interno autenticado (JWT válido); carrega o snapshot
     * de permissões sem exigir códigos de funcionalidade. Útil para notificações, chamadas, etc.
     */
    boolean onlyAuthenticated() default false;

    /** Códigos exatos que devem estar todos presentes no perfil do utilizador. */
    String[] allOf() default {};

    /** Pelo menos um destes códigos exatos. */
    String[] anyOf() default {};

    /**
     * Pelo menos um código do utilizador deve ser igual ao prefixo ou começar por
     * {@code PREFIXO_} (útil para família ESTOQUE / ESTOQUE_*).
     */
    String[] anyCodigoStartingWith() default {};

    /**
     * Quando {@code true}, pedidos autenticados com token legado de utilizador externo
     * podem passar (caso raro); por defeito recursos internos recusam-no com 403.
     */
    boolean allowExternalLegacy() default false;
}
