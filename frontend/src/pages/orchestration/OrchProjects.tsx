import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orchestrationApi } from '../../services/api';
import { OrchProject, OrchProjectStatus } from '../../types';
import {
  ClipboardCheck,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

const STATUS_CONFIG: Record<OrchProjectStatus, { label: string; color: string; bgColor: string }> = {
  in_development: { label: 'In Sviluppo', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  ready_for_publish: { label: 'Pronto', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  published: { label: 'Pubblicato', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  delivered: { label: 'Consegnato', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
};

export default function OrchProjectsPage() {
  const [projects, setProjects] = useState<OrchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await orchestrationApi.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento progetti');
    } finally {
      setIsLoading(false);
    }
  };

  const getGateIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle2 className="h-4 w-4 text-green-400" />
    ) : (
      <Clock className="h-4 w-4 text-gray-500" />
    );
  };

  const getChecklistStats = (project: OrchProject) => {
    const total = project.checklists?.length || 0;
    const completed = project.checklists?.filter(c => c.status === 'completed').length || 0;
    return { total, completed };
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
          <ClipboardCheck className="h-7 w-7 mr-3 text-emerald-400" />
          Orchestration
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProjects}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
            title="Ricarica"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <Link
            to="/orchestration/new-ai"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:from-amber-600 hover:to-orange-600 font-medium transition-colors"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Crea con AI
          </Link>
          <Link
            to="/orchestration/new"
            className="flex items-center px-4 py-2 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-600 hover:text-white font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Manuale
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-dark-800 rounded-xl border border-dark-700">
          <ClipboardCheck className="h-12 w-12 mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">Nessun progetto orchestration creato</p>
          <Link
            to="/orchestration/new"
            className="mt-3 inline-block text-amber-400 hover:text-amber-300"
          >
            Crea il primo progetto
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const statusConfig = STATUS_CONFIG[project.status];
            const { total, completed } = getChecklistStats(project);
            const gateStatus = project._gateStatus;

            return (
              <Link
                key={project.id}
                to={`/orchestration/${project.id}`}
                className="block bg-dark-800 rounded-xl border border-dark-700 p-5 hover:border-dark-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                      {project.code && (
                        <span className="text-sm text-gray-500">({project.code})</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      {/* Checklist progress */}
                      <div className="flex items-center gap-2 text-gray-400">
                        <ClipboardCheck className="h-4 w-4" />
                        <span>{completed}/{total} checklist</span>
                      </div>

                      {/* Gates */}
                      {gateStatus && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5" title="Gate Pubblicato">
                            {getGateIcon(gateStatus.published?.passed)}
                            <span className={gateStatus.published?.passed ? 'text-green-400' : 'text-gray-500'}>
                              Pubblicato
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5" title="Gate Consegnato">
                            {getGateIcon(gateStatus.delivered?.passed)}
                            <span className={gateStatus.delivered?.passed ? 'text-green-400' : 'text-gray-500'}>
                              Consegnato
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-gray-500" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
