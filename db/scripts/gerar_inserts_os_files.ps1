# ========================================
# Script para gerar INSERTs de os_files
# ========================================
# Este script percorre as pastas de OS e gera comandos SQL
# para associar os arquivos às respectivas OS

$osPath = "C:\Aero Suite\Sistema\producao\aerosuite-fullstack-1.2.0 (1)\aerosuite-fullstack-pro\backend\os"
$outputFile = "C:\Aero Suite\Sistema\producao\aerosuite-fullstack-1.2.0 (1)\aerosuite-fullstack-pro\db\scripts\insert_os_files.sql"

# Iniciar o arquivo SQL
$sqlContent = @"
-- ========================================
-- INSERTS PARA TABELA os_files
-- ========================================
-- Gerado automaticamente em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Associa arquivos existentes às suas respectivas OS

SET NAMES utf8mb4;

-- Limpar registros existentes (opcional - descomente se necessário)
-- TRUNCATE TABLE os_files;

"@

$totalFiles = 0
$totalFolders = 0

# Percorrer todas as pastas numéricas (OS IDs)
Get-ChildItem -Path $osPath -Directory | Where-Object { $_.Name -match '^\d+$' } | ForEach-Object {
    $osId = $_.Name
    $osFolder = $_.FullName
    $totalFolders++
    
    # Percorrer arquivos dentro da pasta da OS
    Get-ChildItem -Path $osFolder -File -ErrorAction SilentlyContinue | ForEach-Object {
        $file = $_
        $fileName = $file.Name
        $originalName = $file.Name
        $filePath = "os/$osId/$fileName"
        $fileSize = $file.Length
        $extension = $file.Extension.TrimStart('.').ToLower()
        
        # Determinar content type baseado na extensão
        $contentType = switch ($extension) {
            'pdf'  { 'application/pdf' }
            'doc'  { 'application/msword' }
            'docx' { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
            'xls'  { 'application/vnd.ms-excel' }
            'xlsx' { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            'jpg'  { 'image/jpeg' }
            'jpeg' { 'image/jpeg' }
            'png'  { 'image/png' }
            'gif'  { 'image/gif' }
            'txt'  { 'text/plain' }
            'xml'  { 'application/xml' }
            'zip'  { 'application/zip' }
            'rar'  { 'application/x-rar-compressed' }
            default { 'application/octet-stream' }
        }
        
        # Escapar aspas simples no nome do arquivo
        $fileNameEscaped = $fileName -replace "'", "''"
        $originalNameEscaped = $originalName -replace "'", "''"
        $filePathEscaped = $filePath -replace "'", "''"
        
        # Gerar INSERT
        $insert = "INSERT INTO os_files (os_id, file_name, original_name, file_path, file_size, content_type, file_extension, is_active) VALUES ($osId, '$fileNameEscaped', '$originalNameEscaped', '$filePathEscaped', $fileSize, '$contentType', '$extension', 1);"
        
        $sqlContent += $insert + "`n"
        $totalFiles++
    }
}

# Adicionar estatísticas no final
$sqlContent += @"

-- ========================================
-- RESUMO
-- ========================================
-- Total de pastas (OS) processadas: $totalFolders
-- Total de arquivos inseridos: $totalFiles

-- Verificação
SELECT 'Total de arquivos inseridos:' AS info, COUNT(*) AS total FROM os_files;
SELECT os_id, COUNT(*) AS arquivos FROM os_files GROUP BY os_id ORDER BY os_id LIMIT 20;
"@

# Salvar arquivo SQL
$sqlContent | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "========================================" -ForegroundColor Green
Write-Host "Script SQL gerado com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Arquivo: $outputFile" -ForegroundColor Yellow
Write-Host "Pastas processadas: $totalFolders" -ForegroundColor Cyan
Write-Host "Arquivos encontrados: $totalFiles" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximo passo: Execute o arquivo SQL no MySQL Workbench" -ForegroundColor White
