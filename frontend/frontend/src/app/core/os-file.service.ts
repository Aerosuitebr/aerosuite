import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, filter } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from './translation.service';
import { extractApiErrorMessage } from './backend-i18n-message.util';

export interface OSFile {
  id?: number;
  osId?: number;
  fileName: string;
  originalName: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
  fileExtension?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  file?: OSFile;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class OSFileService {
  private readonly i18n = inject(TranslationService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = `${environment.apiUrl}/os-files`;

  /** Token + identidade do usuário para auditoria de upload/exclusão (multipart não herda só do interceptor). */
  private headersUsuarioAcao(): HttpHeaders {
    const u = this.auth.getCurrentUser();
    let headers = new HttpHeaders();
    if (u) {
      headers = headers
        .set('X-User-Id', String(u.id))
        .set('X-User-Name', u.nome || u.email || 'Usuario');
      if (u.email) {
        headers = headers.set('X-User-Email', u.email);
      }
    }
    const token = this.auth.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Lista todos os arquivos disponíveis na pasta os/files
   */
  listAvailableFiles() {
    return this.http.get<OSFile[]>(`${this.base}/available`).pipe(
      map((response: any) => {
        // Se a resposta vier em formato {value: [], Count: N}, extrair o array value
        if (response && response.value && Array.isArray(response.value)) {
          return response.value;
        }
        // Se já vier como array direto, retornar como está
        if (Array.isArray(response)) {
          return response;
        }
        // Caso contrário, retornar array vazio
        return [];
      })
    );
  }

  /**
   * Lista todos os arquivos associados a uma OS
   */
  getFilesByOSId(osId: number) {
    return this.http.get<OSFile[]>(`${this.base}/os/${osId}`);
  }

  /**
   * Associa arquivos a uma OS
   */
  associateFilesToOS(osId: number, fileNames: string[]) {
    return this.http.post<{ message: string; files: OSFile[]; count: number }>(
      `${this.base}/os/${osId}/associate`,
      fileNames,
      { headers: this.headersUsuarioAcao() }
    );
  }

  /**
   * Remove um arquivo da OS
   */
  removeFile(fileId: number) {
    return this.http.delete<{ message: string }>(`${this.base}/${fileId}`, {
      headers: this.headersUsuarioAcao()
    });
  }

  /**
   * Obtém informações de um arquivo específico
   */
  getFileById(fileId: number) {
    return this.http.get<OSFile>(`${this.base}/${fileId}`);
  }

  /**
   * Download de um arquivo
   */
  downloadFile(fileId: number) {
    return this.http.get(`${this.base}/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  /**
   * Upload de arquivos para uma OS com rastreamento de progresso
   * Aceita qualquer tipo de arquivo sem limitação de tamanho
   * Faz upload de cada arquivo individualmente em paralelo para melhor performance
   */
  uploadFiles(osId: number, files: File[]): Observable<UploadProgress[]> {
    const progressSubject = new Subject<UploadProgress[]>();
    const progressMap = new Map<string, UploadProgress>();
    let completedCount = 0;
    let errorCount = 0;
    
    // Inicializar progresso para cada arquivo
    files.forEach(file => {
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });
    });
    
    // Emitir estado inicial
    progressSubject.next(Array.from(progressMap.values()));
    
    // Fazer upload de cada arquivo individualmente em paralelo
    files.forEach(file => {
      const formData = new FormData();
      formData.append('files', file, file.name);
      
      // Criar request com reportProgress
      const req = new HttpRequest('POST', `${this.base}/os/${osId}/upload`, formData, {
        reportProgress: true,
        headers: this.headersUsuarioAcao()
      });
      
      this.http.request(req).subscribe({
        next: (event: HttpEvent<any>) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // Atualizar progresso deste arquivo específico
            const percentDone = Math.round(100 * event.loaded / event.total);
            const progress = progressMap.get(file.name);
            if (progress) {
              progress.progress = percentDone;
            }
            progressSubject.next(Array.from(progressMap.values()));
          } else if (event.type === HttpEventType.Response) {
            // Upload deste arquivo completo
            const response = event.body;
            const uploadedFiles: OSFile[] = response?.files || [];
            
            const progress = progressMap.get(file.name);
            if (progress) {
              progress.progress = 100;
              progress.status = 'completed';
              progress.file = uploadedFiles[0];
            }
            
            completedCount++;
            progressSubject.next(Array.from(progressMap.values()));
            
            // Verificar se todos os arquivos foram processados
            if (completedCount + errorCount === files.length) {
              progressSubject.complete();
            }
          }
        },
        error: (error) => {
          console.error('File upload error:', file.name, error);
          const progress = progressMap.get(file.name);
          if (progress) {
            progress.status = 'error';
            progress.error = extractApiErrorMessage(error, this.i18n, 'os.list.toast.uploadError');
          }
          
          errorCount++;
          progressSubject.next(Array.from(progressMap.values()));
          
          // Verificar se todos os arquivos foram processados
          if (completedCount + errorCount === files.length) {
            if (completedCount > 0) {
              progressSubject.complete();
            } else {
              progressSubject.error(error);
            }
          }
        }
      });
    });
    
    return progressSubject.asObservable();
  }

  /**
   * Upload de um único arquivo para uma OS com rastreamento de progresso
   */
  uploadFile(osId: number, file: File): Observable<UploadProgress> {
    return this.uploadFiles(osId, [file]).pipe(
      map(progresses => progresses[0])
    );
  }
}

