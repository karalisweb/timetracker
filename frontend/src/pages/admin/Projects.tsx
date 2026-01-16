import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Project, User } from '../../types';
import { FolderKanban, Plus, Edit2, Trash2, X, Check, Users } from 'lucide-react';

interface FormData {
  name: string;
  code: string;
  active: boolean;
}

const emptyForm: FormData = {
  name: '',
  code: '',
  active: true,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningProject, setAssigningProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        adminApi.getProjects(),
        adminApi.getUsers(),
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      code: project.code || '',
      active: project.active,
    });
    setEditingId(project.id);
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
        name: formData.name,
        code: formData.code || undefined,
        active: formData.active,
      };

      if (editingId) {
        await adminApi.updateProject(editingId, payload);
      } else {
        await adminApi.createProject(payload);
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo progetto? Le time entries associate verranno eliminate.')) return;

    try {
      await adminApi.deleteProject(id);
      loadData();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleOpenAssign = async (project: Project) => {
    try {
      const { data } = await adminApi.getProject(project.id);
      setAssigningProject(data);
      setSelectedUserIds(data.assignments?.map((a: any) => a.user.id) || []);
      setShowAssignModal(true);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assigningProject) return;
    setIsSubmitting(true);

    try {
      await adminApi.assignUsers(assigningProject.id, selectedUserIds);
      setShowAssignModal(false);
      loadData();
    } catch (error) {
      console.error('Error assigning users:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
          <FolderKanban className="h-7 w-7 mr-3 text-cyan-400" />
          Gestione Progetti
        </h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuovo progetto
        </button>
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`bg-dark-800 rounded-xl border border-dark-700 p-5 ${
              !project.active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{project.name}</h3>
                {project.code && (
                  <span className="text-sm text-gray-400">({project.code})</span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                project.active
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-dark-700 text-gray-400'
              }`}>
                {project.active ? 'Attivo' : 'Archiviato'}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-400 mb-4">
              <Users className="h-4 w-4 mr-1" />
              {project._count?.assignments || 0} assegnati
              <span className="mx-2">•</span>
              {project._count?.timeEntries || 0} entries
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-dark-700">
              <button
                onClick={() => handleOpenAssign(project)}
                className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
              >
                Gestisci assegnazioni
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => handleEdit(project)}
                  className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-gray-400 hover:text-red-400 p-1 ml-1 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 bg-dark-800 rounded-xl border border-dark-700">
          <FolderKanban className="h-12 w-12 mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">Nessun progetto creato</p>
          <button
            onClick={handleCreate}
            className="mt-3 text-amber-400 hover:text-amber-300"
          >
            Crea il primo progetto
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-md w-full mx-4">
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Modifica progetto' : 'Nuovo progetto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome progetto</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome del progetto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Codice (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PRJ-001"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 bg-dark-700 border-dark-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-300">
                  Progetto attivo
                </label>
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
                  {editingId ? 'Salva' : 'Crea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && assigningProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-dark-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Assegna utenti</h2>
                <p className="text-sm text-gray-400">{assigningProject.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  Nessun utente disponibile
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUserIds.includes(user.id)
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-dark-600 hover:bg-dark-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 text-blue-600 bg-dark-700 border-dark-600 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-white flex items-center gap-2">
                          {user.name}
                          {user.role === 'admin' && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-dark-700 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {selectedUserIds.length} selezionati
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAssignSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Salvataggio...' : 'Salva assegnazioni'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
