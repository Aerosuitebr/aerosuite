package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class OsConformidadeAlertasDto {
    public Long osId;
    public Integer numeroOs;
    public List<String> alertas = new ArrayList<>();
    public boolean bloqueioMaterial;
}
