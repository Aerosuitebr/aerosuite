package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class PlatformOperatorListDto {
    public List<PlatformOperatorRowDto> items = new ArrayList<>();
    public int totalEffective;
    public int totalFromConfig;
    public int totalFromGrant;

    public PlatformOperatorListDto() {}
}
