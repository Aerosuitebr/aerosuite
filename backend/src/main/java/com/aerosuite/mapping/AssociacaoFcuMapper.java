package com.aerosuite.mapping;

import com.aerosuite.domain.AssociacaoFcu;
import com.aerosuite.dto.AssociacaoFcuDto;
import jakarta.enterprise.context.ApplicationScoped;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@ApplicationScoped
@Mapper(componentModel = "jakarta", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface AssociacaoFcuMapper {
    
    @Mapping(target = "fcuCodigo", source = "fcu.fcuCodigo")
    @Mapping(target = "fcuDescription", source = "fcu.fcuDescription")
    @Mapping(target = "fcuModelo", source = "fcu.modelo")
    @Mapping(target = "fcuPn", source = "fcu.pn")
    @Mapping(target = "fcuSerialNumber", source = "fcu.serialNumber")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productDescription", source = "product.description")
    @Mapping(target = "productPn", source = "product.productpn")
    @Mapping(target = "productPrice", source = "product.price")
    @Mapping(target = "productQuantity", source = "product.quantity")
    @Mapping(target = "productStatus", source = "product.status")
    @Mapping(target = "productLocal", source = "product.local")
    @Mapping(target = "productIsActive", source = "product.isActive")
    @Mapping(target = "isActive", source = "isActive")
    AssociacaoFcuDto toDto(AssociacaoFcu entity);
    
    AssociacaoFcu toEntity(AssociacaoFcuDto dto);
}
