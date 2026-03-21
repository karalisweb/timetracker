import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, X, Users } from 'lucide-react';
import { notificationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PendingAlerts {
  previousDayOpen: boolean;
  previousDayDate: string | null;
  previousWeekNotSubmitted: boolean;
  adminAlerts?: {
    unclosedYesterday: string[];
    weekNotSubmitted: string[];
  };
}

export default function NotificationBanner() {
  const [alerts, setAlerts] = useState<PendingAlerts | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Carica dalla sessionStorage le notifiche gia dismissate
    const stored = sessionStorage.getItem('dismissedAlerts');
    if (stored) {
      setDismissed(new Set(JSON.parse(stored)));
    }

    notificationsApi.getPending()
      .then(setAlerts)
      .catch(() => {});
  }, []);

  const dismiss = (key: string) => {
    const next = new Set(dismissed);
    next.add(key);
    setDismissed(next);
    sessionStorage.setItem('dismissedAlerts', JSON.stringify([...next]));
  };

  if (!alerts) return null;

  const banners: React.ReactNode[] = [];

  // Banner: giorno precedente non chiuso
  if (alerts.previousDayOpen && alerts.previousDayDate && !dismissed.has('prevDay')) {
    const dateFormatted = alerts.previousDayDate.split('-').reverse().join('/');
    banners.push(
      <div
        key="prevDay"
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">
            Non hai chiuso la giornata di ieri (<strong>{dateFormatted}</strong>).{' '}
            <button
              onClick={() => navigate(`/?date=${alerts.previousDayDate}`)}
              className="underline font-medium hover:text-amber-100"
            >
              Compila ora
            </button>
          </p>
        </div>
        <button onClick={() => dismiss('prevDay')} className="text-amber-400/60 hover:text-amber-300 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Banner: settimana precedente non inviata
  if (alerts.previousWeekNotSubmitted && !dismissed.has('prevWeek')) {
    banners.push(
      <div
        key="prevWeek"
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Calendar className="h-5 w-5 text-orange-400 shrink-0" />
          <p className="text-sm text-orange-200">
            Non hai inviato il time report della settimana precedente.{' '}
            <button
              onClick={() => navigate('/week')}
              className="underline font-medium hover:text-orange-100"
            >
              Invia ora
            </button>
          </p>
        </div>
        <button onClick={() => dismiss('prevWeek')} className="text-orange-400/60 hover:text-orange-300 shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Banner admin: riepilogo non-compliance
  if (isAdmin && alerts.adminAlerts && !dismissed.has('adminAlerts')) {
    const { unclosedYesterday, weekNotSubmitted } = alerts.adminAlerts;
    banners.push(
      <div
        key="adminAlerts"
        className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-300">Report Compliance</p>
          </div>
          <button onClick={() => dismiss('adminAlerts')} className="text-red-400/60 hover:text-red-300 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="ml-8 space-y-1 text-sm text-red-200/80">
          {unclosedYesterday.length > 0 && (
            <p>
              Giornata ieri non chiusa ({unclosedYesterday.length}): {unclosedYesterday.join(', ')}
            </p>
          )}
          {weekNotSubmitted.length > 0 && (
            <p>
              Settimana non inviata ({weekNotSubmitted.length}): {weekNotSubmitted.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return <div className="space-y-2 mb-4">{banners}</div>;
}
