import { parseDateUTC, formatDateUTC, getWeekStartUTC, getWeekEndUTC, getTodayStr } from '../common/date.utils';

describe('Date utilities — calcoli date timezone-safe', () => {

  describe('parseDateUTC', () => {
    it('parsa una data come UTC midnight', () => {
      const date = parseDateUTC('2026-02-16');
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(1); // febbraio = 1
      expect(date.getUTCDate()).toBe(16);
      expect(date.getUTCHours()).toBe(0);
    });

    it('non shifta la data a causa del timezone', () => {
      const date = parseDateUTC('2026-03-01');
      expect(date.getUTCDate()).toBe(1);
      expect(date.getUTCMonth()).toBe(2); // marzo = 2
    });

    it('gestisce fine febbraio correttamente', () => {
      const date = parseDateUTC('2026-02-28');
      expect(date.getUTCDate()).toBe(28);
      expect(date.getUTCMonth()).toBe(1);
    });

    it('crea sempre UTC midnight (00:00:00.000Z)', () => {
      const date = parseDateUTC('2026-07-15');
      expect(date.toISOString()).toBe('2026-07-15T00:00:00.000Z');
    });
  });

  describe('formatDateUTC', () => {
    it('formatta correttamente usando UTC', () => {
      const date = parseDateUTC('2026-03-05');
      expect(formatDateUTC(date)).toBe('2026-03-05');
    });

    it('aggiunge zero-padding a mese e giorno', () => {
      const date = parseDateUTC('2026-01-09');
      expect(formatDateUTC(date)).toBe('2026-01-09');
    });

    it('non è influenzato dal timezone locale', () => {
      // Crea una data che potrebbe essere shiftata in timezone locali
      const date = new Date('2026-03-01T00:00:00.000Z');
      expect(formatDateUTC(date)).toBe('2026-03-01');
    });

    it('roundtrip: parseDateUTC → formatDateUTC è identità', () => {
      const dates = ['2026-01-01', '2026-02-28', '2026-03-01', '2026-12-31'];
      for (const d of dates) {
        expect(formatDateUTC(parseDateUTC(d))).toBe(d);
      }
    });
  });

  describe('getWeekStartUTC', () => {
    it('ritorna lunedì per un lunedì', () => {
      const monday = parseDateUTC('2026-03-16');
      const result = getWeekStartUTC(monday);
      expect(formatDateUTC(result)).toBe('2026-03-16');
    });

    it('ritorna lunedì per un mercoledì', () => {
      const wednesday = parseDateUTC('2026-03-18');
      const result = getWeekStartUTC(wednesday);
      expect(formatDateUTC(result)).toBe('2026-03-16');
    });

    it('ritorna lunedì per una domenica', () => {
      const sunday = parseDateUTC('2026-03-22');
      const result = getWeekStartUTC(sunday);
      expect(formatDateUTC(result)).toBe('2026-03-16');
    });

    it('ritorna lunedì per un sabato', () => {
      const saturday = parseDateUTC('2026-03-21');
      const result = getWeekStartUTC(saturday);
      expect(formatDateUTC(result)).toBe('2026-03-16');
    });

    it('gestisce il cambio mese feb->mar', () => {
      const marchFirst = parseDateUTC('2026-03-01');
      const result = getWeekStartUTC(marchFirst);
      expect(formatDateUTC(result)).toBe('2026-02-23');
    });

    it('gestisce il cambio mese gen->feb', () => {
      const febFirst = parseDateUTC('2026-02-01');
      const result = getWeekStartUTC(febFirst);
      expect(formatDateUTC(result)).toBe('2026-01-26');
    });

    it('gestisce il cambio anno dic->gen', () => {
      const janFirst = parseDateUTC('2026-01-01');
      const result = getWeekStartUTC(janFirst);
      expect(formatDateUTC(result)).toBe('2025-12-29');
    });

    it('ritorna sempre UTC midnight', () => {
      const result = getWeekStartUTC(parseDateUTC('2026-03-18'));
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
    });
  });

  describe('getWeekEndUTC', () => {
    it('ritorna domenica (6 giorni dopo lunedì)', () => {
      const weekStart = getWeekStartUTC(parseDateUTC('2026-03-16'));
      const result = getWeekEndUTC(weekStart);
      expect(formatDateUTC(result)).toBe('2026-03-22');
    });

    it('gestisce fine mese', () => {
      const weekStart = getWeekStartUTC(parseDateUTC('2026-02-23'));
      const result = getWeekEndUTC(weekStart);
      expect(formatDateUTC(result)).toBe('2026-03-01');
    });
  });

  describe('getTodayStr', () => {
    it('restituisce una stringa YYYY-MM-DD', () => {
      const today = getTodayStr();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('coerenza settimane', () => {
    it('tutte le settimane di febbraio 2026 sono raggiungibili', () => {
      const weeks: string[] = [];
      let current = parseDateUTC('2026-02-01');
      const endOfFeb = parseDateUTC('2026-02-28');

      while (current <= endOfFeb) {
        const ws = getWeekStartUTC(current);
        const wsStr = formatDateUTC(ws);
        if (!weeks.includes(wsStr)) {
          weeks.push(wsStr);
        }
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
      }

      expect(weeks.length).toBeGreaterThanOrEqual(4);
    });

    it('7 giorni da weekStart coprono lun-dom', () => {
      const weekStart = getWeekStartUTC(parseDateUTC('2026-03-18'));
      const days: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
        days.push(formatDateUTC(d));
      }
      expect(days).toEqual([
        '2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19',
        '2026-03-20', '2026-03-21', '2026-03-22',
      ]);
    });

    it('getUTCDay per ogni giorno della settimana è corretto', () => {
      const weekStart = getWeekStartUTC(parseDateUTC('2026-03-18'));
      const expectedDays = [1, 2, 3, 4, 5, 6, 0]; // Lun=1, ..., Dom=0
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
        expect(d.getUTCDay()).toBe(expectedDays[i]);
      }
    });
  });
});
