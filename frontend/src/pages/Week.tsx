import { useState, useEffect } from 'react';
import { weeklyApi } from '../services/api';
import { WeeklyStatus } from '../types';
import { Calendar, CheckCircle2, Clock, Send, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Week() {
  const [weekData, setWeekData] = useState<WeeklyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    loadWeek();
  }, []);

  const loadWeek = async () => {
    setIsLoading(true);
    try {
      const { data } = await weeklyApi.getCurrent();
      setWeekData(data);
    } catch (error) {
      console.error('Error loading week:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await weeklyApi.submit();
      setShowSubmitModal(false);
      loadWeek();
    } catch (error) {
      console.error('Error submitting week:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'closed_incomplete':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'closed_complete':
        return 'bg-green-50 border-green-200';
      case 'closed_incomplete':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!weekData) {
    return (
      <div className="text-center py-12 text-gray-500">
        Errore nel caricamento dei dati
      </div>
    );
  }

  const closedDays = weekData.days.filter(d => d.status !== 'open').length;
  const workingDays = weekData.days.filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settimana corrente</h1>
          <p className="text-gray-500 text-sm">
            {format(parseISO(weekData.weekStart), 'd MMM', { locale: it })} -{' '}
            {format(parseISO(weekData.weekEnd), 'd MMM yyyy', { locale: it })}
          </p>
        </div>
        {weekData.submitted ? (
          <span className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Inviata
          </span>
        ) : (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Send className="h-5 w-5 mr-2" />
            Invia settimana
          </button>
        )}
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {formatMinutes(weekData.totalMinutes)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Totale settimana</div>
          </div>
          <div className="text-center border-x">
            <div className="text-3xl font-bold text-gray-900">
              {closedDays}/{workingDays}
            </div>
            <div className="text-sm text-gray-500 mt-1">Giornate chiuse</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {weekData.days.reduce((sum, d) => sum + d.entriesCount, 0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Registrazioni</div>
          </div>
        </div>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekData.days.map((day) => {
          const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
          const dateObj = parseISO(day.date);

          return (
            <div
              key={day.date}
              className={`rounded-lg border p-4 ${getStatusBg(day.status)} ${
                isWeekend ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">{getDayName(day.dayOfWeek)}</span>
                {getStatusIcon(day.status)}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {format(dateObj, 'd')}
              </div>
              <div className="text-sm text-gray-600">
                {day.minutes > 0 ? formatMinutes(day.minutes) : '-'}
              </div>
              {day.entriesCount > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {day.entriesCount} {day.entriesCount === 1 ? 'entry' : 'entries'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit info */}
      {weekData.submitted && weekData.submittedAt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 text-sm">
          <CheckCircle2 className="h-5 w-5 inline mr-2" />
          Settimana inviata il{' '}
          {format(parseISO(weekData.submittedAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
        </div>
      )}

      {/* Submit modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Invia settimana</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Stai per inviare il report della settimana dal{' '}
              <strong>{format(parseISO(weekData.weekStart), 'd MMM', { locale: it })}</strong> al{' '}
              <strong>{format(parseISO(weekData.weekEnd), 'd MMM', { locale: it })}</strong>.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Totale:</span>
                  <span className="ml-2 font-medium">{formatMinutes(weekData.totalMinutes)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Giornate chiuse:</span>
                  <span className="ml-2 font-medium">{closedDays}/{workingDays}</span>
                </div>
              </div>
            </div>
            {closedDays < workingDays && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  Attenzione: non tutte le giornate lavorative sono state chiuse.
                </span>
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
