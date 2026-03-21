import { WeeklyService } from './weekly.service';

// Accediamo ai metodi privati tramite casting
type WeeklyServicePrivate = {
  parseLocalDate(dateStr: string): Date;
  getWeekStart(date?: Date): Date;
  getWeekEnd(weekStart: Date): Date;
  formatDateStr(date: Date): string;
};

describe('WeeklyService — calcoli date', () => {
  let service: WeeklyServicePrivate;

  beforeEach(() => {
    // Creiamo un'istanza con dipendenze mock
    service = new (WeeklyService as any)(null, null, null) as WeeklyServicePrivate;
  });

  describe('parseLocalDate', () => {
    it('parsa una data come ora locale, non UTC', () => {
      const date = service.parseLocalDate('2026-02-16');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(1); // febbraio = 1
      expect(date.getDate()).toBe(16);
    });

    it('non shifta la data a causa del timezone', () => {
      // Questo era il bug: new Date("2026-02-16") creava UTC midnight
      // che in CET diventava il giorno prima
      const date = service.parseLocalDate('2026-03-01');
      expect(date.getDate()).toBe(1);
      expect(date.getMonth()).toBe(2); // marzo = 2
    });

    it('gestisce fine febbraio correttamente', () => {
      const date = service.parseLocalDate('2026-02-28');
      expect(date.getDate()).toBe(28);
      expect(date.getMonth()).toBe(1);
    });
  });

  describe('getWeekStart', () => {
    it('ritorna lunedi per un lunedi', () => {
      // 2026-03-16 e un lunedi
      const monday = service.parseLocalDate('2026-03-16');
      const result = service.getWeekStart(monday);
      expect(service.formatDateStr(result)).toBe('2026-03-16');
    });

    it('ritorna lunedi per un mercoledi', () => {
      // 2026-03-18 e un mercoledi -> lunedi e 2026-03-16
      const wednesday = service.parseLocalDate('2026-03-18');
      const result = service.getWeekStart(wednesday);
      expect(service.formatDateStr(result)).toBe('2026-03-16');
    });

    it('ritorna lunedi per una domenica', () => {
      // 2026-03-22 e una domenica -> lunedi e 2026-03-16
      const sunday = service.parseLocalDate('2026-03-22');
      const result = service.getWeekStart(sunday);
      expect(service.formatDateStr(result)).toBe('2026-03-16');
    });

    it('ritorna lunedi per un sabato', () => {
      // 2026-03-21 e un sabato -> lunedi e 2026-03-16
      const saturday = service.parseLocalDate('2026-03-21');
      const result = service.getWeekStart(saturday);
      expect(service.formatDateStr(result)).toBe('2026-03-16');
    });

    it('gestisce il cambio mese feb->mar', () => {
      // 2026-03-01 e un domenica -> lunedi e 2026-02-23
      const marchFirst = service.parseLocalDate('2026-03-01');
      const result = service.getWeekStart(marchFirst);
      expect(service.formatDateStr(result)).toBe('2026-02-23');
    });

    it('gestisce il cambio mese gen->feb al contrario', () => {
      // 2026-02-01 e un domenica -> lunedi e 2026-01-26
      const febFirst = service.parseLocalDate('2026-02-01');
      const result = service.getWeekStart(febFirst);
      expect(service.formatDateStr(result)).toBe('2026-01-26');
    });

    it('gestisce il cambio anno dic->gen', () => {
      // 2026-01-01 e un giovedi -> lunedi e 2025-12-29
      const janFirst = service.parseLocalDate('2026-01-01');
      const result = service.getWeekStart(janFirst);
      expect(service.formatDateStr(result)).toBe('2025-12-29');
    });
  });

  describe('getWeekEnd', () => {
    it('ritorna domenica (6 giorni dopo lunedi)', () => {
      const monday = service.parseLocalDate('2026-03-16');
      const weekStart = service.getWeekStart(monday);
      const result = service.getWeekEnd(weekStart);
      expect(result.getDate()).toBe(22); // domenica 22 marzo
    });

    it('gestisce fine mese', () => {
      const monday = service.parseLocalDate('2026-02-23');
      const weekStart = service.getWeekStart(monday);
      const result = service.getWeekEnd(weekStart);
      // 23 feb + 6 = 1 marzo
      expect(result.getMonth()).toBe(2); // marzo
      expect(result.getDate()).toBe(1);
    });
  });

  describe('formatDateStr', () => {
    it('formatta correttamente senza usare toISOString', () => {
      const date = service.parseLocalDate('2026-03-05');
      expect(service.formatDateStr(date)).toBe('2026-03-05');
    });

    it('aggiunge zero-padding a mese e giorno', () => {
      const date = service.parseLocalDate('2026-01-09');
      expect(service.formatDateStr(date)).toBe('2026-01-09');
    });
  });

  describe('coerenza getWeekStart con stringa e parseLocalDate', () => {
    it('produce lo stesso risultato da stringa e da data locale', () => {
      // Questo verifica che il bug del timezone sia risolto:
      // getWeekStart(parseLocalDate("2026-02-16")) deve dare lo stesso
      // risultato di getWeekStart(new Date(2026, 1, 16))
      const fromString = service.getWeekStart(service.parseLocalDate('2026-02-16'));
      const fromDate = service.getWeekStart(new Date(2026, 1, 16));
      expect(service.formatDateStr(fromString)).toBe(service.formatDateStr(fromDate));
    });

    it('tutte le settimane di febbraio 2026 sono raggiungibili', () => {
      // Navighiamo settimana per settimana da inizio febbraio
      const weeks: string[] = [];
      let current = service.parseLocalDate('2026-02-01');
      const endOfFeb = service.parseLocalDate('2026-02-28');

      while (current <= endOfFeb) {
        const ws = service.getWeekStart(current);
        const wsStr = service.formatDateStr(ws);
        if (!weeks.includes(wsStr)) {
          weeks.push(wsStr);
        }
        // Avanza di 1 giorno
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }

      // Febbraio 2026 dovrebbe avere 4-5 settimane
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      // La prima settimana dovrebbe includere il 1 feb
      // L'ultima dovrebbe coprire il 28 feb
    });
  });
});
