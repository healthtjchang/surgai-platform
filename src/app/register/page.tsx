'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';

export default function RegisterPage() {
  const { register } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();
  const isEn = locale === 'en';
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'trainee', accessCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.email, form.password, form.name, form.role, form.accessCode);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-700 to-blue-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)', backgroundSize: '600px 600px' }} />
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-xl font-bold">SurgAI</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight mb-4">{isEn ? 'Join the Future of Surgery' : '加入外科教育的未來'}</h2>
          <p className="text-blue-200 text-lg leading-relaxed">{isEn ? 'Start recording, learning, and teaching with AI today.' : '今天就開始用 AI 錄影、學習、教學。'}</p>
          <div className="mt-8 space-y-3 text-sm">
            {[
              isEn ? 'AI auto-generates teaching materials' : 'AI 自動生成教案，節省 95% 時間',
              isEn ? 'Interactive video Q&A with AI' : '互動式影片 AI 問答',
              isEn ? 'Multi-camera sync player' : '多鏡頭同步播放器',
              isEn ? 'Bilingual terminology glossary' : '中英雙語醫學術語庫',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-blue-100">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-blue-300 relative">&copy; 2026 SurgAI Platform</p>
      </div>

      {/* Right: Form */}
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

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t('auth.registerTitle')}</h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-8">{isEn ? 'Create your account to get started.' : '建立帳號開始使用平台。'}</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-xl mb-5 border border-red-100">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.27 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('auth.name')}</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input" placeholder={isEn ? 'Dr. Jane Smith' : '王大明 醫師'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="input" placeholder="doctor@hospital.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} className="input" placeholder="********" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{t('auth.role')}</label>
              <div className="grid grid-cols-2 gap-3">
                {(['surgeon', 'trainee'] as const).map(role => (
                  <button key={role} type="button" onClick={() => setForm({ ...form, role })}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      form.role === role
                        ? 'bg-[rgba(6,182,212,0.08)] border-2 border-blue-500 text-[var(--cyan-bright)] shadow-sm'
                        : 'border-2 border-[var(--border)] text-[var(--text-secondary)] hover:border-slate-300 hover:bg-[var(--bg-card)]'
                    }`}>
                    <span>{role === 'surgeon' ? '🔬' : '🎓'}</span>
                    {role === 'surgeon' ? t('auth.surgeon') : t('auth.trainee')}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{isEn ? 'Access Code' : '體驗碼'}</label>
              <input type="text" value={form.accessCode} onChange={e => setForm({ ...form, accessCode: e.target.value })} required
                className="input" placeholder={isEn ? 'Enter access code' : '請輸入體驗碼'} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 btn-primary text-sm disabled:opacity-50 disabled:transform-none mt-2">
              {loading ? t('common.loading') : t('auth.registerButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-tertiary)]">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="text-[var(--cyan)] hover:text-[var(--cyan-bright)] font-medium">{t('common.login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
