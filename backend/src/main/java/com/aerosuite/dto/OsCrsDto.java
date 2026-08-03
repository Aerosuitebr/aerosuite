package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.List;

public class OsCrsDto {
    public Long osId;
    public Integer numeroOs;
    public boolean emitido;
    public LocalDateTime crsEmitidoEm;
    public Long crsLiberadoPorUsuarioId;
    public String crsLiberadoPorNome;
    public String crsLiberadoPorCargo;
    public String crsCertificadoNumero;
    public String crsObservacoes;
    public List<String> checklistItensMarcados;
}
