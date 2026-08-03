package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PlatformOnboardingHubDto {
    public List<PlatformOnboardingRowDto> items = new ArrayList<>();
    public int total;
    public int pendingInfo;
    public int inProgress;
    public int ready;
    public int completed;
}
