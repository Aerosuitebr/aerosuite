package com.aerosuite.mapping;

import com.aerosuite.domain.*;
import com.aerosuite.dto.*;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper para conversão entre entidades e DTOs de usuário externo.
 */
@ApplicationScoped
public class UsuarioExternoMapper {
    
    /**
     * Converte UsuarioExterno para DTO completo.
     */
    public UsuarioExternoDto toDto(UsuarioExterno entity) {
        if (entity == null) return null;
        
        return new UsuarioExternoDto(
            entity.id,
            entity.nome,
            entity.email,
            null, // Não retornar senha
            entity.empresa,
            entity.telefone,
            entity.cargo,
            entity.observacoes,
            entity.fotoPerfil,
            entity.ativo,
            entity.precisaTrocarSenha,
            entity.dataCadastro,
            entity.ultimoAcesso,
            entity.criadoPor,
            null, // criadoPorNome - preenchido separadamente
            null, // funcionalidades - preenchido separadamente
            null, // ordensServico - preenchido separadamente
            null, // totalOS - preenchido separadamente
            null, // totalDocumentos - preenchido separadamente
            entity.conviteEnviadoEm
        );
    }
    
    /**
     * Converte UsuarioExterno para DTO de listagem (resumido).
     */
    public UsuarioExternoDto toListDto(UsuarioExterno entity, Integer totalOS, Integer totalDocumentos) {
        if (entity == null) return null;
        
        return new UsuarioExternoDto(
            entity.id,
            entity.nome,
            entity.email,
            entity.empresa,
            entity.ativo,
            entity.ultimoAcesso,
            entity.conviteEnviadoEm,
            totalOS,
            totalDocumentos
        );
    }
    
    /**
     * Converte FuncionalidadeExterna para DTO.
     */
    public FuncionalidadeExternaDto toDto(FuncionalidadeExterna entity) {
        if (entity == null) return null;
        
        return new FuncionalidadeExternaDto(
            entity.id,
            entity.nome,
            entity.descricao,
            entity.codigo,
            entity.icone,
            entity.rota,
            entity.ordem,
            entity.ativo
        );
    }
    
    /**
     * Converte lista de FuncionalidadeExterna para lista de DTO.
     */
    public List<FuncionalidadeExternaDto> toFuncionalidadeDtoList(List<FuncionalidadeExterna> entities) {
        if (entities == null) return List.of();
        return entities.stream().map(this::toDto).collect(Collectors.toList());
    }
    
    /**
     * Converte OS para DTO resumido para usuário externo.
     */
    public OSExternaResumoDto toOSResumoDto(OS os) {
        return toOSResumoDto(os, null);
    }
    
    /**
     * Converte OS para DTO resumido para usuário externo com nome do fabricante.
     */
    public OSExternaResumoDto toOSResumoDto(OS os, String fabricanteNome) {
        if (os == null) return null;
        
        String status = "Aberta";
        if (os.dataFechamento != null) {
            status = "Fechada";
        } else if (os.dataConclusaoServ != null) {
            status = "Concluída";
        }
        
        // Garantir que idOs nunca seja null ou 0 - usar o id real como fallback
        Integer idOsValido = (os.idOs != null && os.idOs > 0) ? os.idOs : (os.id != null ? os.id.intValue() : 1);
        
        return new OSExternaResumoDto(
            os.id,
            idOsValido,
            os.clienteNome != null ? os.clienteNome : "Cliente não informado",
            os.partNumber,
            os.serialNumber,
            os.tipoServico,
            os.dtAbertura,
            os.dataFechamento,
            status,
            fabricanteNome
        );
    }
    
    /**
     * Converte OS para DTO detalhado para usuário externo.
     */
    public OSExternaDetalhadaDto toOSDetalhadaDto(OS os, List<DocumentoExternoDto> documentos) {
        return toOSDetalhadaDto(os, documentos, null, null, null, null);
    }
    
    /**
     * Converte OS para DTO detalhado para usuário externo com fabricante e FCU.
     */
    public OSExternaDetalhadaDto toOSDetalhadaDto(OS os, List<DocumentoExternoDto> documentos, 
                                                   String fabricanteNome, String modeloFcu) {
        return toOSDetalhadaDto(os, documentos, fabricanteNome, modeloFcu, null, null);
    }

    /**
     * Converte OS para DTO detalhado com vínculo opcional à proposta comercial de origem.
     */
    public OSExternaDetalhadaDto toOSDetalhadaDto(OS os, List<DocumentoExternoDto> documentos,
                                                   String fabricanteNome, String modeloFcu,
                                                   Long propostaId, String propostaNumero) {
        if (os == null) return null;
        
        String status = "Aberta";
        if (os.dataFechamento != null) {
            status = "Fechada";
        } else if (os.dataConclusaoServ != null) {
            status = "Concluída";
        }
        
        return new OSExternaDetalhadaDto(
            os.id,
            os.idOs,
            os.clienteNome,
            os.partNumber,
            os.serialNumber,
            os.tipoServico,
            fabricanteNome,
            modeloFcu,
            os.dtAbertura,
            os.dataConclusaoServ,
            os.dataFechamento,
            status,
            os.tsn,
            os.tso,
            os.ataManual != null ? os.ataManual.toString() : null,
            os.numRevisao,
            os.dataRevManual,
            os.obsConclusaoServ,
            os.adsDas,
            os.tituloAds,
            os.tituloAfins,
            os.boletinsServAfins,
            documentos,
            propostaId,
            propostaNumero
        );
    }
    
    /**
     * Converte UsuarioExternoDocumento para DTO.
     */
    public DocumentoExternoDto toDocumentoDto(UsuarioExternoDocumento doc) {
        if (doc == null) return null;
        
        String tipoArquivo = null;
        Long tamanhoArquivo = null;
        Boolean isAvulso = false;
        
        // Tentar obter informações do arquivo OSFile se existir
        if (doc.osFileId != null) {
            OSFile osFile = OSFile.findById(doc.osFileId);
            if (osFile != null) {
                tipoArquivo = osFile.fileExtension;
                tamanhoArquivo = osFile.fileSize;
                // Verifica se é documento avulso pelo caminho contendo /diversos/
                if (osFile.filePath != null) {
                    isAvulso = osFile.filePath.contains("/diversos/") || osFile.filePath.contains("\\diversos\\");
                }
            }
        }
        
        return new DocumentoExternoDto(
            doc.id,
            doc.nomeArquivo,
            doc.descricao,
            doc.podeDownload,
            doc.dataExpiracao,
            doc.dataConcessao,
            doc.visualizacoes,
            doc.ultimoAcesso,
            doc.osFileId,
            doc.tpFileId,
            tipoArquivo,
            tamanhoArquivo,
            isAvulso
        );
    }
    
    /**
     * Converte lista de UsuarioExternoDocumento para lista de DTO.
     */
    public List<DocumentoExternoDto> toDocumentoDtoList(List<UsuarioExternoDocumento> docs) {
        if (docs == null) return List.of();
        return docs.stream().map(this::toDocumentoDto).collect(Collectors.toList());
    }
    
    /**
     * Converte UsuarioExternoOS para DTO.
     */
    public UsuarioExternoOSDto toUsuarioExternoOSDto(UsuarioExternoOS entity) {
        if (entity == null) return null;
        
        return new UsuarioExternoOSDto(
            entity.id,
            entity.usuarioExterno != null ? entity.usuarioExterno.id : null,
            entity.usuarioExterno != null ? entity.usuarioExterno.nome : null,
            entity.os != null ? entity.os.id : null,
            entity.os != null ? entity.os.idOs : null,
            entity.os != null ? entity.os.clienteNome : null,
            entity.podeVisualizar,
            entity.concedidoPor,
            null, // concedidoPorNome - preenchido separadamente
            entity.dataConcessao,
            entity.observacoes
        );
    }
}
