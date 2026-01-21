import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { orchestrationApi, aiApi, adminApi } from '../../services/api';
import { ChecklistTemplate, User } from '../../types';
import {
  ArrowLeft,
  Sparkles,
  Send,
  AlertCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Users,
  Link2,
} from 'lucide-react';

interface GeneratedTask {
  id: string;
  name: string;
  description: string;
  assigneeRole?: string;
  estimatedMinutes?: number;
  dependsOn?: string[];
  isMilestone?: boolean;
  checklistId?: string;
}

interface GeneratedTaskGroup {
  name: string;
  description: string;
  tasks: GeneratedTask[];
  milestoneChecklistId?: string;
}

interface GenerateResult {
  projectName: string;
  projectDescription: string;
  taskGroups: GeneratedTaskGroup[];
  totalTasks: number;
  totalMilestones: number;
}

export default function OrchProjectCreateAIPage() {
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Data
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Input
  const [description, setDescription] = useState('');
  const [selectedChecklistIds, setSelectedChecklistIds] = useState<string[]>([]);
  const [showChecklistDropdown, setShowChecklistDropdown] = useState(false);

  // Step 2: Review
  const [generatedResult, setGeneratedResult] = useState<GenerateResult | null>(null);
  const [editedTaskGroups, setEditedTaskGroups] = useState<GeneratedTaskGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Step 3: Final
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [templatesRes, usersRes, aiStatusRes] = await Promise.all([
        orchestrationApi.getTemplates(true),
        adminApi.getUsers(),
        aiApi.getStatus(),
      ]);
      setTemplates(templatesRes.data);
      setUsers(usersRes.data);
      setAiEnabled(aiStatusRes.data.enabled);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore caricamento dati');
    } finally {
      setIsLoading(false);
    }
  };

  // Parse @mentions in description
  const parseMentions = useCallback(async (text: string) => {
    try {
      const { data } = await aiApi.parseMentions(text);
      if (data.checklistIds && data.checklistIds.length > 0) {
        setSelectedChecklistIds(prev => {
          const newIds = data.checklistIds.filter((id: string) => !prev.includes(id));
          return [...prev, ...newIds];
        });
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Handle description change with debounced mention parsing
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDescription(newValue);

    // Check for @mentions
    if (newValue.includes('@')) {
      parseMentions(newValue);
    }
  };

  const toggleChecklist = (id: string) => {
    setSelectedChecklistIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!description.trim() || selectedChecklistIds.length === 0) {
      setError('Inserisci una descrizione e seleziona almeno una checklist');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const { data } = await aiApi.generateTasks({
        description: description.trim(),
        checklistIds: selectedChecklistIds,
      });

      setGeneratedResult(data);
      setEditedTaskGroups(data.taskGroups);
      setProjectName(data.projectName);

      // Expand all groups by default
      setExpandedGroups(new Set(data.taskGroups.map((g: GeneratedTaskGroup) => g.name)));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore generazione task');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const updateTask = (groupIndex: number, taskIndex: number, updates: Partial<GeneratedTask>) => {
    setEditedTaskGroups(prev => {
      const next = [...prev];
      next[groupIndex] = {
        ...next[groupIndex],
        tasks: next[groupIndex].tasks.map((t, i) =>
          i === taskIndex ? { ...t, ...updates } : t
        ),
      };
      return next;
    });
  };

  const removeTask = (groupIndex: number, taskIndex: number) => {
    setEditedTaskGroups(prev => {
      const next = [...prev];
      next[groupIndex] = {
        ...next[groupIndex],
        tasks: next[groupIndex].tasks.filter((_, i) => i !== taskIndex),
      };
      return next;
    });
  };

  const addTask = (groupIndex: number) => {
    const newTask: GeneratedTask = {
      id: `new_${Date.now()}`,
      name: 'Nuovo task',
      description: '',
      estimatedMinutes: 60,
    };
    setEditedTaskGroups(prev => {
      const next = [...prev];
      next[groupIndex] = {
        ...next[groupIndex],
        tasks: [...next[groupIndex].tasks, newTask],
      };
      return next;
    });
  };

  const removeGroup = (groupIndex: number) => {
    setEditedTaskGroups(prev => prev.filter((_, i) => i !== groupIndex));
  };

  const addGroup = () => {
    const newGroup: GeneratedTaskGroup = {
      name: 'Nuovo Gruppo',
      description: '',
      tasks: [],
    };
    setEditedTaskGroups(prev => [...prev, newGroup]);
    setExpandedGroups(prev => new Set([...prev, 'Nuovo Gruppo']));
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      setError('Nome progetto obbligatorio');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Create project with checklists
      const payload = {
        name: projectName.trim(),
        code: projectCode.trim() || undefined,
        decisions: {
          generatedByAI: true,
          originalDescription: description,
          taskGroups: editedTaskGroups,
        },
        checklists: selectedChecklistIds.map(id => ({
          checklistTemplateId: id,
        })),
      };

      const { data } = await orchestrationApi.createProject(payload);

      // TODO: In futuro, creare anche i task su Asana con le dipendenze
      // Per ora salviamo solo il progetto con le checklist

      navigate(`/orchestration/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Errore creazione progetto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const totalEstimate = editedTaskGroups.reduce(
    (sum, g) => sum + g.tasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!aiEnabled) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orchestration')}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Crea Progetto con AI</h1>
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white mb-2">AI non configurata</h2>
          <p className="text-gray-300 mb-4">
            Per usare questa funzionalità, configura la chiave API OpenAI nel file .env del backend.
          </p>
          <code className="block bg-dark-800 rounded p-3 text-sm text-gray-400">
            OPENAI_API_KEY=sk-...
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orchestration')}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-400" />
            Crea Progetto con AI
          </h1>
          <p className="text-gray-400 text-sm">
            Descrivi il progetto e l'AI genererà i task per te
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1: Description & Checklists */}
      {!generatedResult && (
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Descrivi il progetto
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Descrivi cosa deve essere realizzato. Puoi usare @NomeChecklist per selezionare
              automaticamente le checklist (es. @SEO @Privacy).
            </p>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Es: Sito e-commerce per vendita scarpe online. Serve area riservata con login, catalogo prodotti con filtri per taglia e colore, carrello e checkout con pagamenti Stripe. Il sito deve essere SEO ottimizzato e GDPR compliant..."
              rows={6}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Checklist Selection */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Checklist da applicare
              </h2>
              <span className="text-sm text-gray-400">
                {selectedChecklistIds.length} selezionate
              </span>
            </div>

            {/* Selected Checklists */}
            {selectedChecklistIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedChecklistIds.map(id => {
                  const template = templates.find(t => t.id === id);
                  if (!template) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded-full text-sm"
                    >
                      {template.name}
                      <button
                        onClick={() => toggleChecklist(id)}
                        className="hover:text-amber-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowChecklistDropdown(!showChecklistDropdown)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-dark-700 border border-dark-600 text-white rounded-lg hover:border-dark-500 transition-colors"
              >
                <span className="text-gray-400">Seleziona checklist...</span>
                {showChecklistDropdown ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {showChecklistDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-dark-700 border border-dark-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => toggleChecklist(template.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-dark-600 transition-colors text-left"
                    >
                      <div>
                        <span className="text-white">{template.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {template.category}
                        </span>
                      </div>
                      {selectedChecklistIds.includes(template.id) && (
                        <Check className="h-4 w-4 text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim() || selectedChecklistIds.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Genera Task con AI
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review Generated Tasks */}
      {generatedResult && (
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Informazioni Progetto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nome Progetto *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Codice (opzionale)
                </label>
                <input
                  type="text"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  placeholder="PRJ-001"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-dark-600">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Stima: {formatMinutes(totalEstimate)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="h-4 w-4" />
                <span>{editedTaskGroups.reduce((s, g) => s + g.tasks.length, 0)} task</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Link2 className="h-4 w-4" />
                <span>{selectedChecklistIds.length} checklist</span>
              </div>
            </div>
          </div>

          {/* Task Groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Gruppi di Task
              </h2>
              <button
                onClick={addGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg hover:text-white hover:border-dark-500 text-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                Aggiungi Gruppo
              </button>
            </div>

            {editedTaskGroups.map((group, groupIndex) => (
              <div
                key={group.name}
                className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden"
              >
                {/* Group Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 bg-dark-750 cursor-pointer hover:bg-dark-700 transition-colors"
                  onClick={() => toggleGroup(group.name)}
                >
                  <div className="flex items-center gap-3">
                    {expandedGroups.has(group.name) ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-white">{group.name}</h3>
                      <p className="text-sm text-gray-400">
                        {group.tasks.length} task
                        {group.milestoneChecklistId && (
                          <span className="ml-2 text-amber-400">• Milestone</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGroup(groupIndex);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Group Tasks */}
                {expandedGroups.has(group.name) && (
                  <div className="p-4 space-y-3">
                    {group.tasks.map((task, taskIndex) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 bg-dark-700 rounded-lg border border-dark-600"
                      >
                        <GripVertical className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1 cursor-move" />
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) =>
                              updateTask(groupIndex, taskIndex, { name: e.target.value })
                            }
                            className="w-full px-2 py-1 bg-dark-600 border border-dark-500 text-white rounded focus:ring-1 focus:ring-amber-500"
                          />
                          <textarea
                            value={task.description}
                            onChange={(e) =>
                              updateTask(groupIndex, taskIndex, { description: e.target.value })
                            }
                            placeholder="Descrizione..."
                            rows={2}
                            className="w-full px-2 py-1 bg-dark-600 border border-dark-500 text-gray-300 text-sm rounded focus:ring-1 focus:ring-amber-500 resize-none"
                          />
                          <div className="flex gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <input
                                type="number"
                                value={task.estimatedMinutes || 0}
                                onChange={(e) =>
                                  updateTask(groupIndex, taskIndex, {
                                    estimatedMinutes: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-20 px-2 py-1 bg-dark-600 border border-dark-500 text-white text-sm rounded"
                              />
                              <span className="text-xs text-gray-500">min</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <select
                                value={task.assigneeRole || ''}
                                onChange={(e) =>
                                  updateTask(groupIndex, taskIndex, {
                                    assigneeRole: e.target.value || undefined,
                                  })
                                }
                                className="px-2 py-1 bg-dark-600 border border-dark-500 text-white text-sm rounded"
                              >
                                <option value="">Nessun ruolo</option>
                                <option value="developer">Developer</option>
                                <option value="designer">Designer</option>
                                <option value="pm">PM</option>
                                <option value="devops">DevOps</option>
                                <option value="qa">QA</option>
                              </select>
                            </div>
                            {task.isMilestone && (
                              <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded">
                                Milestone
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeTask(groupIndex, taskIndex)}
                          className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addTask(groupIndex)}
                      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-dark-600 text-gray-400 rounded-lg hover:border-dark-500 hover:text-white transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Aggiungi Task
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => {
                setGeneratedResult(null);
                setEditedTaskGroups([]);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna alla descrizione
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/orchestration')}
                className="px-4 py-2 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !projectName.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Crea Progetto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
