package com.aerosuite.integration.bling;

import java.util.ArrayList;
import java.util.List;

public class BlingNfeReadinessDto {
    public boolean ready;
    public List<BlingNfeReadinessCheckDto> checks = new ArrayList<>();
    public List<String> blockers = new ArrayList<>();
    public List<String> warnings = new ArrayList<>();
    public String message;
}
