package com.aerosuite.service;

import com.aerosuite.dto.BackupConfigDto;
import com.aerosuite.dto.BackupScheduleDto;
import com.aerosuite.dto.DatabaseConnectionDto;
import io.agroal.api.AgroalDataSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Acesso JDBC a {@code backup_config} / {@code backup_history} (tabelas globais, sem tenant_id).
 * Evita falha de tenant Hibernate em threads de fundo (agendador, CompletableFuture).
 */
@ApplicationScoped
public class BackupJdbcRepository {

    @Inject
    AgroalDataSource dataSource;

    public Optional<BackupConfigDto> findActiveConfig() throws SQLException {
        String sql = """
            SELECT id, db_host, db_port, db_database, db_username, db_password, db_ssl_enabled,
                   backup_path, schedule_enabled, schedule_type, scheduled_date, scheduled_time,
                   days_of_week, day_of_month, retention_days, compress_backup,
                   email_notification, email_recipients, created_at, updated_at
            FROM backup_config WHERE is_active = TRUE LIMIT 1
            """;
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (!rs.next()) {
                return Optional.empty();
            }
            DatabaseConnectionDto conn = new DatabaseConnectionDto(
                    rs.getString("db_host"),
                    rs.getInt("db_port"),
                    rs.getString("db_database"),
                    rs.getString("db_username"),
                    rs.getString("db_password"),
                    rs.getBoolean("db_ssl_enabled"));
            Date schedDate = rs.getDate("scheduled_date");
            BackupScheduleDto schedule = new BackupScheduleDto(
                    null,
                    rs.getString("schedule_type"),
                    rs.getBoolean("schedule_enabled"),
                    schedDate != null ? schedDate.toLocalDate().toString() : null,
                    rs.getString("scheduled_time"),
                    null,
                    rs.getObject("day_of_month") != null ? rs.getInt("day_of_month") : null,
                    null, null, null, null, null);
            BackupConfigDto dto = new BackupConfigDto(
                    rs.getLong("id"),
                    conn,
                    rs.getString("backup_path"),
                    schedule,
                    rs.getInt("retention_days"),
                    rs.getBoolean("compress_backup"),
                    rs.getBoolean("email_notification"),
                    null,
                    rs.getTimestamp("created_at") != null
                            ? rs.getTimestamp("created_at").toLocalDateTime() : null,
                    rs.getTimestamp("updated_at") != null
                            ? rs.getTimestamp("updated_at").toLocalDateTime() : null);
            return Optional.of(dto);
        }
    }

    public long insertRunningHistory(String backupPath, String databaseName) throws SQLException {
        String sql = """
            INSERT INTO backup_history (backup_date, backup_path, file_size, status, database_name, created_at, updated_at)
            VALUES (?, ?, 0, 'running', ?, NOW(), NOW())
            """;
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now()));
            ps.setString(2, backupPath);
            ps.setString(3, databaseName);
            ps.executeUpdate();
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return keys.getLong(1);
                }
            }
            throw new SQLException("backup_history insert sem generated key");
        }
    }

    public void markSuccess(long id, String filePath, long fileSize, int durationSec) throws SQLException {
        String sql = """
            UPDATE backup_history
            SET backup_path = ?, file_size = ?, status = 'success', duration_seconds = ?,
                error_message = NULL, updated_at = NOW()
            WHERE id = ?
            """;
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, filePath);
            ps.setLong(2, fileSize);
            ps.setInt(3, durationSec);
            ps.setLong(4, id);
            ps.executeUpdate();
        }
    }

    public void markFailed(long id, String errorMessage, int durationSec) throws SQLException {
        String sql = """
            UPDATE backup_history
            SET status = 'failed', error_message = ?, duration_seconds = ?, updated_at = NOW()
            WHERE id = ?
            """;
        String msg = errorMessage != null && errorMessage.length() > 500
                ? errorMessage.substring(0, 500) : errorMessage;
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setString(1, msg);
            ps.setInt(2, durationSec);
            ps.setLong(3, id);
            ps.executeUpdate();
        }
    }

    public Optional<BackupHistoryRow> findHistoryById(long id) throws SQLException {
        String sql = """
            SELECT id, backup_date, backup_path, file_size, status, error_message, duration_seconds
            FROM backup_history WHERE id = ?
            """;
        try (Connection c = dataSource.getConnection();
             PreparedStatement ps = c.prepareStatement(sql)) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return Optional.empty();
                }
                return Optional.of(new BackupHistoryRow(
                        rs.getLong("id"),
                        rs.getTimestamp("backup_date").toLocalDateTime(),
                        rs.getString("backup_path"),
                        rs.getLong("file_size"),
                        rs.getString("status"),
                        rs.getString("error_message"),
                        rs.getObject("duration_seconds") != null ? rs.getInt("duration_seconds") : null));
            }
        }
    }

    record BackupHistoryRow(
            long id,
            LocalDateTime backupDate,
            String backupPath,
            long fileSize,
            String status,
            String errorMessage,
            Integer durationSeconds) {}
}
