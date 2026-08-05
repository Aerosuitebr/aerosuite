package com.aerosuite.util;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Locale;

/**
 * Repara texto exibido com mojibake ou perda de acentos ({@code ??}) sem alterar o banco.
 * Usado em DTOs de leitura (ex.: plano de controle).
 */
public final class DisplayTextRepair {

    private DisplayTextRepair() {}

    public static String repair(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        String s = Normalizer.normalize(text, Normalizer.Form.NFC);
        s = repairMojibake(s);
        s = repairQuestionMarkPatterns(s);
        return s;
    }

    private static String repairMojibake(String value) {
        if (value.contains("├")) {
            try {
                byte[] bytes = value.getBytes(Charset.forName("IBM850"));
                String decoded = new String(bytes, StandardCharsets.UTF_8);
                if (!decoded.contains("\uFFFD") && !decoded.equals(value)) {
                    return decoded;
                }
            } catch (Exception ignored) {
                // mantém original
            }
        }
        if (!value.contains("Ã") && !value.contains("Â")) {
            return value;
        }
        String replaced = value
                .replace("Ã¡", "á").replace("Ã ", "à").replace("Ã¢", "â").replace("Ã£", "ã")
                .replace("Ã©", "é").replace("Ãª", "ê")
                .replace("Ã­", "í")
                .replace("Ã³", "ó").replace("Ã´", "ô").replace("Ãµ", "õ")
                .replace("Ãº", "ú").replace("Ã§", "ç")
                .replace("Ã‰", "É").replace("Ã‡", "Ç");
        if (!replaced.equals(value)) {
            return replaced;
        }
        try {
            byte[] bytes = value.getBytes(StandardCharsets.ISO_8859_1);
            String decoded = new String(bytes, StandardCharsets.UTF_8);
            if (!decoded.contains("\uFFFD") && !decoded.equals(value)) {
                return decoded;
            }
        } catch (Exception ignored) {
            // mantém original
        }
        return value;
    }

    private static String repairQuestionMarkPatterns(String value) {
        String s = value;
        s = s.replaceAll("(?i)Mec\\?{1,2}nico", "Mecânico");
        s = s.replaceAll("(?i)Guimar\\?{1,2}es", "Guimarães");
        s = s.replaceAll("(?i)PE\\?{1,2}ANHA", "PEÇANHA");
        s = s.replaceAll("(?i)Pe\\?{1,2}anha", "Peçanha");
        s = s.replaceAll("(?i)\\?{1,2}LCIO", "ÉLCIO");
        s = s.replaceAll("(?i)Manuten\\?{1,2}o", "Manutenção");
        s = s.replaceAll("(?i)T[eé]cnico de Manuten[cç][aã]o", "Técnico de Manutenção");
        s = s.replaceAll("(?i)Administra\\?{1,2}o", "Administração");
        s = s.replaceAll("(?i)Informa\\?{1,2}o", "Informação");
        s = s.replaceAll("(?i)Calibra\\?{1,2}o", "Calibração");
        s = s.replaceAll("(?i)Inspe\\?{1,2}o", "Inspeção");
        s = s.replaceAll("(?i)Servi\\?{1,2}o", "Serviço");
        s = s.replaceAll("(?i)Homologa\\?{1,4}o", "Homologação");
        s = s.replaceAll("(?i)Demonstra\\?{1,4}o", "Demonstração");
        s = s.replaceAll("(?i)Revis\\?{1,2}o", "Revisão");
        s = s.replaceAll("(?i)Permiss\\?{1,4}es", "Permissões");
        s = s.replaceAll("(?i)N\\?{1,2}o", "Não");
        if (s.toUpperCase(Locale.ROOT).startsWith("?") && s.length() > 1) {
            char next = s.charAt(s.lastIndexOf('?') + 1);
            if ("AEIOU".indexOf(Character.toUpperCase(next)) >= 0) {
                s = "É" + s.substring(s.lastIndexOf('?') + 1);
            }
        }
        return s;
    }
}
