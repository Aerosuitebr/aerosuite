package com.aerosuite.mapping;

import com.aerosuite.domain.Product;
import com.aerosuite.dto.ProductDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ProductMapper {
    @Mapping(target = "fabricanteNome", source = "fabricante.nome")
    ProductDto toDto(Product e);

    // Para UPDATE - ignora valores nulos (não sobrescreve campos existentes com null)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "photoUrl", ignore = true)
    @Mapping(target = "codigoBarras", ignore = true)
    void updateEntity(ProductDto dto, @MappingTarget Product entity);

    // Para CREATE - copia TODOS os valores, incluindo nulls
    @Mapping(target = "id", ignore = true) // ID é gerado automaticamente
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "fabricante", ignore = true) // Relacionamento gerenciado pelo JPA
    @Mapping(target = "createdAt", ignore = true) // Definido no service
    @Mapping(target = "updatedAt", ignore = true) // Definido no service
    @Mapping(target = "createdBy", ignore = true) // Definido no service
    Product toEntity(ProductDto dto);
}
