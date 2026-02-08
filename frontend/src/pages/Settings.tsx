import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Settings as SettingsIcon, User, Lock, Check, AlertCircle, Shield, Mail, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // 2FA - Stile CashFlow: enable one-click, disable con password
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Il nome è obbligatorio');
      return;
    }

    setIsProfileSubmitting(true);
    try {
      await authApi.updateProfile({ name: name.trim() });
      setProfileSuccess('Profilo aggiornato con successo');
      refreshUser();
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Errore durante l\'aggiornamento');
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Inserisci la password attuale');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nuova password deve avere almeno 6 caratteri');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Le password non coincidono');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      await authApi.updateProfile({
        password: newPassword,
        currentPassword
      });
      setPasswordSuccess('Password aggiornata con successo');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Errore durante l\'aggiornamento');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const handleEnable2FA = async () => {
    setSecurityLoading(true);
    setSecurityError('');
    setSecuritySuccess('');

    try {
      const data = await authApi.enable2FA();
      if (data.success) {
        setSecuritySuccess('2FA attivato con successo. Riceverai un codice via email ad ogni accesso.');
        refreshUser();
      } else {
        setSecurityError(data.message || 'Errore durante l\'attivazione');
      }
    } catch (err: any) {
      setSecurityError(err.response?.data?.message || 'Errore di connessione');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setSecurityError('Inserisci la password per confermare');
      return;
    }

    setSecurityLoading(true);
    setSecurityError('');
    setSecuritySuccess('');

    try {
      const data = await authApi.disable2FA(disablePassword);
      if (data.success) {
        setSecuritySuccess('2FA disattivato.');
        setShowDisableConfirm(false);
        setDisablePassword('');
        refreshUser();
      } else {
        setSecurityError(data.message || 'Errore durante la disattivazione');
      }
    } catch (err: any) {
      setSecurityError(err.response?.data?.message || 'Errore di connessione');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <SettingsIcon className="h-7 w-7 mr-3 text-gray-400" />
          Impostazioni
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Gestisci il tuo profilo e le preferenze
        </p>
      </div>

      {/* User info card */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <User className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
            <p className="text-gray-400">{user?.email}</p>
            <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user?.roles?.includes('admin')
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {user?.roles?.includes('admin') ? 'Amministratore' : 'Collaboratore'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-dark-800 rounded-lg p-1 border border-dark-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <User className="h-4 w-4 inline mr-2" />
          Profilo
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'password'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Lock className="h-4 w-4 inline mr-2" />
          Password
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? 'bg-gradient-brand text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="h-4 w-4 inline mr-2" />
          Sicurezza
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Modifica profilo</h3>

          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center text-green-400">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-gray-500 rounded-lg cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email non può essere modificata
              </p>
            </div>

            <div className="pt-4 border-t border-dark-700">
              <button
                type="submit"
                disabled={isProfileSubmitting}
                className="px-4 py-2 bg-gradient-brand text-white rounded-full hover:bg-gradient-brand-hover disabled:opacity-50 font-semibold transition-all shadow-lg"
              >
                {isProfileSubmitting ? 'Salvataggio...' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cambia password</h3>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center text-green-400">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password attuale
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nuova password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimo 6 caratteri
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Conferma nuova password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="pt-4 border-t border-dark-700">
              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="px-4 py-2 bg-gradient-brand text-white rounded-full hover:bg-gradient-brand-hover disabled:opacity-50 font-semibold transition-all shadow-lg"
              >
                {isPasswordSubmitting ? 'Aggiornamento...' : 'Aggiorna password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab - 2FA (Stile CashFlow: one-click enable, password-confirm disable) */}
      {activeTab === 'security' && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Autenticazione a due fattori (2FA)</h3>
          <p className="text-gray-400 text-sm mb-6">
            Aggiungi un livello di sicurezza extra al tuo account. Quando attiva, ti verrà richiesto
            un codice OTP via email ogni volta che effettui il login.
          </p>

          {securitySuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center text-green-400">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{securitySuccess}</span>
            </div>
          )}

          {securityError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{securityError}</span>
            </div>
          )}

          {/* 2FA Status Card */}
          <div className="mb-4 p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  user?.twoFactorEnabled ? 'bg-green-500/20' : 'bg-dark-600'
                }`}>
                  <Shield className={`h-5 w-5 ${user?.twoFactorEnabled ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">
                    2FA {user?.twoFactorEnabled ? 'Attiva' : 'Non attiva'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {user?.twoFactorEnabled
                      ? `Codici inviati a: ${user?.email}`
                      : 'Proteggi il tuo account con la verifica in due passaggi'}
                  </p>
                </div>
              </div>
              {!user?.twoFactorEnabled && (
                <button
                  onClick={handleEnable2FA}
                  disabled={securityLoading}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-all"
                  style={{ background: 'linear-gradient(135deg, #d4a726, #ff8f65)' }}
                >
                  {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Attiva'}
                </button>
              )}
            </div>
          </div>

          {/* Come funziona - solo se 2FA non attivo */}
          {!user?.twoFactorEnabled && (
            <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(45, 125, 154, 0.1)', border: '1px solid rgba(45, 125, 154, 0.3)' }}>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5" style={{ color: '#2d7d9a' }} />
                <div>
                  <p className="font-medium" style={{ color: '#2d7d9a' }}>Come funziona</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Ogni volta che effettui il login, riceverai un codice a 6 cifre via email.
                    Il codice è valido per 10 minuti e può essere usato una sola volta.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disattiva 2FA - Pulsante per mostrare conferma */}
          {user?.twoFactorEnabled && !showDisableConfirm && (
            <div className="mb-4 p-4 bg-dark-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Disattiva 2FA</p>
                  <p className="text-sm text-gray-400">Rimuovi il secondo fattore di autenticazione</p>
                </div>
                <button
                  onClick={() => setShowDisableConfirm(true)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
                  style={{ color: '#a1a1aa', borderColor: '#2a2a35' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a35';
                    e.currentTarget.style.color = '#a1a1aa';
                  }}
                >
                  Disattiva
                </button>
              </div>
            </div>
          )}

          {/* Conferma disattivazione con password */}
          {user?.twoFactorEnabled && showDisableConfirm && (
            <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <p className="font-medium text-red-400 mb-2">Conferma disattivazione</p>
              <p className="text-sm text-gray-400 mb-4">
                Inserisci la tua password per confermare la disattivazione del 2FA.
                Il tuo account sarà meno protetto.
              </p>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 mb-3 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDisable2FA}
                  disabled={securityLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conferma disattivazione'}
                </button>
                <button
                  onClick={() => {
                    setShowDisableConfirm(false);
                    setDisablePassword('');
                    setSecurityError('');
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: '#a1a1aa' }}
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info card */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Configurazione lavoro</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Orario:</span>
            <span className="ml-2 text-white">{user?.workStartTime} - {user?.workEndTime}</span>
          </div>
          <div>
            <span className="text-gray-500">Target giornaliero:</span>
            <span className="ml-2 text-white">
              {Math.floor((user?.dailyTargetMinutes || 480) / 60)}h {(user?.dailyTargetMinutes || 480) % 60}m
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Per modificare queste impostazioni, contatta un amministratore.
        </p>
      </div>

      {/* App version */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">
          Time Report v2.2
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Karalisweb
        </p>
      </div>
    </div>
  );
}
