package com.aerosuite.dto;

import java.util.List;

public class OsCrsEmitirRequest {
    public String crsLiberadoPorNome;
    public String crsLiberadoPorCargo;
    public String crsCertificadoNumero;
    public String crsObservacoes;
    /** Códigos estáveis dos itens do checklist que foram confirmados. */
    public List<String> checklistConfirmados;
}
