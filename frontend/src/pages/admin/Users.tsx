import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { User } from '../../types';
import { Users as UsersIcon, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Gio' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sab' },
  { value: 7, label: 'Dom' },
];

const REMINDER_CHANNELS = [
  { value: 'slack_only', label: 'Solo Slack' },
  { value: 'slack_email', label: 'Slack + Email' },
  { value: 'email_only', label: 'Solo Email' },
];

interface FormData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'collaborator';
  workingDays: number[];
  workStartTime: string;
  workEndTime: string;
  dailyTargetMinutes: number;
  slackUserId: string;
  reminderChannel: 'slack_only' | 'slack_email' | 'email_only';
}

const emptyForm: FormData = {
  email: '',
  password: '',
  name: '',
  role: 'collaborator',
  workingDays: [1, 2, 3, 4, 5],
  workStartTime: '09:00',
  workEndTime: '18:00',
  dailyTargetMinutes: 480,
  slackUserId: '',
  reminderChannel: 'slack_only',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      workingDays: user.workingDays,
      workStartTime: user.workStartTime,
      workEndTime: user.workEndTime,
      dailyTargetMinutes: user.dailyTargetMinutes,
      slackUserId: user.slackUserId || '',
      reminderChannel: user.reminderChannel,
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        slackUserId: formData.slackUserId || undefined,
        password: formData.password || undefined,
      };

      if (editingId) {
        if (!formData.password) delete (payload as any).password;
        await adminApi.updateUser(editingId, payload);
      } else {
        await adminApi.createUser(payload);
      }

      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo utente? Questa azione è irreversibile.')) return;

    try {
      await adminApi.deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort(),
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <UsersIcon className="h-7 w-7 mr-3 text-orange-400" />
          Gestione Utenti
        </h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuovo utente
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-700">
            <thead className="bg-dark-850">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Ruolo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Orario</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Target</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-dark-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Collaboratore'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-400 text-sm">
                    {user.workStartTime} - {user.workEndTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-400">
                    {Math.floor(user.dailyTargetMinutes / 60)}h {user.dailyTargetMinutes % 60}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-gray-400 hover:text-red-400 p-1 ml-2 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-700 flex items-center justify-between sticky top-0 bg-dark-800">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Modifica utente' : 'Nuovo utente'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password {editingId && '(lascia vuoto per non modificare)'}
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Ruolo</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="collaborator">Collaboratore</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Giorni lavorativi</label>
                <div className="flex gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.workingDays.includes(day.value)
                          ? 'bg-amber-500 text-black'
                          : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Inizio lavoro</label>
                  <input
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fine lavoro</label>
                  <input
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => setFormData({ ...formData, workEndTime: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Target giornaliero (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.dailyTargetMinutes}
                    onChange={(e) => setFormData({ ...formData, dailyTargetMinutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Slack User ID</label>
                  <input
                    type="text"
                    value={formData.slackUserId}
                    onChange={(e) => setFormData({ ...formData, slackUserId: e.target.value })}
                    placeholder="U01234ABCDE"
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-dark-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Canale reminder</label>
                  <select
                    value={formData.reminderChannel}
                    onChange={(e) => setFormData({ ...formData, reminderChannel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {REMINDER_CHANNELS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {editingId ? 'Salva modifiche' : 'Crea utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
