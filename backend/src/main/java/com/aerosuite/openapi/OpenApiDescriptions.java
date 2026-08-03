package com.aerosuite.openapi;

/** OpenAPI / Swagger descriptions (English — developer-facing API docs). All @Parameter/@Operation/@APIResponse/@Tag descriptions must reference constants from this class (see scripts/i18n-openapi-centralized.mjs). */
public final class OpenApiDescriptions {

    private OpenApiDescriptions() {}

    // --- Common parameter descriptions ---
    public static final String WORK_ORDER_ID = "Work order ID";
    public static final String WORK_ORDER_ID_SHORT = "Work order ID (OS)";
    public static final String FILE_ID = "File ID";
    public static final String FCU_ID = "FCU ID";
    public static final String SERVICE_TYPE_ID = "Service type ID";
    public static final String PAGE_NUMBER = "Page number (0-based)";
    public static final String PAGE_SIZE = "Page size";
    public static final String SORT = "Sort field and direction (e.g. 'fileName,asc')";
    public static final String SEARCH_TERM = "Search term";
    public static final String FILTER_ACTIVE = "Filter by active records";

    // --- TpFiles tag ---
    public static final String TP_FILES_TAG = "Service type file operations";

    // --- TpFiles operations ---
    public static final String TP_FILES_LIST_SUMMARY = "List files";
    public static final String TP_FILES_LIST_DESC =
            "Returns a paginated list of files with search and sort options";
    public static final String TP_FILES_LIST_200 = "File list returned successfully";

    public static final String TP_FILES_FIND_SUMMARY = "Get file by ID";
    public static final String TP_FILES_FIND_DESC = "Returns a single file by its ID";
    public static final String TP_FILES_FOUND = "File found";
    public static final String TP_FILES_NOT_FOUND = "File not found";

    public static final String TP_FILES_CREATE_SUMMARY = "Create file";
    public static final String TP_FILES_CREATE_DESC = "Creates a new file record";
    public static final String TP_FILES_CREATED = "File created successfully";
    public static final String TP_FILES_INVALID_DATA = "Invalid data";

    public static final String TP_FILES_UPDATE_SUMMARY = "Update file";
    public static final String TP_FILES_UPDATE_DESC = "Updates an existing file";
    public static final String TP_FILES_UPDATED = "File updated successfully";

    public static final String TP_FILES_DELETE_SUMMARY = "Delete file";
    public static final String TP_FILES_DELETE_DESC = "Soft-deletes a file (marks inactive)";
    public static final String TP_FILES_INACTIVATED = "File marked inactive successfully";

    public static final String TP_FILES_BY_TIPO_SUMMARY = "List files by service type";
    public static final String TP_FILES_BY_TIPO_DESC =
            "Returns all files linked to a specific service type";
    public static final String TP_FILES_BY_TIPO_200 = "Service type file list";

    public static final String TP_FILES_DEACTIVATE_SUMMARY = "Deactivate file";
    public static final String TP_FILES_DEACTIVATE_DESC = "Deactivates a file without physical removal";
    public static final String TP_FILES_DEACTIVATED = "File deactivated successfully";
}
