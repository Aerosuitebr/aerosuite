-- P5.1 Aero Studio: ficheiros em disco, pré-visualização PNG e erros de job.

ALTER TABLE studio_render_job
    ADD COLUMN file_path VARCHAR(512) NULL AFTER file_name;

ALTER TABLE studio_render_job
    ADD COLUMN preview_path VARCHAR(512) NULL AFTER file_path;

ALTER TABLE studio_render_job
    ADD COLUMN media_type VARCHAR(64) NULL AFTER preview_path;

ALTER TABLE studio_render_job
    ADD COLUMN error_message VARCHAR(512) NULL AFTER media_type;
