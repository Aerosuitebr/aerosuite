package com.aerosuite.dto.parts;

import java.math.BigDecimal;

public class PartsFinderSearchRequest {
    public String partNumber;
    public BigDecimal quantity;
    public String condition;
    public String country;
    public String certification;
    public boolean aog;
}
