import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertCircle, Shield, ArrowLeft, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, verifyLoginOtp, cancelTwoFactor, twoFactorState } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      // Se non richiede 2FA, naviga alla home
      if (!result.requiresTwoFactor) {
        navigate('/');
      }
      // Altrimenti mostra il form OTP (gestito da twoFactorState)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenziali non valide');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Inserisci il codice a 6 cifre');
      return;
    }

    setIsLoading(true);
    try {
      await verifyLoginOtp(otpCode);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Codice non valido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    cancelTwoFactor();
    setOtpCode('');
    setError('');
  };

  // Form verifica OTP per 2FA
  if (twoFactorState?.required) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">Verifica in due passaggi</h1>
            <p className="text-gray-400 mt-2">
              Inserisci il codice inviato a<br />
              <span className="text-amber-400 font-medium">{twoFactorState.otpEmail}</span>
            </p>
          </div>

          <div className="bg-dark-800 rounded-xl border border-dark-700 p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-400">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-300">
                  Abbiamo inviato un codice a 6 cifre alla tua email.
                  Il codice è valido per 10 minuti.
                </p>
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-1">
                  Codice OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 text-white rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-dark-500"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-2.5 px-4 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Verifica in corso...' : 'Verifica e accedi'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-dark-700">
              <button
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna al login
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Karalisweb - Time Report v1.0
          </p>
        </div>
      </div>
    );
  }

  // Form login normale
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Time Report</h1>
          <p className="text-gray-400 mt-2">Accedi per registrare le tue ore</p>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-dark-500"
                placeholder="nome@azienda.it"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-dark-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-amber-500 hover:text-amber-400">
              Password dimenticata?
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Karalisweb - Time Report v1.0
        </p>
      </div>
    </div>
  );
}
