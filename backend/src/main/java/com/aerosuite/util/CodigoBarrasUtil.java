package com.aerosuite.util;

import com.aerosuite.i18n.ApiI18nMessages;

import java.util.logging.Logger;

/**
 * Utilitário para geração de códigos de barras
 * Gera códigos EAN-13 (13 dígitos) para produtos
 */
public class CodigoBarrasUtil {
    
    private static final Logger LOGGER = Logger.getLogger(CodigoBarrasUtil.class.getName());
    
    /**
     * Gera um código de barras EAN-13 único
     * Formato: 789 (código do Brasil) + 9 dígitos sequenciais + dígito verificador
     * 
     * @return Código de barras EAN-13 válido
     */
    public static String gerarCodigoBarras() {
        // Prefixo 789 é o código do Brasil para EAN-13
        String prefixo = "789";
        
        // Gerar 9 dígitos aleatórios (ou sequenciais baseados em timestamp)
        long timestamp = System.currentTimeMillis();
        String sequencia = String.format("%09d", timestamp % 1000000000L);
        
        // Combinar prefixo + sequência
        String codigoSemVerificador = prefixo + sequencia;
        
        // Calcular dígito verificador (algoritmo EAN-13)
        int digitoVerificador = calcularDigitoVerificadorEAN13(codigoSemVerificador);
        
        String codigoCompleto = codigoSemVerificador + digitoVerificador;
        
        LOGGER.info("Código de barras gerado: " + codigoCompleto);
        
        return codigoCompleto;
    }
    
    /**
     * Gera um código de barras baseado no ID do produto
     * Útil para garantir unicidade baseada no ID
     * 
     * @param productId ID do produto
     * @return Código de barras EAN-13 válido
     */
    public static String gerarCodigoBarrasPorId(Integer productId) {
        // Prefixo 789 é o código do Brasil para EAN-13
        String prefixo = "789";
        
        // Usar o ID do produto como base (completar com zeros à esquerda)
        String sequencia = String.format("%09d", productId);
        
        // Combinar prefixo + sequência
        String codigoSemVerificador = prefixo + sequencia;
        
        // Calcular dígito verificador (algoritmo EAN-13)
        int digitoVerificador = calcularDigitoVerificadorEAN13(codigoSemVerificador);
        
        String codigoCompleto = codigoSemVerificador + digitoVerificador;
        
        LOGGER.info("Código de barras gerado para produto ID " + productId + ": " + codigoCompleto);
        
        return codigoCompleto;
    }

    /**
     * Gera código de barras EAN-13 determinístico a partir do Part Number (mesmo P/N → mesmo código).
     */
    public static String gerarCodigoBarrasPorPn(String productpn) {
        String prefixo = "789";
        String normalized = productpn == null ? "" : productpn.trim().toUpperCase(java.util.Locale.ROOT);
        int hash = Math.floorMod(normalized.hashCode(), 1_000_000_000);
        String sequencia = String.format("%09d", hash);
        String codigoSemVerificador = prefixo + sequencia;
        int digitoVerificador = calcularDigitoVerificadorEAN13(codigoSemVerificador);
        return codigoSemVerificador + digitoVerificador;
    }
    
    /**
     * Calcula o dígito verificador para código EAN-13
     * 
     * @param codigo Código sem o dígito verificador (12 dígitos)
     * @return Dígito verificador (0-9)
     */
    private static int calcularDigitoVerificadorEAN13(String codigo) {
        if (codigo == null || codigo.length() != 12) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BARCODE_12_DIGITS_REQUIRED));
        }
        
        int soma = 0;
        
        // Somar dígitos nas posições ímpares (1, 3, 5, ...) multiplicados por 1
        // e dígitos nas posições pares (2, 4, 6, ...) multiplicados por 3
        for (int i = 0; i < 12; i++) {
            int digito = Character.getNumericValue(codigo.charAt(i));
            if (i % 2 == 0) {
                // Posições ímpares (0-indexed = 0, 2, 4, ...)
                soma += digito;
            } else {
                // Posições pares (0-indexed = 1, 3, 5, ...)
                soma += digito * 3;
            }
        }
        
        // O dígito verificador é o complemento de 10 do resto da divisão por 10
        int resto = soma % 10;
        int digitoVerificador = resto == 0 ? 0 : 10 - resto;
        
        return digitoVerificador;
    }
    
    /**
     * Valida se um código de barras EAN-13 é válido
     * 
     * @param codigo Código de barras completo (13 dígitos)
     * @return true se o código é válido, false caso contrário
     */
    public static boolean validarCodigoBarras(String codigo) {
        if (codigo == null || codigo.length() != 13) {
            return false;
        }
        
        // Verificar se todos os caracteres são dígitos
        if (!codigo.matches("\\d{13}")) {
            return false;
        }
        
        // Extrair código sem verificador e calcular verificador esperado
        String codigoSemVerificador = codigo.substring(0, 12);
        int digitoVerificadorEsperado = calcularDigitoVerificadorEAN13(codigoSemVerificador);
        int digitoVerificadorAtual = Character.getNumericValue(codigo.charAt(12));
        
        return digitoVerificadorEsperado == digitoVerificadorAtual;
    }
}
