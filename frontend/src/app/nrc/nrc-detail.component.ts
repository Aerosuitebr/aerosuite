import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Nrc, NrcAcao, NrcAnexo, NrcService } from '../core/nrc.service';
import { TranslatePipe } from '../core/translate.pipe';
import { TranslationService } from '../core/translation.service';
import { UsuarioService } from '../core/usuarios.service';
import { hasNrc, isNrcQuality, nrcErrorText } from './nrc-access';
import {
  NRC_JORNADA_STEPS,
  NrcJornadaStep,
  daysUntilPrazo,
  emptyAcao,
  isStepAccessible,
  resolveEtapa
} from './nrc-journey.util';

@Component({
  selector: 'app-nrc-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe],
  templateUrl: './nrc-detail.component.html',
  styleUrl: './nrc.scss'
})
export class NrcDetailComponent implements OnInit {
  private api = inject(NrcService);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private usersApi = inject(UsuarioService);
  private i18n = inject(TranslationService);

  readonly steps = NRC_JORNADA_STEPS;
  record?: Nrc;
  actions: NrcAcao[] = [];
  users: { id: number; nome: string }[] = [];
  step: NrcJornadaStep = 'REGISTRO';
  delegateId?: number;
  note = '';
  evidence = '';
  file?: File;
  category = 'EVIDENCIA';
  busy = false;
  error = '';
  ok = '';

  ngOnInit(): void {
    this.usersApi.list({ size: 200 }, { suppressForbiddenToast: true }).subscribe({
      next: (page) => {
        this.users = (page.items || [])
          .filter((user) => user.id)
          .map((user) => ({ id: Number(user.id), nome: String(user['nome'] || user['email'] || user.id) }));
      }
    });
    this.route.paramMap.subscribe((params) => this.load(Number(params.get('id'))));
  }

  get user() { return this.auth.getCurrentUser(); }
  get quality(): boolean { return isNrcQuality(this.user); }
  get canTreat(): boolean { return this.quality || hasNrc(this.user, 'NRC_ANALISAR'); }
  get closed(): boolean { return this.record?.status === 'ENCERRADA'; }
  get days(): number | null { return daysUntilPrazo(this.record?.prazoTratamento); }

  load(id: number): void {
    if (!id) return;
    this.busy = true;
    this.api.getById(id).subscribe({
      next: (record) => {
        this.record = record;
        this.actions = (record.acoes || []).map((item) => ({ ...item }));
        this.step = resolveEtapa(record);
        this.busy = false;
      },
      error: (err) => this.fail(err)
    });
  }

  select(step: NrcJornadaStep): void {
    if (this.record && isStepAccessible(this.record, step)) {
      this.step = step;
    }
  }

  accessible(step: NrcJornadaStep): boolean {
    return !!this.record && isStepAccessible(this.record, step);
  }

  label(group: string, value?: string | null): string {
    if (!value) return '—';
    const key = `nrc.${group}.${value}`;
    const text = this.i18n.translate(key);
    return text === key ? value : text;
  }

  saveOpening(): void {
    if (!this.record?.id) return;
    this.run(this.api.update(this.record.id, this.record));
  }

  assume(): void { this.run(this.api.assumirTratamento(this.id())); }
  delegate(): void {
    if (!this.delegateId) return;
    this.run(this.api.delegarTratamento(this.id(), { responsavelTratamentoId: this.delegateId }));
  }

  containmentBody() {
    const n = this.record!;
    return {
      contencaoOque: n.contencaoOque || '',
      contencaoQuem: n.contencaoQuem || '',
      contencaoQuando: n.contencaoQuando || '',
      contencaoAcao: n.contencaoAcao,
      contencaoNaoAplicavel: n.contencaoNaoAplicavel
    };
  }

  saveContainment(): void { this.run(this.api.contencao(this.id(), this.containmentBody())); }
  askContainment(): void { this.run(this.api.solicitarAprovacaoContencao(this.id(), this.containmentBody())); }
  approveContainment(): void { this.run(this.api.aprovarContencao(this.id())); }
  rejectContainment(): void { this.run(this.api.rejeitarContencao(this.id(), { observacoes: this.note })); }

  analysisBody() {
    const n = this.record!;
    return {
      causaRaiz: n.causaRaiz,
      metodoCausa: n.metodoCausa,
      disposicao: n.disposicao,
      disposicaoObservacao: n.disposicaoObservacao,
      porque1: n.porque1, porque2: n.porque2, porque3: n.porque3, porque4: n.porque4, porque5: n.porque5,
      porquesExtra: n.porquesExtra, ishikawaMaterial: n.ishikawaMaterial
    };
  }

  saveCause(): void { this.run(this.api.analise(this.id(), this.analysisBody())); }
  askCause(): void { this.run(this.api.solicitarAprovacaoAnaliseCausa(this.id(), this.analysisBody())); }
  approveCause(): void { this.run(this.api.aprovarAnaliseCausa(this.id())); }
  rejectCause(): void { this.run(this.api.rejeitarAnaliseCausa(this.id(), { observacoes: this.note })); }

  addAction(): void { this.actions = [...this.actions, emptyAcao()]; }
  removeAction(index: number): void { this.actions = this.actions.filter((_, i) => i !== index); }
  saveActions(): void { this.run(this.api.acoes(this.id(), { acoes: this.payloadAcoes(), prazoTratamento: this.record?.prazoTratamento })); }
  askActions(): void { this.run(this.api.solicitarAprovacaoPlanoAcoes(this.id(), { acoes: this.payloadAcoes(), prazoTratamento: this.record?.prazoTratamento })); }
  approveActions(): void { this.run(this.api.aprovarPlanoAcoes(this.id())); }
  rejectActions(): void { this.run(this.api.rejeitarPlanoAcoes(this.id(), { observacoes: this.note })); }
  finishAction(action: NrcAcao): void {
    if (!action.id) return;
    this.run(this.api.concluirAcao(this.id(), action.id, { evidenciaConclusao: this.evidence || action.evidenciaConclusao || '' }));
  }

  saveEfficacy(): void { this.run(this.api.salvarVerificacaoEficacia(this.id(), this.efficacyBody())); }
  closeRecord(): void { this.run(this.api.encerrar(this.id(), this.efficacyBody())); }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
  }

  upload(): void {
    if (!this.file || !this.record?.id) return;
    this.busy = true;
    this.api.uploadAnexo(this.record.id, this.file, undefined, undefined, undefined, this.category).subscribe({
      next: () => { this.file = undefined; this.ok = this.i18n.translate('nrc.saved'); this.reload(); },
      error: (err) => this.fail(err)
    });
  }

  removeFile(file: NrcAnexo): void {
    if (!this.record?.id || !file.id) return;
    this.busy = true;
    this.api.deleteAnexo(this.record.id, file.id).subscribe({
      next: () => this.reload(),
      error: (err) => this.fail(err)
    });
  }

  download(file: NrcAnexo): void {
    if (!this.record?.id || !file.nomeArquivo) return;
    this.api.fetchAnexoBlob(this.record.id, file.nomeArquivo).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.nomeOriginal || file.nomeArquivo || 'anexo';
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  print(): void {
    if (!this.record?.id) return;
    this.api.fetchRelatorio(this.record.id).subscribe((blob) => {
      const url = URL.createObjectURL(new Blob([blob], { type: 'text/html' }));
      window.open(url, '_blank', 'noopener');
    });
  }

  private efficacyBody() {
    const n = this.record!;
    return {
      verificacaoEficacia: n.verificacaoEficacia || '',
      eficaciaDecisao: n.eficaciaDecisao || '',
      eficaciaAtualizarRiscos: n.eficaciaAtualizarRiscos,
      eficaciaMudancasSgq: n.eficaciaMudancasSgq
    };
  }

  private id(): number { return this.record!.id!; }

  /** O endpoint de plano rejeita status CONCLUIDA; o servidor preserva as já concluídas pelo id. */
  private payloadAcoes(): NrcAcao[] {
    return this.actions.map((action) => action.status === 'CONCLUIDA' ? { ...action, status: 'PENDENTE' } : action);
  }

  private run(request: Observable<Nrc | void>): void {
    this.busy = true;
    this.error = '';
    this.ok = '';
    request.subscribe({
      next: (record: Nrc | void) => {
        if (record?.id) {
          this.record = record;
          this.actions = (record.acoes || []).map((item) => ({ ...item }));
        }
        this.note = '';
        this.ok = this.i18n.translate('nrc.saved');
        this.busy = false;
      },
      error: (err: unknown) => this.fail(err)
    });
  }

  private reload(): void {
    if (this.record?.id) this.load(this.record.id);
  }

  private fail(err: unknown): void {
    this.busy = false;
    this.ok = '';
    this.error = nrcErrorText(err, (key) => this.i18n.translate(key));
  }
}
