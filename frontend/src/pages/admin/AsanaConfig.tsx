import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface AsanaConfig {
  accessToken: string | null;
  workspaceId: string | null;
  defaultProjectId: string | null;
  fieldProjectId: string | null;
  fieldChecklistId: string | null;
  webhookSecret: string | null;
  isConfigured: boolean;
}

interface AsanaStatus {
  configured: boolean;
  connected: boolean;
  user: { gid: string; name: string } | null;
  error: string | null;
  config: {
    hasAccessToken: boolean;
    hasWorkspaceId: boolean;
    hasDefaultProject: boolean;
    hasWebhookSecret: boolean;
  };
}

export default function AsanaConfigPage() {
  const [config, setConfig] = useState<AsanaConfig | null>(null);
  const [status, setStatus] = useState<AsanaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    accessToken: '',
    workspaceId: '',
    defaultProjectId: '',
    fieldProjectId: '',
    fieldChecklistId: '',
    webhookSecret: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, statusRes] = await Promise.all([
        adminApi.getAsanaConfig(),
        adminApi.getAsanaStatus(),
      ]);
      setConfig(configRes.data);
      setStatus(statusRes.data);

      // Popola form con valori esistenti (non token/secret mascherati)
      setFormData({
        accessToken: '',
        workspaceId: configRes.data.workspaceId || '',
        defaultProjectId: configRes.data.defaultProjectId || '',
        fieldProjectId: configRes.data.fieldProjectId || '',
        fieldChecklistId: configRes.data.fieldChecklistId || '',
        webhookSecret: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore caricamento configurazione' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Invia solo campi non vuoti
      const dataToSend: any = {};
      if (formData.accessToken) dataToSend.accessToken = formData.accessToken;
      if (formData.workspaceId) dataToSend.workspaceId = formData.workspaceId;
      if (formData.defaultProjectId) dataToSend.defaultProjectId = formData.defaultProjectId;
      if (formData.fieldProjectId) dataToSend.fieldProjectId = formData.fieldProjectId;
      if (formData.fieldChecklistId) dataToSend.fieldChecklistId = formData.fieldChecklistId;
      if (formData.webhookSecret) dataToSend.webhookSecret = formData.webhookSecret;

      await adminApi.updateAsanaConfig(dataToSend);
      setMessage({ type: 'success', text: 'Configurazione salvata con successo' });

      // Ricarica dati
      await loadData();

      // Reset campi sensibili
      setFormData(prev => ({
        ...prev,
        accessToken: '',
        webhookSecret: '',
      }));
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore salvataggio configurazione',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setMessage(null);
      const { data } = await adminApi.testAsanaConnection();

      if (data.success) {
        setMessage({ type: 'success', text: `Connesso come: ${data.user?.name}` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Test connessione fallito' });
      }

      // Ricarica status
      const statusRes = await adminApi.getAsanaStatus();
      setStatus(statusRes.data);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore test connessione',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurazione Asana
        </h1>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Stato Connessione
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              status?.config.hasAccessToken ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div className="text-sm text-gray-600 dark:text-gray-300">Access Token</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              status?.config.hasWorkspaceId ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div className="text-sm text-gray-600 dark:text-gray-300">Workspace ID</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              status?.connected ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <div className="text-sm text-gray-600 dark:text-gray-300">Connessione</div>
          </div>

          <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
              status?.config.hasWebhookSecret ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <div className="text-sm text-gray-600 dark:text-gray-300">Webhook</div>
          </div>
        </div>

        {status?.user && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-green-700 dark:text-green-300">
              Connesso come: <strong>{status.user.name}</strong>
            </span>
          </div>
        )}

        {status?.error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <span className="text-red-700 dark:text-red-300">
              Errore: {status.error}
            </span>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Config Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Credenziali API
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Access Token {config?.accessToken && <span className="text-green-500">(configurato)</span>}
            </label>
            <input
              type="password"
              value={formData.accessToken}
              onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
              placeholder={config?.accessToken ? '••••••••' : 'Inserisci token Asana'}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Personal Access Token da Asana Developer Console
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Workspace ID
            </label>
            <input
              type="text"
              value={formData.workspaceId}
              onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
              placeholder="1234567890123456"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Project ID (opzionale)
            </label>
            <input
              type="text"
              value={formData.defaultProjectId}
              onChange={(e) => setFormData({ ...formData, defaultProjectId: e.target.value })}
              placeholder="1234567890123456"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Progetto Asana dove creare i task per default
            </p>
          </div>
        </div>

        <h3 className="text-md font-semibold text-gray-900 dark:text-white mt-6 mb-4">
          Custom Fields (opzionali)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Project ID
            </label>
            <input
              type="text"
              value={formData.fieldProjectId}
              onChange={(e) => setFormData({ ...formData, fieldProjectId: e.target.value })}
              placeholder="GID del custom field"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field Checklist ID
            </label>
            <input
              type="text"
              value={formData.fieldChecklistId}
              onChange={(e) => setFormData({ ...formData, fieldChecklistId: e.target.value })}
              placeholder="GID del custom field"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <h3 className="text-md font-semibold text-gray-900 dark:text-white mt-6 mb-4">
          Webhook (opzionale)
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Webhook Secret {config?.webhookSecret && <span className="text-green-500">(configurato)</span>}
          </label>
          <input
            type="password"
            value={formData.webhookSecret}
            onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
            placeholder={config?.webhookSecret ? '••••••••' : 'Secret per validare webhook'}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Usato per validare la firma dei webhook Asana
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio...' : 'Salva Configurazione'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing || !status?.config.hasAccessToken}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Test...' : 'Test Connessione'}
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Come ottenere le credenziali Asana
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>Vai su <a href="https://app.asana.com/0/my-apps" target="_blank" rel="noopener noreferrer" className="underline">Asana Developer Console</a></li>
          <li>Crea un nuovo Personal Access Token</li>
          <li>Copia il token e incollalo nel campo "Access Token"</li>
          <li>Per trovare il Workspace ID, vai nelle impostazioni del workspace Asana</li>
          <li>Il Project ID si trova nell'URL del progetto Asana</li>
        </ol>
      </div>
    </div>
  );
}
