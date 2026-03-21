import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { weeklyApi } from '../services/api';
import { WeeklyStatus } from '../types';
import { Calendar, CheckCircle2, Clock, Send, AlertCircle, ChevronLeft, ChevronRight, Palmtree } from 'lucide-react';
import { format, parseISO, addDays, getISOWeek, startOfISOWeek } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Week() {
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState<WeeklyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    loadWeek(selectedWeekStart || undefined);
  }, [selectedWeekStart]);

  const loadWeek = async (weekStart?: string) => {
    setIsLoading(true);
    try {
      const { data } = await weeklyApi.getCurrent(weekStart);
      setWeekData(data);
    } catch (error) {
      console.error('Error loading week:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await weeklyApi.submit(weekData?.weekStart);
      setShowSubmitModal(false);
      loadWeek(selectedWeekStart || undefined);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Errore durante l\'invio della settimana';
      setSubmitError(msg);
      console.error('Error submitting week:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevWeek = () => {
    if (weekData) {
      const prev = format(addDays(parseISO(weekData.weekStart), -7), 'yyyy-MM-dd');
      setSelectedWeekStart(prev);
    }
  };

  const handleNextWeek = () => {
    if (!weekData || isCurrentWeek) return;
    const next = format(addDays(parseISO(weekData.weekStart), 7), 'yyyy-MM-dd');
    setSelectedWeekStart(next);
  };

  const handleDayClick = (dateStr: string) => {
    // Navigate to Dashboard and set the date via URL search params
    navigate(`/?date=${dateStr}`);
  };

  const isCurrentWeek = (() => {
    if (!weekData) return true;
    const currentMonday = format(startOfISOWeek(new Date()), 'yyyy-MM-dd');
    return weekData.weekStart === currentMonday;
  })();

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    return days[dayOfWeek];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'closed_complete':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'closed_incomplete':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'day_off':
        return <Palmtree className="h-5 w-5 text-purple-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'closed_complete':
        return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20';
      case 'closed_incomplete':
        return 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20';
      case 'day_off':
        return 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20';
      default:
        return 'bg-dark-800 border-dark-700 hover:bg-dark-750';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="text-center py-12 text-gray-400">
        Errore nel caricamento dei dati
      </div>
    );
  }

  const closedDays = weekData.days.filter(d => d.status !== 'open' && d.status !== 'day_off').length;
  const dayOffCount = weekData.days.filter(d => d.status === 'day_off').length;
  const workingDays = weekData.days.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5).length;
  const weekNumber = getISOWeek(parseISO(weekData.weekStart));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevWeek}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            title="Settimana precedente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Settimana {weekNumber}
            </h1>
            <p className="text-gray-400 text-sm">
              {format(parseISO(weekData.weekStart), 'd MMM', { locale: it })} –{' '}
              {format(parseISO(weekData.weekEnd), 'd MMM yyyy', { locale: it })}
              {isCurrentWeek && (
                <span className="ml-2 text-blue-400">(corrente)</span>
              )}
            </p>
          </div>
          <button
            onClick={handleNextWeek}
            disabled={isCurrentWeek}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Settimana successiva"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        {weekData.submitted ? (
          <span className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-medium">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Inviata
          </span>
        ) : (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-medium transition-colors"
          >
            <Send className="h-5 w-5 mr-2" />
            Invia settimana
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Totale settimana</p>
              <p className="text-2xl font-bold text-white">{formatMinutes(weekData.totalMinutes)}</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Giornate chiuse</p>
              <p className="text-2xl font-bold text-white">
                {closedDays}/{workingDays - dayOffCount}
                {dayOffCount > 0 && <span className="text-sm text-purple-400 ml-1">+{dayOffCount} ferie</span>}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Registrazioni</p>
              <p className="text-2xl font-bold text-white">{weekData.days.reduce((sum, d) => sum + d.entriesCount, 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekData.days.map((day) => {
          const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
          const dateObj = parseISO(day.date);

          return (
            <button
              key={day.date}
              onClick={() => handleDayClick(day.date)}
              className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${getStatusBg(day.status)} ${
                isWeekend ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-300">{getDayName(day.dayOfWeek)}</span>
                {getStatusIcon(day.status)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {format(dateObj, 'dd/MM')}
              </div>
              <div className="text-sm text-gray-400">
                {day.status === 'day_off' ? (
                  <span className="text-purple-400">Ferie</span>
                ) : day.minutes > 0 ? formatMinutes(day.minutes) : '-'}
              </div>
              {day.entriesCount > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {day.entriesCount} {day.entriesCount === 1 ? 'registrazione' : 'registrazioni'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit info */}
      {weekData.submitted && weekData.submittedAt && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
          <CheckCircle2 className="h-5 w-5 inline mr-2" />
          Settimana inviata il{' '}
          {format(parseISO(weekData.submittedAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
        </div>
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mr-3">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Invia settimana</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Stai per inviare il report della settimana dal{' '}
              <strong className="text-white">{format(parseISO(weekData.weekStart), 'd MMM', { locale: it })}</strong> al{' '}
              <strong className="text-white">{format(parseISO(weekData.weekEnd), 'd MMM', { locale: it })}</strong>.
            </p>
            <div className="bg-dark-700 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Totale:</span>
                  <span className="ml-2 font-medium text-white">{formatMinutes(weekData.totalMinutes)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Giornate chiuse:</span>
                  <span className="ml-2 font-medium text-white">{closedDays}/{workingDays}</span>
                </div>
              </div>
            </div>
            {closedDays < workingDays && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Attenzione: non tutte le giornate lavorative sono state chiuse.
                </span>
              </div>
            )}
            {submitError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowSubmitModal(false); setSubmitError(null); }}
                className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Invio...' : 'Conferma invio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
