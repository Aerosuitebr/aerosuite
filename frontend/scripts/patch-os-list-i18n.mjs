import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/app/os/os-list.component.ts');
let s = fs.readFileSync(file, 'utf8');

const pairs = [
  ['pTooltip="Buscar"', '[pTooltip]="\'os.list.tooltip.search\' | translate"'],
  ['pTooltip="Limpar filtros"', '[pTooltip]="\'os.list.tooltip.clear\' | translate"'],
  ['pTooltip="OS aberta com déficit no kit FCU. Clique para ver os detalhes."', '[pTooltip]="\'os.list.tooltip.kitDeficit\' | translate"'],
  ['pTooltip="Somente leitura"', '[pTooltip]="\'os.list.tooltip.readOnly\' | translate"'],
  ['pTooltip="Imprimir OS"', '[pTooltip]="\'os.list.tooltip.print\' | translate"'],
  ['pTooltip="Editar"', '[pTooltip]="\'os.list.tooltip.edit\' | translate"'],
  ['pTooltip="Excluir"', '[pTooltip]="\'os.list.tooltip.delete\' | translate"'],
  ['<p>Nenhuma OS encontrada</p>', '<p>{{ \'os.list.empty\' | translate }}</p>'],
  ["[header]=\"isReadOnly ? 'Visualizar OS' : (isEditing ? 'Editar OS' : 'Nova OS')\"", '[header]="osModalHeader"'],
  ['Número da OS\n              </label>', "{{ 'os.form.number' | translate }}\n              </label>"],
  ['[placeholder]="(currentOS && currentOS.id != null) ? formatOSId(currentOS) : \'Será gerado ao salvar\'"', '[placeholder]="osNumberPlaceholder"'],
  ['Produto Aeronáutico *\n              </label>', "{{ 'os.form.fcu.label' | translate }} *\n              </label>"],
  ['placeholder="Selecione o Produto Aeronáutico"', '[placeholder]="\'os.form.fcu.placeholder\' | translate"'],
  ["selectedOption.pn || selectedOption.fcuCodigo || 'Sem PN'", "selectedOption.pn || selectedOption.fcuCodigo || ('os.form.fcu.noPn' | translate)"],
  ["option.pn || option.fcuCodigo || 'Sem PN'", "option.pn || option.fcuCodigo || ('os.form.fcu.noPn' | translate)"],
  ['Produto Aeronáutico é obrigatório', "{{ 'os.form.fcu.required' | translate }}"],
  ['<p-accordionTab header="Descrição do Artigo">', '<p-accordionTab [header]="\'os.form.accordion.article\' | translate">'],
  ['<p-accordionTab header="Serviço">', '<p-accordionTab [header]="\'os.form.accordion.service\' | translate">'],
  ['<p-accordionTab header="Arquivos">', '<p-accordionTab [header]="\'os.form.accordion.files\' | translate">'],
  ['<p-accordionTab header="Referência do Serviço">', '<p-accordionTab [header]="\'os.form.accordion.serviceRef\' | translate">'],
  ['<p-accordionTab header="Solicitação de Troca Eventual">', '<p-accordionTab [header]="\'os.form.accordion.exchange\' | translate">'],
  ['Cliente\n                  </label>', "{{ 'os.form.field.client' | translate }}\n                  </label>"],
  ['Fabricante\n                  </label>', "{{ 'os.form.field.manufacturer' | translate }}\n                  </label>"],
  ['PN\n                  </label>', "{{ 'os.form.field.pn' | translate }}\n                  </label>"],
  ['Modelo\n                  </label>', "{{ 'os.form.field.model' | translate }}\n                  </label>"],
  ['Nome\n                  </label>', "{{ 'os.form.field.name' | translate }}\n                  </label>"],
  ['S/N\n                  </label>', "{{ 'os.form.field.serialNumber' | translate }}\n                  </label>"],
  ['TSN\n                  </label>', "{{ 'os.form.field.tsn' | translate }}\n                  </label>"],
  ['TSO\n                  </label>', "{{ 'os.form.field.tso' | translate }}\n                  </label>"],
  ['Marcas de Matrícula\n                  </label>', "{{ 'os.form.field.regMarks' | translate }}\n                  </label>"],
  ['Motor\n                  </label>', "{{ 'os.form.field.engine' | translate }}\n                  </label>"],
  ['S/N Motor\n                  </label>', "{{ 'os.form.field.engineSn' | translate }}\n                  </label>"],
  ['placeholder="Nome do cliente"', '[placeholder]="\'os.form.ph.client\' | translate"'],
  ['placeholder="Selecione o fabricante"', '[placeholder]="\'os.form.ph.manufacturer\' | translate"'],
  ['filterPlaceholder="Buscar fabricante"', '[filterPlaceholder]="\'os.form.ph.manufacturerFilter\' | translate"'],
  ['placeholder="Part Number"', '[placeholder]="\'os.form.ph.partNumber\' | translate"'],
  ['placeholder="Modelo"', '[placeholder]="\'os.form.ph.model\' | translate"'],
  ['placeholder="Nome"', '[placeholder]="\'os.form.ph.name\' | translate"'],
  ['placeholder="Serial Number"', '[placeholder]="\'os.form.ph.serialNumber\' | translate"'],
  ['placeholder="Time Since New"', '[placeholder]="\'os.form.field.tsn\' | translate"'],
  ['placeholder="Time Since Overhaul"', '[placeholder]="\'os.form.field.tso\' | translate"'],
  ['placeholder="Marcas de Matrícula"', '[placeholder]="\'os.form.ph.regMarks\' | translate"'],
  ['placeholder="Motor"', '[placeholder]="\'os.form.ph.engine\' | translate"'],
  ['placeholder="Serial Number do Motor"', '[placeholder]="\'os.form.field.engineSn\' | translate"'],
  ['Serviço\n                  </label>', "{{ 'os.form.field.serviceType' | translate }}\n                  </label>"],
  ['placeholder="Selecione o tipo de serviço"', '[placeholder]="\'os.form.ph.serviceType\' | translate"'],
  ['Num. OS Original\n                  </label>', "{{ 'os.form.field.originalOsShort' | translate }}\n                  </label>"],
  ['placeholder="Número da OS original"', '[placeholder]="\'os.form.ph.originalOs\' | translate"'],
  ['Data Abertura\n                  </label>', "{{ 'os.form.field.openDateShort' | translate }}\n                  </label>"],
  ['Data Conclusão Serviço\n                  </label>', "{{ 'os.form.field.conclusionShort' | translate }}\n                  </label>"],
  ['Início Serviço\n                  </label>', "{{ 'os.form.field.serviceStartShort' | translate }}\n                  </label>"],
  ['placeholder="Observações do início do serviço"', '[placeholder]="\'os.form.ph.serviceStartNotes\' | translate"'],
  ['Fim Serviço\n                  </label>', "{{ 'os.form.field.serviceEndShort' | translate }}\n                  </label>"],
  ['placeholder="Observações do fim do serviço"', '[placeholder]="\'os.form.ph.serviceEndNotes\' | translate"'],
  ['Data Fechamento\n                  </label>', "{{ 'os.form.field.closeDateShort' | translate }}\n                  </label>"],
  ['Upload de Arquivos\n                  </label>', "{{ 'os.form.files.upload' | translate }}\n                  </label>"],
  ['<p class="upload-text">Arraste arquivos aqui ou clique para selecionar</p>', '<p class="upload-text">{{ \'os.form.files.drop\' | translate }}</p>'],
  ['<span class="upload-hint">Qualquer tipo de arquivo é aceito</span>', '<span class="upload-hint">{{ \'os.form.files.hint\' | translate }}</span>'],
  ['<span>Enviando arquivos...</span>', '<span>{{ \'os.form.files.uploading\' | translate }}</span>'],
  ['Arquivos Associados\n                    <span', "{{ 'os.form.files.associated' | translate }}\n                    <span"],
  ['pTooltip="Visualizar arquivo"', '[pTooltip]="\'os.form.files.view\' | translate"'],
  ['pTooltip="Baixar arquivo"', '[pTooltip]="\'os.form.files.download\' | translate"'],
  ['pTooltip="Remover arquivo"', '[pTooltip]="\'os.form.files.remove\' | translate"'],
  ['<p>Nenhum arquivo associado a esta OS</p>', '<p>{{ \'os.form.files.empty\' | translate }}</p>'],
  ['placeholder="Manual Part Number"', '[placeholder]="\'os.form.ph.manualPn\' | translate"'],
  ['Revisão Núm.\n                  </label>', "{{ 'os.form.field.revNumberShort' | translate }}\n                  </label>"],
  ['placeholder="Número da revisão"', '[placeholder]="\'os.form.ph.revNumber\' | translate"'],
  ['Data Revisão\n                  </label>', "{{ 'os.form.field.revDateShort' | translate }}\n                  </label>"],
  ['ATA Manual\n                  </label>', "{{ 'os.form.field.ata' | translate }}\n                  </label>"],
  ['placeholder="ATA Manual (ex: 73-20-64)"', '[placeholder]="\'os.form.ph.ata\' | translate"'],
  ['Título ADS\n                  </label>', "{{ 'os.form.field.adsTitle' | translate }}\n                  </label>"],
  ['placeholder="Título ADS"', '[placeholder]="\'os.form.ph.ads\' | translate"'],
  ['Título Afins\n                  </label>', "{{ 'os.form.field.relatedTitle' | translate }}\n                  </label>"],
  ['placeholder="Título Afins"', '[placeholder]="\'os.form.ph.related\' | translate"'],
  ['Boletins Serviço Afins\n                  </label>', "{{ 'os.form.field.serviceBulletins' | translate }}\n                  </label>"],
  ['placeholder="Boletins de serviço afins"', '[placeholder]="\'os.form.ph.bulletins\' | translate"'],
  ['Comentário do mecânico (opcional)\n                  </label>', "{{ 'os.form.field.mechanicComment' | translate }}\n                  </label>"],
  ['placeholder="Descreva aqui qualquer observação sobre peças ou trocas que julgar conveniente."', '[placeholder]="\'os.form.ph.exchange\' | translate"'],
  ['label="Adicionar produtos"', '[label]="\'os.form.troca.addProducts\' | translate"'],
  ['<p class="hint-muted">Nenhum produto incluído. Use &quot;Adicionar produtos&quot; para selecionar itens como na proposta comercial.</p>', '<p class="hint-muted">{{ \'os.form.troca.noProducts\' | translate }}</p>'],
  ['<th class="col-troca-prod">Produto</th>', '<th class="col-troca-prod">{{ \'os.form.troca.col.product\' | translate }}</th>'],
  ['<th class="col-troca-pn">P/N</th>', '<th class="col-troca-pn">{{ \'os.form.troca.col.pn\' | translate }}</th>'],
  ['<th class="col-troca-qtd">Qtd</th>', '<th class="col-troca-qtd">{{ \'os.form.troca.col.qty\' | translate }}</th>'],
  ['<th class="col-troca-vu">V. unit.</th>', '<th class="col-troca-vu">{{ \'os.form.troca.col.unit\' | translate }}</th>'],
  ['<th class="col-troca-tot">Total</th>', '<th class="col-troca-tot">{{ \'os.form.troca.col.total\' | translate }}</th>'],
  ['<th class="col-troca-pago">Pago</th>', '<th class="col-troca-pago">{{ \'os.form.troca.col.paid\' | translate }}</th>'],
  ['<option [ngValue]="null">Pendente</option>', '<option [ngValue]="null">{{ \'os.form.troca.paid.pending\' | translate }}</option>'],
  ['<option [ngValue]="true">Pago</option>', '<option [ngValue]="true">{{ \'os.form.troca.paid.yes\' | translate }}</option>'],
  ['<option [ngValue]="false">Não pago</option>', '<option [ngValue]="false">{{ \'os.form.troca.paid.no\' | translate }}</option>'],
  ['pTooltip="Pago"', '[pTooltip]="\'os.form.troca.paid.yes\' | translate"'],
  ['pTooltip="Não pago"', '[pTooltip]="\'os.form.troca.paid.no\' | translate"'],
  ['pTooltip="Aguardando análise (Suprimento/Admin/Diretor)"', '[pTooltip]="\'os.form.troca.paid.waiting\' | translate"'],
  ['pTooltip="Remover produto"', '[pTooltip]="\'os.form.troca.remove\' | translate"'],
  ['label="Cancelar"', '[label]="\'os.form.btn.cancel\' | translate"'],
  ['[label]="isEditing ? \'Atualizar\' : \'Criar\'"', '[label]="osSaveButtonLabel"'],
  ['header="Produtos Associados ao FCU"', '[header]="\'os.form.fcuModal.title\' | translate"'],
  ["selectedFcuForProducts.fcuCodigo || 'Produto Aeronáutico'", "selectedFcuForProducts.fcuCodigo || ('os.form.fcu.label' | translate)"],
  ['Produtos Associados\n            </h4>', "{{ 'os.form.fcuModal.associated' | translate }}\n            </h4>"],
  ['<p>Carregando produtos...</p>', '<p>{{ \'os.form.fcuModal.loading\' | translate }}</p>'],
  ['<p>Nenhum produto associado a este FCU.</p>', '<p>{{ \'os.form.fcuModal.empty\' | translate }}</p>'],
  ["associacao.productName || 'Produto sem nome'", "associacao.productName || ('os.form.fcuModal.noName' | translate)"],
  ["getProductTicketColor(associacao) === 'danger' ? 'CRÍTICO' : (getProductTicketColor(associacao) === 'warning' ? 'ATENÇÃO' : 'OK')", 'fcuProductTagLabel(associacao)'],
  ['<span class="info-label">Quantidade Requerida:</span>', '<span class="info-label">{{ \'os.form.fcuModal.qtyRequired\' | translate }}</span>'],
  ['<span class="info-label">Quantidade em Estoque:</span>', '<span class="info-label">{{ \'os.form.fcuModal.qtyStock\' | translate }}</span>'],
  ['<span class="info-label">PN:</span>', '<span class="info-label">{{ \'os.form.fcuModal.pn\' | translate }}</span>'],
  ['<span class="info-label">Descrição:</span>', '<span class="info-label">{{ \'os.form.fcuModal.description\' | translate }}</span>'],
  ['label="Fechar"', '[label]="\'os.form.btn.close\' | translate"'],
  ['header="OS\'s Salvas no Sistema"', '[header]="\'os.form.consult.title\' | translate"'],
  ['placeholder="Procurar por número, cliente ou data..."', '[placeholder]="\'os.form.consult.search\' | translate"'],
  ['pTooltip="Limpar"', '[pTooltip]="\'os.form.consult.tooltip.clear\' | translate"'],
  ['currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"', '[currentPageReportTemplate]="\'os.list.pageReport\' | translate"'],
  ['Número\n                    <p-sortIcon', "{{ 'os.form.consult.col.number' | translate }}\n                    <p-sortIcon"],
  ['Cliente\n                    <p-sortIcon field="clienteNome"', "{{ 'os.form.consult.col.client' | translate }}\n                    <p-sortIcon field=\"clienteNome\""],
  ['Data de Abertura\n                    <p-sortIcon field="dataAbertura"', "{{ 'os.form.consult.col.openDate' | translate }}\n                    <p-sortIcon field=\"dataAbertura\""],
  ['Ação\n                  </th>', "{{ 'os.form.consult.col.action' | translate }}\n                  </th>"],
  ['pTooltip="Selecionar esta OS"', '[pTooltip]="\'os.form.consult.select\' | translate"'],
  ['<span class="selection-text">Selecionado!</span>', '<span class="selection-text">{{ \'os.form.consult.selected\' | translate }}</span>'],
  ["[header]=\"'Déficit do kit FCU' + (kitDeficitOs ? ' — OS ' + formatOSId(kitDeficitOs) : '')\"", '[header]="kitDeficitModalHeader"'],
  ['<span class="kit-deficit-label">Cliente</span>', '<span class="kit-deficit-label">{{ \'os.form.kit.client\' | translate }}</span>'],
  ['<span class="kit-deficit-label">FCU (P/N)</span>', '<span class="kit-deficit-label">{{ \'os.form.kit.fcuPn\' | translate }}</span>'],
  ['<span class="kit-deficit-label">FCU (código)</span>', '<span class="kit-deficit-label">{{ \'os.form.kit.fcuCode\' | translate }}</span>'],
  ['<span>Carregando itens em déficit…</span>', '<span>{{ \'os.form.kit.loading\' | translate }}</span>'],
  ['<span>Nenhum item em déficit registrado para esta OS.</span>', '<span>{{ \'os.form.kit.empty\' | translate }}</span>'],
  ['<th>P/N</th>', '<th>{{ \'os.form.kit.col.pn\' | translate }}</th>'],
  ['<th>Produto</th>', '<th>{{ \'os.form.kit.col.product\' | translate }}</th>'],
  ['<th class="num-col">Necessário</th>', '<th class="num-col">{{ \'os.form.kit.col.required\' | translate }}</th>'],
  ['<th class="num-col">Disponível</th>', '<th class="num-col">{{ \'os.form.kit.col.available\' | translate }}</th>'],
  ['<th class="num-col">Déficit</th>', '<th class="num-col">{{ \'os.form.kit.col.deficit\' | translate }}</th>'],
];

for (const [from, to] of pairs) {
  if (!s.includes(from)) {
    console.warn('MISSING:', from.slice(0, 60));
  } else {
    s = s.split(from).join(to);
  }
}

const getterBlock = `
  get osModalHeader(): string {
    if (this.isReadOnly) return this.i18n.translate('os.form.dialog.view');
    if (this.isEditing) return this.i18n.translate('os.form.dialog.edit');
    return this.i18n.translate('os.form.dialog.new');
  }

  get kitDeficitModalHeader(): string {
    const base = this.i18n.translate('os.form.kit.title');
    if (!this.kitDeficitOs) return base;
    return \`\${base} — OS \${this.formatOSId(this.kitDeficitOs)}\`;
  }

  get osNumberPlaceholder(): string {
    return this.currentOS?.id != null
      ? this.formatOSId(this.currentOS)
      : this.i18n.translate('os.form.numberGeneratedOnSave');
  }

  get osSaveButtonLabel(): string {
    return this.isEditing
      ? this.i18n.translate('os.form.btn.update')
      : this.i18n.translate('os.form.btn.create');
  }

  fcuProductTagLabel(associacao: AssociacaoFcu): string {
    const c = this.getProductTicketColor(associacao);
    if (c === 'danger') return this.i18n.translate('os.form.fcuModal.tag.critical');
    if (c === 'warning') return this.i18n.translate('os.form.fcuModal.tag.warning');
    return this.i18n.translate('os.form.fcuModal.tag.ok');
  }
`;

if (!s.includes('get osModalHeader')) {
  s = s.replace(
    'export class OSListComponent implements OnInit, OnDestroy {',
    `export class OSListComponent implements OnInit, OnDestroy {${getterBlock}`
  );
}

fs.writeFileSync(file, s);
console.log('patched os-list');
