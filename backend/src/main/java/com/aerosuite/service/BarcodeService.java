package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import com.aerosuite.domain.Product;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import javax.imageio.ImageIO;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;

/**
 * Serviço para geração de códigos de barras para produtos
 */
@ApplicationScoped
public class BarcodeService {

    private static final Logger LOGGER = Logger.getLogger(BarcodeService.class);

    @Inject
    EntityManager em;

    /**
     * Gera um código de barras único no formato EAN-13
     * Formato: PPPP + NNNNNN + C
     * P = Prefixo fixo (7890 - Brasil)
     * N = Número sequencial/aleatório
     * C = Dígito verificador
     */
    public String gerarCodigoBarras() {
        String prefixo = "7890"; // Prefixo Brasil
        String numeroBase;
        String codigoCompleto;
        
        int tentativas = 0;
        do {
            // Gerar 8 dígitos aleatórios
            Random random = new Random();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                sb.append(random.nextInt(10));
            }
            numeroBase = sb.toString();
            
            // Calcular dígito verificador EAN-13
            String codigo12 = prefixo + numeroBase;
            int digitoVerificador = calcularDigitoVerificadorEAN13(codigo12);
            codigoCompleto = codigo12 + digitoVerificador;
            
            tentativas++;
            if (tentativas > 100) {
                LOGGER.warn("Muitas tentativas para gerar código de barras único");
                break;
            }
        } while (codigoBarrasExiste(codigoCompleto));
        
        return codigoCompleto;
    }

    /**
     * Gera código de barras baseado no ID do produto
     * Mais previsível e evita colisões
     */
    public String gerarCodigoBarrasPorId(Integer productId) {
        String prefixo = "7890"; // Prefixo Brasil
        
        // Formatar ID com 8 dígitos (zeros à esquerda)
        String idFormatado = String.format("%08d", productId);
        
        // Calcular dígito verificador EAN-13
        String codigo12 = prefixo + idFormatado;
        int digitoVerificador = calcularDigitoVerificadorEAN13(codigo12);
        
        return codigo12 + digitoVerificador;
    }

    /**
     * Calcula o dígito verificador para EAN-13
     */
    private int calcularDigitoVerificadorEAN13(String codigo12) {
        if (codigo12.length() != 12) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BARCODE_12_DIGITS_REQUIRED));
        }
        
        int soma = 0;
        for (int i = 0; i < 12; i++) {
            int digito = Character.getNumericValue(codigo12.charAt(i));
            if (i % 2 == 0) {
                soma += digito; // Posições ímpares (1, 3, 5...) multiplicam por 1
            } else {
                soma += digito * 3; // Posições pares (2, 4, 6...) multiplicam por 3
            }
        }
        
        int resto = soma % 10;
        return resto == 0 ? 0 : 10 - resto;
    }

    /**
     * Verifica se um código de barras já existe
     */
    public boolean codigoBarrasExiste(String codigoBarras) {
        Long count = em.createQuery(
            "SELECT COUNT(p) FROM Product p WHERE p.codigoBarras = :codigo", Long.class)
            .setParameter("codigo", codigoBarras)
            .getSingleResult();
        return count > 0;
    }

    /**
     * Gera PNG para listagens e {@code <img src>}: EAN-13 (12 dígitos → calcula DV) ou CODE128 para outros valores.
     */
    public byte[] gerarImagemCodigoBarrasParaExibicao(String codigoRaw, int largura, int altura) {
        if (codigoRaw == null || codigoRaw.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BARCODE_EMPTY));
        }
        String digitsOnly = codigoRaw.trim().replaceAll("[^0-9]", "");
        if (digitsOnly.length() == 12) {
            digitsOnly = digitsOnly + calcularDigitoVerificadorEAN13(digitsOnly);
        }
        if (digitsOnly.length() == 13 && digitsOnly.chars().allMatch(Character::isDigit)) {
            return gerarImagemCodigoBarras(digitsOnly, largura, altura);
        }
        return gerarImagemCode128(codigoRaw.trim(), largura, altura);
    }

    private byte[] gerarImagemCode128(String data, int largura, int altura) {
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.MARGIN, 0);
            BitMatrix matrix = new MultiFormatWriter().encode(data, BarcodeFormat.CODE_128, largura, altura, hints);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(matrix);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            LOGGER.error("Erro ao gerar CODE128: " + e.getMessage(), e);
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.BARCODE_CODE128_IMAGE_FAILED, e.getMessage()), e);
        }
    }

    /**
     * Gera a imagem do código de barras EAN-13
     */
    public byte[] gerarImagemCodigoBarras(String codigoBarras, int largura, int altura) {
        try {
            // Validar código
            if (codigoBarras == null || codigoBarras.length() != 13) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BARCODE_INVALID_13_DIGITS));
            }

            // Padrões EAN-13
            String[] L_PATTERNS = {
                "0001101", "0011001", "0010011", "0111101", "0100011",
                "0110001", "0101111", "0111011", "0110111", "0001011"
            };
            String[] G_PATTERNS = {
                "0100111", "0110011", "0011011", "0100001", "0011101",
                "0111001", "0000101", "0010001", "0001001", "0010111"
            };
            String[] R_PATTERNS = {
                "1110010", "1100110", "1101100", "1000010", "1011100",
                "1001110", "1010000", "1000100", "1001000", "1110100"
            };
            String[] FIRST_DIGIT_PATTERNS = {
                "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
                "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
            };

            // Primeiro dígito determina o padrão
            int firstDigit = Character.getNumericValue(codigoBarras.charAt(0));
            String pattern = FIRST_DIGIT_PATTERNS[firstDigit];

            // Construir sequência de barras
            StringBuilder barcode = new StringBuilder();
            barcode.append("101"); // Start guard

            // Primeiros 6 dígitos (após o primeiro)
            for (int i = 1; i <= 6; i++) {
                int digit = Character.getNumericValue(codigoBarras.charAt(i));
                if (pattern.charAt(i - 1) == 'L') {
                    barcode.append(L_PATTERNS[digit]);
                } else {
                    barcode.append(G_PATTERNS[digit]);
                }
            }

            barcode.append("01010"); // Center guard

            // Últimos 6 dígitos
            for (int i = 7; i <= 12; i++) {
                int digit = Character.getNumericValue(codigoBarras.charAt(i));
                barcode.append(R_PATTERNS[digit]);
            }

            barcode.append("101"); // End guard

            // Criar imagem
            int alturaBarras = altura - 25; // Espaço para texto
            int margemLateral = 10;
            int larguraUtil = largura - (2 * margemLateral);
            
            BufferedImage image = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = image.createGraphics();
            
            // Configurar antialiasing
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            
            // Fundo branco
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, largura, altura);
            
            // Desenhar barras
            g.setColor(Color.BLACK);
            String bars = barcode.toString();
            double barWidth = (double) larguraUtil / bars.length();
            
            for (int i = 0; i < bars.length(); i++) {
                if (bars.charAt(i) == '1') {
                    int x = (int) (margemLateral + i * barWidth);
                    int w = (int) Math.ceil(barWidth);
                    g.fillRect(x, 5, w, alturaBarras);
                }
            }
            
            // Desenhar número abaixo das barras
            g.setColor(Color.BLACK);
            Font font = new Font("Arial", Font.PLAIN, 12);
            g.setFont(font);
            FontMetrics fm = g.getFontMetrics();
            
            // Centralizar texto
            int textWidth = fm.stringWidth(codigoBarras);
            int textX = (largura - textWidth) / 2;
            int textY = altura - 5;
            
            g.drawString(codigoBarras, textX, textY);
            
            g.dispose();

            // Converter para PNG
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();

        } catch (Exception e) {
            LOGGER.error("Erro ao gerar imagem do código de barras: " + e.getMessage(), e);
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.BARCODE_IMAGE_FAILED, e.getMessage()), e);
        }
    }

    /**
     * Gera códigos de barras para todos os produtos que não possuem
     * @return Número de produtos atualizados
     */
    @Transactional
    public int gerarCodigosParaTodosProdutos() {
        List<Product> produtosSemCodigo = em.createQuery(
            "SELECT p FROM Product p WHERE p.codigoBarras IS NULL OR p.codigoBarras = ''", Product.class)
            .getResultList();
        
        int atualizados = 0;
        for (Product produto : produtosSemCodigo) {
            String codigo = gerarCodigoBarrasPorId(produto.id);
            produto.codigoBarras = codigo;
            em.merge(produto);
            atualizados++;
            LOGGER.info("Código de barras gerado para produto ID " + produto.id + ": " + codigo);
        }
        
        LOGGER.info("Total de produtos atualizados com código de barras: " + atualizados);
        return atualizados;
    }
}
