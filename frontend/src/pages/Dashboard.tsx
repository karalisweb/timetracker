import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { timeEntriesApi, dayStatusApi, projectsApi } from '../services/api';
import { TimeEntry, TodaySummary, Project } from '../types';
import { Plus, Trash2, Edit2, Check, X, Clock, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    durationMinutes: '',
    notes: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        timeEntriesApi.getByDate(selectedDate),
        projectsApi.getAssigned(),
      ]);

      setEntries(entriesRes.data);
      setProjects(projectsRes.data);

      if (isToday) {
        const summaryRes = await dayStatusApi.getTodaySummary();
        setSummary(summaryRes.data);
      } else {
        const statusRes = await dayStatusApi.getByDate(selectedDate);
        const totalMinutes = entriesRes.data.reduce(
          (sum: number, e: TimeEntry) => sum + e.durationMinutes,
          0
        );
        setSummary({
          date: selectedDate,
          totalMinutes,
          targetMinutes: user?.dailyTargetMinutes || 480,
          status: statusRes.data.status || 'open',
          isComplete: totalMinutes >= (user?.dailyTargetMinutes || 480),
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.durationMinutes) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await timeEntriesApi.update(editingId, {
          projectId: formData.projectId,
          durationMinutes: parseInt(formData.durationMinutes),
          notes: formData.notes || undefined,
        });
      } else {
        await timeEntriesApi.create({
          projectId: formData.projectId,
          date: selectedDate,
          durationMinutes: parseInt(formData.durationMinutes),
          notes: formData.notes || undefined,
        });
      }

      setFormData({ projectId: '', durationMinutes: '', notes: '' });
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setFormData({
      projectId: entry.projectId,
      durationMinutes: entry.durationMinutes.toString(),
      notes: entry.notes || '',
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa registrazione?')) return;

    try {
      await timeEntriesApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const handleCloseDay = async () => {
    try {
      await dayStatusApi.close(selectedDate);
      setShowCloseModal(false);
      loadData();
    } catch (error) {
      console.error('Error closing day:', error);
    }
  };

  const handleReopenDay = async () => {
    try {
      await dayStatusApi.reopen(selectedDate);
      loadData();
    } catch (error) {
      console.error('Error reopening day:', error);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed_complete':
        return 'text-green-400 bg-green-500/20';
      case 'closed_incomplete':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-blue-400 bg-blue-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'closed_complete':
        return 'Chiusa (completa)';
      case 'closed_incomplete':
        return 'Chiusa (incompleta)';
      default:
        return 'Aperta';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const progressPercent = summary
    ? Math.min((summary.totalMinutes / summary.targetMinutes) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isToday ? 'Oggi' : format(new Date(selectedDate), 'EEEE d MMMM', { locale: it })}
          </h1>
          <p className="text-gray-400 text-sm">
            {format(new Date(selectedDate), 'dd/MM/yyyy')}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="w-full sm:w-auto px-3 py-2 bg-dark-800 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Summary card */}
      {summary && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Ore registrate</p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">
                    {formatMinutes(summary.totalMinutes)}
                  </span>
                  <span className="text-gray-500 ml-2">/ {formatMinutes(summary.targetMinutes)}</span>
                </div>
              </div>
            </div>
            <span className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(summary.status)}`}>
              {getStatusLabel(summary.status)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${
                summary.isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm">
              {summary.isComplete ? (
                <span className="flex items-center text-green-400">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Target raggiunto!
                </span>
              ) : (
                <span className="flex items-center text-gray-400">
                  <Target className="h-4 w-4 mr-1" />
                  Mancano {formatMinutes(summary.targetMinutes - summary.totalMinutes)}
                </span>
              )}
            </div>

            {summary.status === 'open' ? (
              <button
                onClick={() => setShowCloseModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-medium transition-colors"
              >
                Chiudi giornata
              </button>
            ) : (
              <button
                onClick={handleReopenDay}
                className="w-full sm:w-auto px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 font-medium transition-colors"
              >
                Riapri giornata
              </button>
            )}
          </div>
        </div>
      )}

      {/* Time entries */}
      <div className="bg-dark-800 rounded-xl border border-dark-700">
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <h2 className="font-semibold text-white">Registrazioni</h2>
          {summary?.status === 'open' && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ projectId: '', durationMinutes: '', notes: '' });
              }}
              className="flex items-center px-3 py-1.5 bg-amber-500 text-black rounded-lg hover:bg-amber-600 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 bg-dark-850 border-b border-dark-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Progetto
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleziona...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code && `(${p.code})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Durata (minuti)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Note (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrizione attività..."
                />
              </div>

              <div className="flex items-end space-x-2 sm:col-span-2 md:col-span-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50 transition-colors"
                >
                  <Check className="h-4 w-4 inline mr-1" />
                  {editingId ? 'Salva' : 'Aggiungi'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Entries list */}
        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">Nessuna registrazione per questa giornata</p>
            {summary?.status === 'open' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-amber-400 hover:text-amber-300"
              >
                Aggiungi la prima registrazione
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-dark-750 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {entry.project.name}
                    {entry.project.code && (
                      <span className="ml-2 text-sm text-gray-400">({entry.project.code})</span>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-400 mt-1">{entry.notes}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-white">
                    {formatMinutes(entry.durationMinutes)}
                  </span>
                  {summary?.status === 'open' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close day modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Chiudi giornata</h3>
            <p className="text-gray-300 mb-4">
              Stai per chiudere la giornata del {format(new Date(selectedDate), 'dd/MM/yyyy')}.
              {summary && !summary.isComplete && (
                <span className="block mt-2 text-yellow-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Attenzione: non hai raggiunto il target giornaliero.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCloseDay}
                className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 transition-colors"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
