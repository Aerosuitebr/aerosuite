package com.aerosuite.security;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Canonização de códigos de funcionalidade (BD com hífen vs underscore nas anotações). */
public final class FuncionalidadeCodigoNormalizer {

    private FuncionalidadeCodigoNormalizer() {}

    public static String canon(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return "";
        }
        return codigo.trim().toUpperCase(Locale.ROOT).replace('-', '_');
    }

    public static Set<String> canonSet(Set<String> raw) {
        Set<String> out = new HashSet<>();
        if (raw == null) {
            return out;
        }
        for (String c : raw) {
            String k = canon(c);
            if (!k.isEmpty()) {
                out.add(k);
            }
        }
        return out;
    }

    public static boolean userHasAny(Set<String> userCodesCanon, String[] requiredAny) {
        if (requiredAny == null || requiredAny.length == 0) {
            return true;
        }
        for (String code : requiredAny) {
            String k = canon(code);
            if (!k.isEmpty() && userCodesCanon.contains(k)) {
                return true;
            }
        }
        return false;
    }

    public static boolean userHasAll(Set<String> userCodesCanon, String[] requiredAll) {
        if (requiredAll == null || requiredAll.length == 0) {
            return true;
        }
        for (String code : requiredAll) {
            String k = canon(code);
            if (k.isEmpty() || !userCodesCanon.contains(k)) {
                return false;
            }
        }
        return true;
    }
}
