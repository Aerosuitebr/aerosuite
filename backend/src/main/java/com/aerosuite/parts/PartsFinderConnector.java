package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import java.util.List;

/** Contrato comum para fontes internas e marketplaces oficialmente licenciados. */
public interface PartsFinderConnector {
    String source();
    List<PartsFinderResult> search(PartsFinderSearchRequest request);
}
