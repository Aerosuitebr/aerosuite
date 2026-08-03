package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.Scanner;

/**
 * Serviço para integração com Microsoft OneDrive via Microsoft Graph API
 * Verifica atualizações em uma pasta específica do OneDrive
 */
@ApplicationScoped
public class OneDriveService {
    
    private static final Logger LOGGER = Logger.getLogger(OneDriveService.class);
    
    private static final String GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";
    private static final String TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    
    @Inject
    @ConfigProperty(name = "onedrive.enabled", defaultValue = "false")
    boolean oneDriveEnabled;
    
    @Inject
    @ConfigProperty(name = "onedrive.client.id")
    Optional<String> clientId;
    
    @Inject
    @ConfigProperty(name = "onedrive.client.secret")
    Optional<String> clientSecret;
    
    @Inject
    @ConfigProperty(name = "onedrive.tenant.id", defaultValue = "common")
    String tenantId;
    
    @Inject
    @ConfigProperty(name = "onedrive.folder.path", defaultValue = "/Updates")
    String folderPath;
    
    @Inject
    @ConfigProperty(name = "onedrive.refresh.token")
    Optional<String> refreshToken;
    
    private String accessToken;
    private long tokenExpiresAt;
    
    /**
     * Verifica se há atualizações disponíveis na pasta do OneDrive
     * @return Versão mais recente encontrada ou null se não houver atualizações
     */
    public String verificarAtualizacaoDisponivel() {
        if (!isEnabled()) {
            LOGGER.info("OneDrive está desabilitado nas configurações ou propriedades não configuradas");
            return null;
        }
        
        try {
            // Obter token de acesso
            String token = obterAccessToken();
            if (token == null) {
                LOGGER.error("Não foi possível obter token de acesso do OneDrive");
                return null;
            }
            
            // Listar arquivos na pasta de atualizações
            String folderId = obterFolderId(token, folderPath);
            if (folderId == null) {
                LOGGER.warn("Pasta de atualizações não encontrada: " + folderPath);
                return null;
            }
            
            // Buscar arquivo de versão ou arquivos de atualização
            String latestVersion = buscarUltimaVersao(token, folderId);
            
            return latestVersion;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao verificar atualizações no OneDrive: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Baixa um arquivo específico do OneDrive
     * @param fileName Nome do arquivo a ser baixado
     * @param destinationPath Caminho local onde salvar o arquivo
     * @return true se o download foi bem-sucedido
     */
    public boolean baixarArquivo(String fileName, String destinationPath) {
        if (!isEnabled()) {
            LOGGER.error("OneDrive está desabilitado ou propriedades não configuradas");
            return false;
        }
        
        try {
            String token = obterAccessToken();
            if (token == null) {
                return false;
            }
            
            String folderId = obterFolderId(token, folderPath);
            if (folderId == null) {
                return false;
            }
            
            // Buscar arquivo na pasta
            String fileId = buscarArquivoId(token, folderId, fileName);
            if (fileId == null) {
                LOGGER.error("Arquivo não encontrado: " + fileName);
                return false;
            }
            
            // Baixar conteúdo do arquivo
            String downloadUrl = GRAPH_API_BASE + "/me/drive/items/" + fileId + "/content";
            
            HttpURLConnection conn = (HttpURLConnection) URI.create(downloadUrl).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.error("Erro ao baixar arquivo. Código: " + responseCode);
                return false;
            }
            
            // Salvar arquivo localmente
            Path destPath = Paths.get(destinationPath);
            Files.createDirectories(destPath.getParent());
            
            try (InputStream in = conn.getInputStream();
                 FileOutputStream out = new FileOutputStream(destPath.toFile())) {
                
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
            
            LOGGER.info("Arquivo baixado com sucesso: " + destinationPath);
            return true;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao baixar arquivo do OneDrive: " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Obtém token de acesso usando refresh token
     */
    private String obterAccessToken() {
        // Verificar se as propriedades necessárias estão configuradas
        if (!clientId.isPresent() || !clientSecret.isPresent() || !refreshToken.isPresent()) {
            LOGGER.error("Propriedades do OneDrive não configuradas (clientId, clientSecret ou refreshToken)");
            return null;
        }
        
        // Se o token ainda é válido, retornar o existente
        if (accessToken != null && System.currentTimeMillis() < tokenExpiresAt) {
            return accessToken;
        }
        
        try {
            String url = TOKEN_ENDPOINT;
            String params = "client_id=" + URLEncoder.encode(clientId.get(), StandardCharsets.UTF_8)
                    + "&scope=" + URLEncoder.encode("Files.Read offline_access", StandardCharsets.UTF_8)
                    + "&refresh_token=" + URLEncoder.encode(refreshToken.get(), StandardCharsets.UTF_8)
                    + "&grant_type=refresh_token"
                    + "&client_secret=" + URLEncoder.encode(clientSecret.get(), StandardCharsets.UTF_8);
            
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setDoOutput(true);
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = params.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                LOGGER.error("Erro ao obter token. Código: " + responseCode);
                try (Scanner scanner = new Scanner(conn.getErrorStream())) {
                    String errorBody = scanner.useDelimiter("\\A").hasNext() ? scanner.next() : "";
                    LOGGER.error("Resposta de erro: " + errorBody);
                }
                return null;
            }
            
            StringBuilder response = new StringBuilder();
            try (Scanner scanner = new Scanner(conn.getInputStream())) {
                while (scanner.hasNextLine()) {
                    response.append(scanner.nextLine());
                }
            }
            
            // Parse JSON simples (em produção, usar uma biblioteca JSON)
            String responseStr = response.toString();
            String accessTokenValue = extrairValorJson(responseStr, "access_token");
            String expiresInStr = extrairValorJson(responseStr, "expires_in");
            
            if (accessTokenValue != null) {
                this.accessToken = accessTokenValue;
                int expiresIn = expiresInStr != null ? Integer.parseInt(expiresInStr) : 3600;
                this.tokenExpiresAt = System.currentTimeMillis() + (expiresIn - 300) * 1000L; // 5 min de margem
                return accessToken;
            }
            
            return null;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao obter token de acesso: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Obtém o ID da pasta no OneDrive
     */
    private String obterFolderId(String token, String path) {
        try {
            // Converter caminho para formato do Graph API
            String encodedPath = path.replace(" ", "%20");
            String url = GRAPH_API_BASE + "/me/drive/root:" + encodedPath;
            
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                return null;
            }
            
            StringBuilder response = new StringBuilder();
            try (Scanner scanner = new Scanner(conn.getInputStream())) {
                while (scanner.hasNextLine()) {
                    response.append(scanner.nextLine());
                }
            }
            
            return extrairValorJson(response.toString(), "id");
            
        } catch (Exception e) {
            LOGGER.error("Erro ao obter ID da pasta: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Busca a última versão disponível na pasta
     */
    private String buscarUltimaVersao(String token, String folderId) {
        try {
            String url = GRAPH_API_BASE + "/me/drive/items/" + folderId + "/children";
            
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                return null;
            }
            
            StringBuilder response = new StringBuilder();
            try (Scanner scanner = new Scanner(conn.getInputStream())) {
                while (scanner.hasNextLine()) {
                    response.append(scanner.nextLine());
                }
            }
            
            // Buscar arquivo version.txt ou arquivo mais recente
            String responseStr = response.toString();
            
            // Procurar por version.txt primeiro
            if (responseStr.contains("version.txt")) {
                String versionFileId = buscarArquivoId(token, folderId, "version.txt");
                if (versionFileId != null) {
                    String versionContent = baixarConteudoArquivo(token, versionFileId);
                    if (versionContent != null) {
                        return versionContent.trim();
                    }
                }
            }
            
            // Se não encontrar version.txt, procurar por arquivos de atualização
            // (ex: update-1.0.1.jar, aerosuite-1.0.1.zip)
            // Extrair versões dos nomes de arquivos
            String latestVersion = null;
            // Implementar lógica para extrair versões de nomes de arquivos
            // Por enquanto, retornar null se não encontrar version.txt
            
            return latestVersion;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao buscar última versão: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Busca o ID de um arquivo específico na pasta
     */
    private String buscarArquivoId(String token, String folderId, String fileName) {
        try {
            String url = GRAPH_API_BASE + "/me/drive/items/" + folderId + "/children";
            
            HttpURLConnection conn = (HttpURLConnection) URI.create(url).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                return null;
            }
            
            StringBuilder response = new StringBuilder();
            try (Scanner scanner = new Scanner(conn.getInputStream())) {
                while (scanner.hasNextLine()) {
                    response.append(scanner.nextLine());
                }
            }
            
            String responseStr = response.toString();
            // Buscar arquivo pelo nome (parse JSON simples)
            // Em produção, usar biblioteca JSON adequada
            int fileIndex = responseStr.indexOf("\"name\":\"" + fileName + "\"");
            if (fileIndex != -1) {
                // Buscar ID próximo ao nome
                int idStart = responseStr.lastIndexOf("\"id\":\"", fileIndex);
                if (idStart != -1) {
                    idStart += 6;
                    int idEnd = responseStr.indexOf("\"", idStart);
                    if (idEnd != -1) {
                        return responseStr.substring(idStart, idEnd);
                    }
                }
            }
            
            return null;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao buscar ID do arquivo: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Baixa o conteúdo de um arquivo como string
     */
    private String baixarConteudoArquivo(String token, String fileId) {
        try {
            String downloadUrl = GRAPH_API_BASE + "/me/drive/items/" + fileId + "/content";
            
            HttpURLConnection conn = (HttpURLConnection) URI.create(downloadUrl).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            
            int responseCode = conn.getResponseCode();
            if (responseCode != 200) {
                return null;
            }
            
            StringBuilder content = new StringBuilder();
            try (Scanner scanner = new Scanner(conn.getInputStream())) {
                while (scanner.hasNextLine()) {
                    content.append(scanner.nextLine());
                }
            }
            
            return content.toString();
            
        } catch (Exception e) {
            LOGGER.error("Erro ao baixar conteúdo do arquivo: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Extrai valor de um campo JSON simples
     */
    private String extrairValorJson(String json, String key) {
        String searchKey = "\"" + key + "\":\"";
        int start = json.indexOf(searchKey);
        if (start == -1) {
            // Tentar sem aspas (para números)
            searchKey = "\"" + key + "\":";
            start = json.indexOf(searchKey);
            if (start == -1) {
                return null;
            }
            start += searchKey.length();
            int end = json.indexOf(",", start);
            if (end == -1) {
                end = json.indexOf("}", start);
            }
            if (end == -1) {
                return null;
            }
            return json.substring(start, end).trim().replace("\"", "");
        }
        
        start += searchKey.length();
        int end = json.indexOf("\"", start);
        if (end == -1) {
            return null;
        }
        return json.substring(start, end);
    }
    
    public boolean isEnabled() {
        // OneDrive está habilitado apenas se:
        // 1. oneDriveEnabled = true
        // 2. Todas as propriedades necessárias estão configuradas
        return oneDriveEnabled 
                && clientId.isPresent() 
                && clientSecret.isPresent() 
                && refreshToken.isPresent();
    }
}

