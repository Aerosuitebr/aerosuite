import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Nrc, NrcService, NRC_SEVERIDADES, NRC_TIPOS } from '../core/nrc.service';
import { OSService } from '../core/os.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { UsuarioService } from '../core/usuarios.service';
import { nrcErrorText } from './nrc-access';
import { suggestedPrazoDate } from './nrc-journey.util';

@Component({
  selector: 'app-nrc-form',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './nrc-form.component.html',
  styleUrl: './nrc.scss'
})
export class NrcFormComponent implements OnInit {
  private nrcApi = inject(NrcService);
  private osApi = inject(OSService);
  private usersApi = inject(UsuarioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private i18n = inject(TranslationService);

  readonly types = NRC_TIPOS;
  readonly severities = NRC_SEVERIDADES;
  readonly origins = ['OFICINA', 'ESTOQUE', 'INSPECAO', 'CLIENTE', 'AUDITORIA_INTERNA'];
  users: { id: number; nome: string }[] = [];
  saving = false;
  error = '';
  model: Nrc = {
    origem: 'OFICINA',
    tipoNc: 'PRODUTO',
    severidade: 'MENOR',
    prazoTratamento: this.isoDate(suggestedPrazoDate('MENOR'))
  };

  ngOnInit(): void {
    const current = this.auth.getCurrentUser();
    if (current?.id) {
      this.model.responsavelTratamentoId = current.id;
    }
    this.usersApi.list({ size: 200 }, { suppressForbiddenToast: true }).subscribe({
      next: (page) => {
        this.users = (page.items || [])
          .filter((user) => user.id)
          .map((user) => ({ id: Number(user.id), nome: String(user['nome'] || user['email'] || user.id) }));
      },
      error: () => {
        if (current?.id) {
          this.users = [{ id: current.id, nome: current.nome }];
        }
      }
    });
    const osId = Number(this.route.snapshot.queryParamMap.get('osId'));
    if (osId) {
      this.osApi.getById(osId).subscribe((os) => {
        this.model.osId = os.id;
        this.model.osNumero = os.idOs ? String(os.idOs) : undefined;
        this.model.clienteNome = os.clienteNome;
        this.model.partNumber = os.partNumber || os.fcuPn;
        this.model.serialNumber = os.serialNumber || os.fcuSerialNumber;
        this.model.fcuId = os.fcuId || os.idFcuId;
        this.model.fcuCodigo = os.fcuCodigo;
      });
    }
  }

  onSeverity(): void {
    this.model.prazoTratamento = this.isoDate(suggestedPrazoDate(this.model.severidade));
  }

  save(): void {
    this.saving = true;
    this.error = '';
    const payload: Nrc = { ...this.model };
    if (!payload.dataOcorrencia) delete payload.dataOcorrencia;
    this.nrcApi.create(payload).subscribe({
      next: (created) => this.router.navigate(['/nrc', created.id]),
      error: (err) => {
        this.saving = false;
        this.error = nrcErrorText(err, (key) => this.i18n.translate(key));
      }
    });
  }

  label(group: string, value: string): string {
    const key = `nrc.${group}.${value}`;
    const text = this.i18n.translate(key);
    return text === key ? value : text;
  }

  private isoDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
