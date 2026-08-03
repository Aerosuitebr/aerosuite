import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  sslEnabled?: boolean;
}

export interface BackupSchedule {
  id?: number;
  scheduleType: 'once' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  scheduledDate?: string; // Para agendamento único (YYYY-MM-DD)
  scheduledTime: string; // HH:mm
  daysOfWeek?: number[]; // Para agendamento semanal [0-6, onde 0=domingo]
  dayOfMonth?: number; // Para agendamento mensal [1-31]
  lastRun?: string;
  nextRun?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface BackupConfig {
  id?: number;
  connection: DatabaseConnection;
  backupPath: string;
  schedule: BackupSchedule;
  retentionDays?: number;
  compressBackup?: boolean;
  emailNotification?: boolean;
  emailRecipients?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BackupHistory {
  id: number;
  backupDate: string;
  backupPath: string;
  fileSize: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  duration?: number; // em segundos
}

@Injectable({ providedIn: 'root' })
export class BackupConfigService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/backup-config`;

  // Obter configuração atual
  getConfig(): Observable<BackupConfig> {
    return this.http.get<BackupConfig>(`${this.baseUrl}`);
  }

  // Salvar/Atualizar configuração
  saveConfig(config: BackupConfig): Observable<BackupConfig> {
    if (config.id) {
      return this.http.put<BackupConfig>(`${this.baseUrl}/${config.id}`, config);
    }
    return this.http.post<BackupConfig>(this.baseUrl, config);
  }

  // Testar conexão com banco de dados
  testConnection(connection: DatabaseConnection): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/test-connection`, connection);
  }

  // Executar backup manualmente
  executeBackup(): Observable<{ success: boolean; message: string; backupId?: number }> {
    return this.http.post<{ success: boolean; message: string; backupId?: number }>(`${this.baseUrl}/execute`, {});
  }

  // Obter histórico de backups
  getBackupHistory(limit: number = 50): Observable<BackupHistory[]> {
    return this.http.get<BackupHistory[]>(`${this.baseUrl}/history?limit=${limit}`);
  }

  // Deletar backup do histórico
  deleteBackup(backupId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/history/${backupId}`);
  }

  // Abrir pasta do backup
  openFolder(folderPath: string): Observable<{
    success: boolean;
    message: string;
    openOnHost?: boolean;
    hostPath?: string;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      openOnHost?: boolean;
      hostPath?: string;
    }>(`${this.baseUrl}/open-folder`, { path: folderPath });
  }

  // Verificar status do backup em execução
  getBackupStatus(backupId: string): Observable<{ status: string; message: string; backupId: string; errorMessage?: string }> {
    return this.http.get<{ status: string; message: string; backupId: string; errorMessage?: string }>(`${this.baseUrl}/status/${backupId}`);
  }

  // Validar caminho de backup
  validatePath(path: string): Observable<{ valid: boolean; message: string }> {
    return this.http.post<{ valid: boolean; message: string }>(`${this.baseUrl}/validate-path`, { path });
  }

  // Listar diretórios
  listDirectories(path?: string): Observable<{ path: string; directories: DirectoryItem[] }> {
    let params: { [key: string]: string } | undefined;
    if (path) {
      params = { path };
    }
    return this.http.get<{ path: string; directories: DirectoryItem[] }>(`${this.baseUrl}/list-directories`, params ? { params } : {});
  }
}

export interface DirectoryItem {
  name: string;
  path: string;
  isDirectory: boolean;
  canRead: boolean;
  canWrite: boolean;
}

