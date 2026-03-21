/**
 * Utility per la gestione date timezone-safe.
 *
 * Regola d'oro: tutte le date per @db.Date (PostgreSQL DATE) devono
 * essere create come UTC midnight. Prisma prende la componente UTC
 * per il campo DATE, quindi se usiamo local midnight su un server CET
 * la data viene shiftata di -1 giorno.
 *
 * Usare SEMPRE queste funzioni invece di:
 *   new Date("YYYY-MM-DD")          → parseDateUTC("YYYY-MM-DD")
 *   date.setHours(0,0,0,0)          → NON usare mai per date @db.Date
 *   date.getDate() / date.getMonth()→ date.getUTCDate() / date.getUTCMonth()
 */

/**
 * Parsa una stringa YYYY-MM-DD come UTC midnight.
 * Sicuro indipendentemente dal timezone del server.
 */
export function parseDateUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formatta una Date come YYYY-MM-DD usando componenti UTC.
 * Sicuro indipendentemente dal timezone del server.
 */
export function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Restituisce la data odierna come YYYY-MM-DD nel timezone locale del server.
 */
export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Restituisce il lunedì (inizio settimana ISO) come UTC midnight.
 * @param date - data di riferimento (default: oggi locale)
 */
export function getWeekStartUTC(date: Date = new Date()): Date {
  // Usa componenti locali per determinare il giorno corrente
  const localDayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  const daysToSubtract = localDayOfWeek === 0 ? 6 : localDayOfWeek - 1;

  // Crea UTC midnight per il lunedì
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysToSubtract,
  ));
}

/**
 * Restituisce la domenica (fine settimana ISO) come UTC midnight.
 */
export function getWeekEndUTC(weekStart: Date): Date {
  return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
}
