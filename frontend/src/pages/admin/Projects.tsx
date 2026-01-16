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
      setUsers(usersRes.data.filter((u: User) => u.role === 'collaborator'));
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FolderKanban className="h-7 w-7 mr-3 text-blue-600" />
          Gestione Progetti
        </h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
            className={`bg-white rounded-lg shadow-sm border p-5 ${
              !project.active ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                {project.code && (
                  <span className="text-sm text-gray-500">({project.code})</span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                project.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {project.active ? 'Attivo' : 'Archiviato'}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Users className="h-4 w-4 mr-1" />
              {project._count?.assignments || 0} assegnati
              <span className="mx-2">•</span>
              {project._count?.timeEntries || 0} entries
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => handleOpenAssign(project)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Gestisci assegnazioni
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => handleEdit(project)}
                  className="text-gray-400 hover:text-blue-600 p-1"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-gray-400 hover:text-red-600 p-1 ml-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <FolderKanban className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Nessun progetto creato</p>
          <button
            onClick={handleCreate}
            className="mt-3 text-blue-600 hover:underline"
          >
            Crea il primo progetto
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Modifica progetto' : 'Nuovo progetto'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome progetto</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome del progetto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice (opzionale)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="PRJ-001"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  Progetto attivo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Assegna utenti</h2>
                <p className="text-sm text-gray-500">{assigningProject.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nessun collaboratore disponibile
                </p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer ${
                        selectedUserIds.includes(user.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {selectedUserIds.length} selezionati
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleAssignSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
