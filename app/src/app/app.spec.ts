import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('affiche les réglages par défaut de la V1.2', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('À l\'arrêt');
    expect(text).toContain('F1 pour démarrer');
    expect(text).toContain('F10 pour quitter');
    expect(text).toContain('F3 pour capturer');
    expect(text).toContain('Un clic toutes les 10 ms (minimum)');
  });

  it('signale qu\'il tourne hors d\'Electron', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('hors d\'Electron');
  });
});
