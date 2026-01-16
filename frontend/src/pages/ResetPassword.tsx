import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token mancante');
        setIsValidating(false);
        return;
      }

      try {
        await authApi.validateResetToken(token);
        setIsValidating(false);
      } catch (err: any) {
        setTokenError(err.response?.data?.message || 'Token non valido');
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifica in corso...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-500">Time Report</h1>
            <p className="mt-2 text-gray-400">by Karalisweb</p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Link non valido</h2>
              <p className="text-gray-400 mb-6">{tokenError}</p>
              <Link
                to="/forgot-password"
                className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
              >
                Richiedi un nuovo link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-500">Time Report</h1>
            <p className="mt-2 text-gray-400">by Karalisweb</p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-900/50 mb-4">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Password aggiornata!</h2>
              <p className="text-gray-400 mb-6">
                La tua password è stata reimpostata con successo. Ora puoi accedere con la nuova password.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors"
              >
                Vai al login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-500">Time Report</h1>
          <p className="mt-2 text-gray-400">by Karalisweb</p>
        </div>

        <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Reimposta password</h2>
          <p className="text-gray-400 mb-6">
            Inserisci la tua nuova password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Nuova password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Minimo 6 caratteri"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Conferma password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ripeti la password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvataggio...' : 'Reimposta password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-amber-500 hover:text-amber-400 text-sm">
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
