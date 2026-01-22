import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Settings as SettingsIcon, User, Lock, Check, AlertCircle, Shield, Mail } from 'lucide-react';

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

  // 2FA form
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [twoFactorEmail, setTwoFactorEmail] = useState(user?.twoFactorEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [isTwoFactorSubmitting, setIsTwoFactorSubmitting] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);

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

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');
    setTwoFactorSuccess('');

    // Validazione email 2FA se specificata
    if (twoFactorEnabled && twoFactorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(twoFactorEmail)) {
      setTwoFactorError('Inserisci un\'email valida per ricevere i codici OTP');
      return;
    }

    setIsTwoFactorSubmitting(true);
    try {
      const response = await authApi.updateTwoFactor({
        twoFactorEnabled,
        twoFactorEmail: twoFactorEmail || undefined
      });

      if (twoFactorEnabled) {
        setTwoFactorSuccess(response.message || 'Codice OTP inviato. Verifica per completare l\'attivazione.');
        setShowOtpVerification(true);
      } else {
        setTwoFactorSuccess('Autenticazione a due fattori disattivata');
        setShowOtpVerification(false);
      }
      refreshUser();
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.message || 'Errore durante l\'aggiornamento');
    } finally {
      setIsTwoFactorSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError('');

    if (!otpCode || otpCode.length !== 6) {
      setTwoFactorError('Inserisci il codice a 6 cifre');
      return;
    }

    setIsTwoFactorSubmitting(true);
    try {
      await authApi.verifyTwoFactorSetup(otpCode);
      setTwoFactorSuccess('Autenticazione a due fattori attivata con successo!');
      setShowOtpVerification(false);
      setOtpCode('');
      refreshUser();
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.message || 'Codice non valido');
    } finally {
      setIsTwoFactorSubmitting(false);
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

      {/* Security Tab - 2FA */}
      {activeTab === 'security' && (
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Autenticazione a due fattori (2FA)</h3>
          <p className="text-gray-400 text-sm mb-6">
            Aggiungi un livello di sicurezza extra al tuo account. Quando attiva, ti verrà richiesto
            un codice OTP via email ogni volta che effettui il login.
          </p>

          {twoFactorSuccess && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center text-green-400">
              <Check className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{twoFactorSuccess}</span>
            </div>
          )}

          {twoFactorError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{twoFactorError}</span>
            </div>
          )}

          {/* Status attuale */}
          <div className="mb-6 p-4 bg-dark-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className={`h-5 w-5 mr-3 ${user?.twoFactorEnabled ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-white font-medium">
                    {user?.twoFactorEnabled ? '2FA Attiva' : '2FA Non attiva'}
                  </p>
                  {user?.twoFactorEnabled && user?.twoFactorEmail && (
                    <p className="text-sm text-gray-400">
                      Codici inviati a: {user.twoFactorEmail}
                    </p>
                  )}
                  {user?.twoFactorEnabled && !user?.twoFactorEmail && (
                    <p className="text-sm text-gray-400">
                      Codici inviati a: {user?.email}
                    </p>
                  )}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                user?.twoFactorEnabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {user?.twoFactorEnabled ? 'Attiva' : 'Disattiva'}
              </span>
            </div>
          </div>

          {/* Form OTP verification se richiesto */}
          {showOtpVerification && (
            <form onSubmit={handleVerifyOtp} className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start mb-4">
                <Mail className="h-5 w-5 text-amber-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium">Verifica il tuo codice OTP</p>
                  <p className="text-sm text-gray-400">
                    Abbiamo inviato un codice a 6 cifre alla tua email. Inseriscilo per confermare l'attivazione.
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isTwoFactorSubmitting || otpCode.length !== 6}
                  className="px-4 py-2 bg-gradient-brand text-white rounded-full hover:bg-gradient-brand-hover disabled:opacity-50 font-semibold transition-all shadow-lg"
                >
                  Verifica
                </button>
              </div>
            </form>
          )}

          {/* Form configurazione 2FA */}
          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <div>
                <label className="text-white font-medium">
                  {twoFactorEnabled ? 'Disattiva 2FA' : 'Attiva 2FA'}
                </label>
                <p className="text-sm text-gray-400">
                  {twoFactorEnabled
                    ? 'Rimuovi il secondo fattore di autenticazione'
                    : 'Proteggi il tuo account con un codice OTP via email'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoFactorEnabled ? 'bg-brand-orange' : 'bg-dark-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {twoFactorEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email per codici OTP (opzionale)
                </label>
                <input
                  type="email"
                  value={twoFactorEmail}
                  onChange={(e) => setTwoFactorEmail(e.target.value)}
                  placeholder={user?.email}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lascia vuoto per usare la tua email principale ({user?.email})
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-dark-700">
              <button
                type="submit"
                disabled={isTwoFactorSubmitting}
                className="px-4 py-2 bg-gradient-brand text-white rounded-full hover:bg-gradient-brand-hover disabled:opacity-50 font-semibold transition-all shadow-lg"
              >
                {isTwoFactorSubmitting
                  ? 'Salvataggio...'
                  : twoFactorEnabled
                    ? 'Attiva 2FA'
                    : 'Disattiva 2FA'}
              </button>
            </div>
          </form>
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
