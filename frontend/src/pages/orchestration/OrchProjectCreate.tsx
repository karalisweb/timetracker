import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orchestrationApi, adminApi } from '../../services/api';
import { ChecklistTemplate, User } from '../../types';
import {
  ArrowLeft,
  Plus,
  X,
  AlertCircle,
  Check,
  ClipboardCheck
} from 'lucide-react';

interface ChecklistSelection {
  checklistTemplateId: string;
  executorUserId?: string;
  dueDate?: string;
}

export default function OrchProjectCreatePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [asanaProjectId, setAsanaProjectId] = useState('');
  const [selectedChecklists, setSelectedChecklists] = useState<ChecklistSelection[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [templatesRes, usersRes] = await Promise.all([
        orchestrationApi.getTemplates(true),
        adminApi.getUsers(),
      ]);
      setTemplates(templatesRes.data);
      setUsers(usersRes.data);

      // Pre-select mandatory checklists
      const mandatoryChecklists = templatesRes.data
        .filter((t: ChecklistTemplate) => t.isMandatoryForGate)
        .map((t: ChecklistTemplate) => ({
          checklistTemplateId: t.id,
        }));
      setSelectedChecklists(mandatoryChecklists);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento dati');
    } finally {
      setIsLoading(false);
    }
  };

  const addChecklist = (templateId: string) => {
    if (selectedChecklists.some(c => c.checklistTemplateId === templateId)) return;
    setSelectedChecklists([...selectedChecklists, { checklistTemplateId: templateId }]);
  };

  const removeChecklist = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isMandatoryForGate) return; // Can't remove mandatory
    setSelectedChecklists(selectedChecklists.filter(c => c.checklistTemplateId !== templateId));
  };

  const updateChecklist = (templateId: string, updates: Partial<ChecklistSelection>) => {
    setSelectedChecklists(selectedChecklists.map(c =>
      c.checklistTemplateId === templateId ? { ...c, ...updates } : c
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Nome progetto obbligatorio');
      return;
    }

    if (selectedChecklists.length === 0) {
      setError('Seleziona almeno una checklist');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        asanaProjectId: asanaProjectId.trim() || undefined,
        checklists: selectedChecklists.map(c => ({
          checklistTemplateId: c.checklistTemplateId,
          executorUserId: c.executorUserId || undefined,
          dueDate: c.dueDate || undefined,
        })),
      };

      const { data } = await orchestrationApi.createProject(payload);
      navigate(`/orchestration/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore creazione progetto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTemplates = templates.filter(
    t => !selectedChecklists.some(c => c.checklistTemplateId === t.id)
  );

  const usersWithAsana = users.filter(u => u.asanaUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orchestration')}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Nuovo Progetto Orchestration</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Informazioni Base</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome Progetto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Es: Sito Web Acme Corp"
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Codice (opzionale)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Es: PRJ-001"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Asana Project ID (opzionale)
                </label>
                <input
                  type="text"
                  value={asanaProjectId}
                  onChange={(e) => setAsanaProjectId(e.target.value)}
                  placeholder="1234567890123456"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se vuoto, usa il progetto Asana di default
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checklists */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              Checklist
            </h2>
            <span className="text-sm text-gray-400">
              {selectedChecklists.length} selezionate
            </span>
          </div>

          {/* Selected Checklists */}
          {selectedChecklists.length > 0 && (
            <div className="space-y-3 mb-4">
              {selectedChecklists.map((selection) => {
                const template = templates.find(t => t.id === selection.checklistTemplateId);
                if (!template) return null;

                return (
                  <div
                    key={selection.checklistTemplateId}
                    className="p-4 bg-dark-700 rounded-lg border border-dark-600"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{template.name}</span>
                          <span className="px-2 py-0.5 rounded text-xs bg-dark-600 text-gray-400">
                            {template.category}
                          </span>
                          {template.isMandatoryForGate && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                              Obbligatoria
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                        )}
                      </div>
                      {!template.isMandatoryForGate && (
                        <button
                          type="button"
                          onClick={() => removeChecklist(selection.checklistTemplateId)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Esecutore
                        </label>
                        <select
                          value={selection.executorUserId || ''}
                          onChange={(e) => updateChecklist(selection.checklistTemplateId, {
                            executorUserId: e.target.value || undefined
                          })}
                          className="w-full px-2 py-1.5 bg-dark-600 border border-dark-500 text-white text-sm rounded focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Nessun assegnatario</option>
                          {usersWithAsana.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Scadenza
                        </label>
                        <input
                          type="date"
                          value={selection.dueDate || ''}
                          onChange={(e) => updateChecklist(selection.checklistTemplateId, {
                            dueDate: e.target.value || undefined
                          })}
                          className="w-full px-2 py-1.5 bg-dark-600 border border-dark-500 text-white text-sm rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Checklist */}
          {availableTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Aggiungi Checklist
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => addChecklist(template.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg hover:border-dark-500 hover:text-white text-sm transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {templates.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessun template checklist disponibile</p>
              <p className="text-sm mt-1">Esegui il seed per creare i template</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/orchestration')}
            className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || selectedChecklists.length === 0}
            className="flex items-center px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creazione...' : 'Crea Progetto'}
          </button>
        </div>
      </form>
    </div>
  );
}
