'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';

export default function LoginPage() {
  const { login } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();
  const isEn = locale === 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)', backgroundSize: '600px 600px' }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">SurgAI</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            {isEn ? 'The Future of Surgical Education' : '外科教育的未來'}
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            {isEn
              ? 'AI-powered recording, automatic teaching material generation, and interactive learning — all in one platform.'
              : 'AI 驅動的手術錄影、自動教案生成、互動式學習——全在一個平台。'}
          </p>
          <div className="mt-8 flex gap-6 text-sm text-blue-200">
            <div><span className="text-2xl font-bold text-white block">32+</span>{isEn ? 'API Routes' : '個 API 路由'}</div>
            <div><span className="text-2xl font-bold text-white block">14</span>{isEn ? 'Specialties' : '個外科專科'}</div>
            <div><span className="text-2xl font-bold text-white block">6</span>{isEn ? 'Camera Types' : '種鏡頭來源'}</div>
          </div>
        </div>
        <p className="text-xs text-blue-300 relative">&copy; 2026 SurgAI Platform</p>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <span className="font-bold text-lg text-[var(--text-primary)]">SurgAI</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8">{isEn ? 'Welcome back. Enter your credentials to continue.' : '歡迎回來。請輸入您的帳號密碼。'}</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-5 border border-red-100">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('auth.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="input" placeholder="surgeon@hospital.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('auth.password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="input" placeholder="********" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 btn-primary text-sm disabled:opacity-50 disabled:transform-none">
              {loading ? t('common.loading') : t('auth.loginButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-[var(--cyan)] hover:text-[var(--cyan-bright)] font-medium">{t('common.register')}</Link>
          </p>

          <div className="mt-6 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] text-center">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">{isEn ? 'Demo account' : '試用帳號'}</p>
            <p className="text-xs font-mono text-[var(--text-tertiary)]">surgeon@demo.com / demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
