package com.aerosuite.service;
import com.aerosuite.domain.OS;
import com.aerosuite.dto.OSDto;
import com.aerosuite.security.InternalUserContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import java.time.*;
import java.util.*;
@ApplicationScoped
public class OsAccessPolicy {
    @Inject InternalUserContext user;
    private String perfil(){return Objects.toString(user.getPerfilCodigo(),"").toUpperCase(Locale.ROOT);}
    public boolean mecanico(){return perfil().equals("MECANICO");}
    public boolean dono(OS os){return os.mecanicoResponsavelId!=null&&Objects.equals(os.mecanicoResponsavelId,user.getUserId());}
    public void visualizar(OS os){if(mecanico()&&!dono(os))throw new ForbiddenException("OS não atribuída ao mecânico atual.");}
    public void criar(){if(Set.of("MECANICO","BIBLIOTECA").contains(perfil()))throw new ForbiddenException("Perfil sem permissão para criar OS.");}
    public void arquivos(OS os){
        if("TOTAL".equals(escopo(os)) || Set.of("ADMIN","ADMINISTRADOR","COORDENADOR","DIRETOR","CTM","SUPRIMENTO").contains(perfil()) || (mecanico()&&dono(os))) return;
        throw new ForbiddenException("Sem permissão para gerenciar arquivos desta OS.");
    }
    public String escopo(OS os){
        if(Set.of("ADMIN","ADMINISTRADOR","CTM").contains(perfil()))return "TOTAL";
        if(mecanico())return dono(os)?"MECANICO":"NENHUM";
        if(perfil().equals("BIBLIOTECA"))return "BIBLIOTECA";
        if(os.mecanicoResponsavelId!=null)return "NENHUM";
        return Boolean.TRUE.equals(os.jaEditada)&&!perfil().equals("DIRETOR")?"NENHUM":"TOTAL";
    }
    public void preencher(OS os,OSDto dto){
        dto.escopoEdicao=escopo(os);dto.podeEditar=!"NENHUM".equals(dto.escopoEdicao);
        dto.modalSomenteLeitura=!dto.podeEditar;
        dto.podeReencaminhar=Set.of("ADMIN","ADMINISTRADOR","COORDENADOR","DIRETOR").contains(perfil());
        dto.podeControlarExecucao=dono(os)||Set.of("ADMIN","ADMINISTRADOR").contains(perfil());
        dto.diasSemAtribuicao=os.mecanicoResponsavelId==null&&os.dtAbertura!=null?Math.max(0,java.time.temporal.ChronoUnit.DAYS.between(os.dtAbertura,LocalDate.now())):0;
        dto.alertaSemAtribuicao=dto.diasSemAtribuicao>5&&os.dataConclusaoServ==null;
        dto.statusOperacional=os.dataFechamento!=null?"FECHADA":os.execucaoFinalizadaEm!=null||os.dataConclusaoServ!=null?"CONCLUIDA":
                "EM_ANDAMENTO".equals(os.statusExecucao)?"EM_EXECUCAO":"PAUSADA".equals(os.statusExecucao)?"PAUSADA":os.mecanicoResponsavelId==null?"AGUARDANDO_DISTRIBUICAO":"ATRIBUIDA";
    }
}
