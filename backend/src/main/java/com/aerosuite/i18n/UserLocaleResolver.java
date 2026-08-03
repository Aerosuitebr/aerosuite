package com.aerosuite.i18n;

import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioExterno;
import java.util.Locale;

/**
 * Locale preferido do utilizador para notificações in-app (coluna {@code usuario.idioma}).
 */
public final class UserLocaleResolver {

    private UserLocaleResolver() {}

    public static String resolve(Usuario usuario) {
        if (usuario != null && usuario.idioma != null && !usuario.idioma.isBlank()) {
            return normalize(usuario.idioma);
        }
        return "pt-BR";
    }

    public static String resolve(Long usuarioId) {
        if (usuarioId == null) {
            return "pt-BR";
        }
        Usuario u = Usuario.findById(usuarioId.intValue());
        return resolve(u);
    }

    public static String resolve(Integer usuarioId) {
        return resolve(usuarioId != null ? usuarioId.longValue() : null);
    }

    public static String resolve(com.aerosuite.domain.ClienteProposta cliente) {
        if (cliente != null && cliente.idioma != null && !cliente.idioma.isBlank()) {
            return normalize(cliente.idioma);
        }
        return "pt-BR";
    }

    public static String resolve(com.aerosuite.domain.UsuarioExterno externo) {
        if (externo == null) {
            return "pt-BR";
        }
        if (externo.clientePropostaId != null) {
            com.aerosuite.domain.ClienteProposta cliente =
                    com.aerosuite.domain.ClienteProposta.findById(externo.clientePropostaId);
            if (cliente != null) {
                return resolve(cliente);
            }
        }
        return "pt-BR";
    }

    public static String normalize(String locale) {
        if (locale == null || locale.isBlank()) {
            return "pt-BR";
        }
        String key = locale.trim().toLowerCase(Locale.ROOT);
        return switch (key) {
            case "en", "en-us", "en_us" -> "en-US";
            case "es", "es-es", "es_es" -> "es-ES";
            case "fr", "fr-fr", "fr_fr" -> "fr-FR";
            case "pt", "pt-br", "pt_br" -> "pt-BR";
            default -> locale.contains("-") ? locale : "pt-BR";
        };
    }

    /** Locale preferido a partir do e-mail do destinatário (usuário interno ou externo). */
    public static String resolveByEmail(String email) {
        if (email == null || email.isBlank()) {
            return "pt-BR";
        }
        String norm = email.trim().toLowerCase(Locale.ROOT);
        Usuario interno =
                Usuario.find("LOWER(email) = ?1 and ativo = true", norm).firstResult();
        if (interno != null) {
            return resolve(interno);
        }
        UsuarioExterno externo = com.aerosuite.domain.UsuarioExterno.findByEmail(norm);
        if (externo != null) {
            return resolve(externo);
        }
        return "pt-BR";
    }

    /** Resolve locale a partir do cabeçalho {@code Accept-Language} (primeira tag suportada). */
    public static String fromAcceptLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) {
            return "pt-BR";
        }
        for (String part : acceptLanguage.split(",")) {
            String tag = part.trim().split(";")[0].trim();
            if (!tag.isBlank()) {
                return normalize(tag);
            }
        }
        return "pt-BR";
    }
}
