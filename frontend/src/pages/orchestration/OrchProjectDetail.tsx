import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { orchestrationApi, adminApi } from '../../services/api';
import { OrchProject, ChecklistTemplate, User, OrchProjectStatus, ChecklistInstanceStatus } from '../../types';
import {
  ArrowLeft,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  User as UserIcon,
  Calendar
} from 'lucide-react';

const STATUS_CONFIG: Record<OrchProjectStatus, { label: string; color: string; bgColor: string }> = {
  in_development: { label: 'In Sviluppo', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  ready_for_publish: { label: 'Pronto', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  published: { label: 'Pubblicato', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  delivered: { label: 'Consegnato', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

const CHECKLIST_STATUS_CONFIG: Record<ChecklistInstanceStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'In attesa', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  in_progress: { label: 'In corso', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  completed: { label: 'Completata', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  skipped: { label: 'Saltata', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
};

export default function OrchProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<OrchProject | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedExecutor, setSelectedExecutor] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projectRes, templatesRes, usersRes] = await Promise.all([
        orchestrationApi.getProject(id!),
        orchestrationApi.getTemplates(true),
        adminApi.getUsers(),
      ]);
      setProject(projectRes.data);
      setTemplates(templatesRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento progetto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChecklist = async () => {
    if (!selectedTemplate) return;

    try {
      setAddingChecklist(true);
      await orchestrationApi.addChecklist(id!, {
        checklistTemplateId: selectedTemplate,
        executorUserId: selectedExecutor || undefined,
      });
      setShowAddChecklist(false);
      setSelectedTemplate('');
      setSelectedExecutor('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore aggiunta checklist');
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleRetrySync = async () => {
    try {
      setSyncing(true);
      await orchestrationApi.retrySync(id!);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleRecalculateGates = async () => {
    try {
      setRecalculating(true);
      await orchestrationApi.recalculateGates(id!);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore ricalcolo gates');
    } finally {
      setRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-3" />
        <p className="text-gray-400">Progetto non trovato</p>
        <Link to="/orchestration" className="mt-3 inline-block text-amber-400 hover:text-amber-300">
          Torna alla lista
        </Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status];
  const gateStatus = project._gateStatus;

  // Find templates not yet assigned to this project
  const assignedTemplateIds = project.checklists?.map(c => c.checklistTemplateId) || [];
  const availableTemplates = templates.filter(t => !assignedTemplateIds.includes(t.id));

  // Check if there are failed syncs
  const hasFailedSyncs = project.checklists?.some(c =>
    c.tasks?.some(t => t.syncStatus === 'failed')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orchestration')}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
              {project.code && (
                <span className="text-gray-500">({project.code})</span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            {project.asanaProjectId && (
              <a
                href={`https://app.asana.com/0/${project.asanaProjectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
              >
                <ExternalLink className="h-3 w-3" />
                Apri in Asana
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasFailedSyncs && (
            <button
              onClick={handleRetrySync}
              disabled={syncing}
              className="flex items-center px-3 py-2 text-orange-400 border border-orange-500/50 rounded-lg hover:bg-orange-500/10 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Retry Sync
            </button>
          )}
          <button
            onClick={handleRecalculateGates}
            disabled={recalculating}
            className="flex items-center px-3 py-2 text-gray-400 border border-dark-600 rounded-lg hover:bg-dark-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recalculating ? 'animate-spin' : ''}`} />
            Ricalcola Gates
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Gates Status */}
      {gateStatus && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Gates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gate Pubblicato */}
            <div className={`p-4 rounded-lg border ${
              gateStatus.published?.passed
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-dark-600 bg-dark-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {gateStatus.published?.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-500" />
                )}
                <span className="font-medium text-white">Gate: Pubblicato</span>
              </div>
              {!gateStatus.published?.passed && gateStatus.published?.missing?.length > 0 && (
                <div className="text-sm text-gray-400">
                  <p className="mb-1">Checklist mancanti:</p>
                  <ul className="list-disc list-inside">
                    {gateStatus.published.missing.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gateStatus.published?.passed && (
                <p className="text-sm text-green-400">Tutti i requisiti soddisfatti</p>
              )}
            </div>

            {/* Gate Consegnato */}
            <div className={`p-4 rounded-lg border ${
              gateStatus.delivered?.passed
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-dark-600 bg-dark-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {gateStatus.delivered?.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-500" />
                )}
                <span className="font-medium text-white">Gate: Consegnato</span>
              </div>
              {!gateStatus.delivered?.passed && gateStatus.delivered?.missing?.length > 0 && (
                <div className="text-sm text-gray-400">
                  <p className="mb-1">Checklist mancanti:</p>
                  <ul className="list-disc list-inside">
                    {gateStatus.delivered.missing.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gateStatus.delivered?.passed && (
                <p className="text-sm text-green-400">Tutti i requisiti soddisfatti</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checklists */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-400" />
            Checklist Assegnate
          </h2>
          {availableTemplates.length > 0 && (
            <button
              onClick={() => setShowAddChecklist(true)}
              className="flex items-center px-3 py-1.5 text-amber-400 border border-amber-500/50 rounded-lg hover:bg-amber-500/10 text-sm transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi checklist
            </button>
          )}
        </div>

        {project.checklists?.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Nessuna checklist assegnata</p>
            {availableTemplates.length > 0 && (
              <button
                onClick={() => setShowAddChecklist(true)}
                className="mt-2 text-amber-400 hover:text-amber-300"
              >
                Aggiungi la prima checklist
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {project.checklists.map((checklist) => {
              const checklistStatusConfig = CHECKLIST_STATUS_CONFIG[checklist.status];
              const completedTasks = checklist.tasks?.filter(t => t.completedAt).length || 0;
              const totalTasks = checklist.tasks?.length || 0;
              const hasErrors = checklist.tasks?.some(t => t.syncStatus === 'failed');

              return (
                <div
                  key={checklist.id}
                  className={`p-4 rounded-lg border ${
                    hasErrors ? 'border-orange-500/50 bg-orange-500/10' : 'border-dark-600 bg-dark-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {checklist.template?.name || 'Checklist'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${checklistStatusConfig.bgColor} ${checklistStatusConfig.color}`}>
                          {checklistStatusConfig.label}
                        </span>
                        {checklist.template?.isMandatoryForGate && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
                            Obbligatoria
                          </span>
                        )}
                        {hasErrors && (
                          <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400">
                            Sync fallito
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                        {checklist.executor && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="h-3.5 w-3.5" />
                            {checklist.executor.name}
                          </div>
                        )}
                        {checklist.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(checklist.dueDate).toLocaleDateString('it-IT')}
                          </div>
                        )}
                        <div>
                          {completedTasks}/{totalTasks} task completati
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {checklist.template?.category}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {totalTasks > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            checklist.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Checklist Modal */}
      {showAddChecklist && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-md w-full mx-4">
            <div className="p-6 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">Aggiungi Checklist</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Template Checklist
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleziona template...</option>
                  {availableTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                      {template.isMandatoryForGate && ' - Obbligatoria'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Esecutore (opzionale)
                </label>
                <select
                  value={selectedExecutor}
                  onChange={(e) => setSelectedExecutor(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Nessun assegnatario</option>
                  {users.filter(u => u.asanaUserId).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Solo utenti con Asana User ID configurato
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-dark-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddChecklist(false);
                  setSelectedTemplate('');
                  setSelectedExecutor('');
                }}
                className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleAddChecklist}
                disabled={!selectedTemplate || addingChecklist}
                className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {addingChecklist ? 'Aggiunta...' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
