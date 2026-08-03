import { Component, Input } from '@angular/core';

import { CommonModule } from '@angular/common';

import { SkeletonTableComponent } from '../skeleton-table/skeleton-table.component';

import { EmptyStateComponent } from '../empty-state/empty-state.component';

import { TranslatePipe } from '../../core/translate.pipe';

import { ListRefreshOverlayComponent } from '../list-refresh-overlay/list-refresh-overlay.component';



/**

 * Skeleton (carga inicial), empty state e projeção da tabela/lista.

 *

 * Regras para listas lazy (`p-table [lazy]="true"`):

 * - Não use `*ngIf="items.length > 0"` na tabela — impede o primeiro `onLazyLoad`.

 * - Inicie com `loading = true` e dispare a carga no `ngOnInit`, **ou** use

 *   `[mountContentWhileLoading]="true"` para montar a tabela invisível durante o skeleton.

 *

 * Telas search-first (sem carga automática): mantenha `mountContentWhileLoading` false (padrão).

 */

@Component({

  selector: 'app-list-data-states',

  standalone: true,

  imports: [

    CommonModule,

    SkeletonTableComponent,

    EmptyStateComponent,

    TranslatePipe,

    ListRefreshOverlayComponent

  ],

  host: {
    class: 'list-data-states-host',
  },

  styles: [`

    :host {
      flex: none;
      min-height: unset;
      display: block;
      overflow: visible;
    }

    .list-data-states {

      position: relative;

      overflow: visible;

    }



    .list-data-states__lazy-mount {

      position: absolute;

      width: 1px;

      height: 1px;

      padding: 0;

      margin: -1px;

      overflow: hidden;

      clip: rect(0, 0, 0, 0);

      white-space: nowrap;

      border: 0;

    }

  `],

  template: `

    <div class="list-data-states" [class.list-data-states--refreshing]="loading && itemCount > 0">

      @if (loading && itemCount === 0) {

        <app-skeleton-table

          [rows]="skeletonRows"

          [cols]="skeletonCols"

          [ariaLabel]="'ui.skeleton.table' | translate" />

      }

      @if (!loading && itemCount === 0) {

        <app-empty-state

          [icon]="emptyIcon"

          [titleKey]="emptyTitleKey"

          [descriptionKey]="emptyDescriptionKey">

          <ng-content select="[emptyAction]" />

        </app-empty-state>

      }

      @if (loading && itemCount === 0 && mountContentWhileLoading) {

        <div class="list-data-states__lazy-mount" aria-hidden="true">

          <ng-content />

        </div>

      }

      @if (itemCount > 0) {

        <app-list-refresh-overlay [loading]="loading"></app-list-refresh-overlay>

        <ng-content />

      }

    </div>

  `

})

export class ListDataStatesComponent {

  @Input() loading = false;

  @Input() itemCount = 0;

  @Input() skeletonRows = 6;

  @Input() skeletonCols = 6;

  @Input() emptyIcon = 'pi-inbox';

  @Input() emptyTitleKey = 'ui.empty.title';

  @Input() emptyDescriptionKey = 'ui.empty.description';

  /** Monta conteúdo projetado (ex.: tabela lazy) durante skeleton inicial. */

  @Input() mountContentWhileLoading = false;

}


