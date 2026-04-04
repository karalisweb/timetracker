import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';

const APP_VERSION = '1.4.0';

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
      if (!result.requiresTwoFactor) {
        navigate('/');
      }
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

  // Stile input condiviso
  const inputStyle = {
    background: '#1a2d44',
    border: '1px solid #2a2a35',
    color: '#f5f5f7',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#d4a726';
    e.target.style.boxShadow = '0 0 0 3px rgba(212, 167, 38, 0.1)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#2a2a35';
    e.target.style.boxShadow = 'none';
  };

  const buttonHoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!(e.target as HTMLButtonElement).disabled) {
      (e.target as HTMLElement).style.transform = 'translateY(-2px)';
      (e.target as HTMLElement).style.boxShadow = '0 4px 12px rgba(212, 167, 38, 0.3)';
    }
  };

  const buttonHoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.target as HTMLElement).style.transform = 'translateY(0)';
    (e.target as HTMLElement).style.boxShadow = 'none';
  };

  // Box container condiviso
  const boxStyle = {
    background: '#132032',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  };

  // Form verifica OTP per 2FA
  if (twoFactorState?.required) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d1521' }}>
        <div
          className="w-full max-w-[380px] rounded-xl py-10 px-8"
          style={boxStyle}
        >
          {/* Icona OTP */}
          <div className="flex items-center justify-center mb-6">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: 'rgba(212, 167, 38, 0.2)' }}
            >
              <Mail className="h-6 w-6" style={{ color: '#d4a726' }} />
            </div>
          </div>

          {/* Titolo con gradiente */}
          <h1
            className="text-center text-[1.75rem] font-semibold mb-1"
            style={{
              background: 'linear-gradient(135deg, #d4a726, #2d7d9a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Verifica in due passaggi
          </h1>
          <p className="text-center text-[0.85rem] mb-8" style={{ color: '#a1a1aa' }}>
            Inserisci il codice inviato a{' '}
            <span className="font-medium" style={{ color: '#d4a726' }}>{twoFactorState.otpEmail}</span>
          </p>

          {error && (
            <div className="text-sm text-center mb-4" style={{ color: '#ef4444' }}>{error}</div>
          )}

          <p className="text-sm text-center mb-6" style={{ color: '#a1a1aa' }}>
            Abbiamo inviato un codice a 6 cifre alla tua email. Il codice è valido per 10 minuti.
          </p>

          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>
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
                className="w-full px-4 py-3 rounded-lg text-center text-xl tracking-widest font-mono focus:outline-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3 px-4 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #d4a726, #ff8f65)' }}
              onMouseOver={buttonHoverIn}
              onMouseOut={buttonHoverOut}
            >
              {isLoading ? 'Verifica in corso...' : 'Verifica e accedi'}
            </button>
          </form>

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #2a2a35' }}>
            <button
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center transition-colors text-sm"
              style={{ color: '#a1a1aa' }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#d4a726')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#a1a1aa')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form login — stile PMI Karalisweb (stretto e lungo, ombra leggera)
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d1521' }}>
      <div
        className="w-full max-w-[380px] rounded-xl py-10 px-8"
        style={boxStyle}
      >
        {/* Logo giallo Karalisweb */}
        <div className="flex justify-center mb-6">
          <img
            src="/logo-kw-giallo.png"
            alt="Karalisweb"
            className="h-auto"
            style={{ maxWidth: '160px' }}
          />
        </div>

        {/* Titolo app con gradiente */}
        <h1
          className="text-center text-[1.75rem] font-semibold mb-1"
          style={{
            background: 'linear-gradient(135deg, #d4a726, #2d7d9a)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          KW Time Report
        </h1>

        {/* Descrizione + versione */}
        <p className="text-center text-[0.85rem] mb-8" style={{ color: '#a1a1aa' }}>
          Gestione Ore e Presenze&nbsp;&nbsp;|&nbsp;&nbsp;v{APP_VERSION}
        </p>

        {error && (
          <div className="text-sm text-center mb-4" style={{ color: '#ef4444' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#a1a1aa' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="nome@karalisweb.net"
            />
          </div>

          {/* Password — label + "Password dimenticata?" sulla stessa riga */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="text-sm font-medium" style={{ color: '#a1a1aa' }}>
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs transition-colors"
                style={{ color: '#a1a1aa' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#d4a726')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#a1a1aa')}
              >
                Password dimenticata?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:outline-none transition-all"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="••••••••"
            />
          </div>

          {/* Pulsante Accedi */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            style={{ background: 'linear-gradient(135deg, #d4a726, #ff8f65)' }}
            onMouseOver={buttonHoverIn}
            onMouseOut={buttonHoverOut}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accesso in corso...
              </span>
            ) : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
