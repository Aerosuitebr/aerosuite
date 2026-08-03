package com.aerosuite.dto;

import java.util.List;

public class PageResponse<T> {
    public java.util.List<T> items;
    public long totalElements;
    public int totalPages;
    public int page;
    public int size;
    public String sort;

    public PageResponse() {}

    public PageResponse(List<T> items, long totalElements, int totalPages, int page, int size, String sort) {
        this.items = items;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.page = page;
        this.size = size;
        this.sort = sort;
    }
}
