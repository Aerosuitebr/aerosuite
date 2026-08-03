package com.aerosuite.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class OsJobCardDto {
    public Long osId;
    public Integer numeroOs;
    public String clienteNome;
    public String partNumber;
    public String serialNumber;
    public String tipoServico;
    public String dtAbertura;
    public String dataFechamento;
    public String inicioServico;
    public String fimServico;
    public String obsIniServ;
    public String obsFimServ;
    public Boolean crsEmitido;
    /** Utilizador atual provavelmente não pode emitir CRS nesta OS (segregação execução/liberação). */
    public Boolean alertaCrsSegregacao;
    /** Alertas SGQ (treinamento, calibração, NC abertas). */
    public List<String> alertasConformidade = new ArrayList<>();
    public BigDecimal totalHoras;
    public List<OsJobCardApontamentoDto> apontamentos = new ArrayList<>();
    public List<OsJobCardAssinaturaDto> assinaturas = new ArrayList<>();
    public List<OSFileDto> fotos = new ArrayList<>();
}
