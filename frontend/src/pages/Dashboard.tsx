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
        return 'text-green-600 bg-green-50';
      case 'closed_incomplete':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const progressPercent = summary
    ? Math.min((summary.totalMinutes / summary.targetMinutes) * 100, 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isToday ? 'Oggi' : format(new Date(selectedDate), 'EEEE d MMMM', { locale: it })}
          </h1>
          <p className="text-gray-500 text-sm">
            {format(new Date(selectedDate), 'dd/MM/yyyy')}
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary card */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span className="text-2xl font-bold text-gray-900">
                  {formatMinutes(summary.totalMinutes)}
                </span>
                <span className="text-gray-400 ml-2">/ {formatMinutes(summary.targetMinutes)}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(summary.status)}`}>
              {getStatusLabel(summary.status)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${
                summary.isComplete ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {summary.isComplete ? (
                <span className="flex items-center text-green-600">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Target raggiunto!
                </span>
              ) : (
                <span className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  Mancano {formatMinutes(summary.targetMinutes - summary.totalMinutes)}
                </span>
              )}
            </div>

            {summary.status === 'open' ? (
              <button
                onClick={() => setShowCloseModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                Chiudi giornata
              </button>
            ) : (
              <button
                onClick={handleReopenDay}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              >
                Riapri giornata
              </button>
            )}
          </div>
        </div>
      )}

      {/* Time entries */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Registrazioni</h2>
          {summary?.status === 'open' && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ projectId: '', durationMinutes: '', notes: '' });
              }}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progetto
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durata (minuti)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrizione attività..."
                />
              </div>

              <div className="flex items-end space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
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
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Entries list */}
        {entries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nessuna registrazione per questa giornata</p>
            {summary?.status === 'open' && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-blue-600 hover:underline"
              >
                Aggiungi la prima registrazione
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {entry.project.name}
                    {entry.project.code && (
                      <span className="ml-2 text-sm text-gray-500">({entry.project.code})</span>
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-gray-900">
                    {formatMinutes(entry.durationMinutes)}
                  </span>
                  {summary?.status === 'open' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Chiudi giornata</h3>
            <p className="text-gray-600 mb-4">
              Stai per chiudere la giornata del {format(new Date(selectedDate), 'dd/MM/yyyy')}.
              {summary && !summary.isComplete && (
                <span className="block mt-2 text-yellow-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Attenzione: non hai raggiunto il target giornaliero.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCloseDay}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
