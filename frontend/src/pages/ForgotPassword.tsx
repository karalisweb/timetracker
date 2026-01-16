import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState(''); // Solo per dev

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await authApi.forgotPassword(email);
      setSuccess(true);
      // In dev, il backend restituisce il link direttamente
      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Si è verificato un errore');
    } finally {
      setIsLoading(false);
    }
  };

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
              <h2 className="text-xl font-semibold text-gray-100 mb-2">Email inviata!</h2>
              <p className="text-gray-400 mb-6">
                Se l'indirizzo email è associato a un account, riceverai un link per reimpostare la password.
              </p>

              {/* Link visibile solo in dev */}
              {resetLink && (
                <div className="mb-6 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <p className="text-amber-400 text-sm mb-2">Link di reset (solo in dev):</p>
                  <Link
                    to={resetLink.replace('http://localhost:5173', '')}
                    className="text-amber-500 hover:text-amber-400 text-sm break-all"
                  >
                    {resetLink}
                  </Link>
                </div>
              )}

              <Link
                to="/login"
                className="text-amber-500 hover:text-amber-400 font-medium"
              >
                Torna al login
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
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Password dimenticata?</h2>
          <p className="text-gray-400 mb-6">
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="nome@azienda.it"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Invio in corso...' : 'Invia link di reset'}
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
