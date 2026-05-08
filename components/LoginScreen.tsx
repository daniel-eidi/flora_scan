import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSubmit: (token: string) => Promise<boolean>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSubmit }) => {
  const [token, setToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    setSubmitting(true);
    setError(null);
    const ok = await onSubmit(token.trim());
    if (!ok) {
      setError('Token inválido. Verifique e tente novamente.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50 shadow-2xl overflow-hidden">
      <header className="bg-emerald-800 text-white p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">BioScan AI</h1>
            <p className="text-emerald-100 text-xs">Seu guia botânico portátil</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-5 border border-gray-100"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-full">
              <Lock size={24} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Acesso Restrito</h2>
            <p className="text-sm text-gray-500 text-center">
              Insira seu token de acesso para continuar.
            </p>
          </div>

          <div>
            <label htmlFor="token" className="block text-xs font-semibold text-gray-600 mb-1">
              Token
            </label>
            <input
              id="token"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm disabled:opacity-50"
              placeholder="Digite o token"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !token.trim()}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {submitting ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default LoginScreen;
