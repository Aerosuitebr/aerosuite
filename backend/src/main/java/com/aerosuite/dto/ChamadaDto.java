package com.aerosuite.dto;

import java.time.LocalDateTime;

public class ChamadaDto {
    public Long id;
    public Long conversaId;
    public Long chamadorId;
    public String chamadorNome;
    public Long receptorId;
    public String receptorNome;
    public String status;
    public LocalDateTime dataInicio;
    public LocalDateTime dataAtendimento;
    public LocalDateTime dataFim;
    public Long duracaoSegundos;
    public String ofertaSdp;
    public String respostaSdp;
    public String iceCandidatesChamador;
    public String iceCandidatesReceptor;
}
