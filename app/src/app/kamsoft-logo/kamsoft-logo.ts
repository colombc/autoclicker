import { Component } from '@angular/core';

// Logo KamSoft de la V1.2 (data.kam), vectorisé : voir doc/logo-vectorisation/.
// Inséré en SVG dans la page (pas en <img>) pour que le texte suive le thème clair/sombre.
@Component({
  selector: 'app-kamsoft-logo',
  templateUrl: './kamsoft-logo.svg',
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
    .kamsoft-text {
      fill: var(--mat-sys-on-surface);
    }
  `,
})
export class KamsoftLogo {}
