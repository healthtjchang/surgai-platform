'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useLocale } from '@/lib/locale-context';
import { useAuth } from '@/lib/auth-context';

const FEATURE_ICONS = [
  'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
];

const STEP_ICONS = [
  'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
];

export default function LandingPage() {
  const { locale, t } = useLocale();
  const { user } = useAuth();
  const isEn = locale === 'en';

  const featureColors = ['var(--cyan)', 'var(--violet)', 'var(--emerald)', 'var(--rose)'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />

      {/* === HERO === */}
      <section className="relative overflow-hidden grid-bg" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Decorative orbs */}
        <div className="glow-orb glow-orb-cyan" style={{ width: 600, height: 600, top: -200, right: -100, position: 'absolute', opacity: 0.12 }} />
        <div className="glow-orb glow-orb-violet" style={{ width: 400, height: 400, bottom: -100, left: -50, position: 'absolute', opacity: 0.1 }} />
        <div className="glow-orb glow-orb-blue" style={{ width: 300, height: 300, top: '40%', left: '60%', position: 'absolute', opacity: 0.06 }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-10"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: 'var(--cyan-bright)' }}>
              <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: 'var(--cyan)' }} />
              AI-Powered Surgical Intelligence
            </div>

            {/* Title */}
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              <span className="gradient-text-glow">{t('landing.hero.title')}</span>
            </h1>

            <p className="text-xl lg:text-2xl mb-4 font-light" style={{ color: 'var(--text-secondary)' }}>
              {t('landing.hero.subtitle')}
            </p>
            <p className="text-base mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {t('landing.hero.description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? '/dashboard' : '/register'}
                className="btn-primary px-8 py-4 text-base rounded-xl inline-flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('landing.hero.cta')}
              </Link>
              <Link href="/knowledge"
                className="btn-ghost px-8 py-4 text-base rounded-xl inline-flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {isEn ? 'Explore Knowledge' : '探索知識庫'}
              </Link>
            </div>
          </div>
        </div>
        <div className="neon-line absolute bottom-0 left-0 right-0" />
      </section>

      {/* === STATS === */}
      <section className="py-20 relative" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-accent)' }}>
            {t('landing.stats.title')}
          </h2>
          <p className="text-center mb-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {isEn ? 'Why Taiwan needs SurgAI now' : '為什麼台灣現在就需要 SurgAI'}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: '79%', label: t('landing.stats.criminal'), color: 'var(--rose)' },
              { value: '5', label: t('landing.stats.shortage'), color: 'var(--amber)' },
              { value: '51.5', label: t('landing.stats.aging'), color: 'var(--violet)' },
              { value: '70.4h', label: t('landing.stats.time'), color: 'var(--cyan)' },
            ].map((s, i) => (
              <div key={i} className="card p-6 text-center">
                <div className="text-3xl font-bold stat-number mb-2" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section className="py-20 grid-bg relative">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('landing.features.title')}
          </h2>
          <p className="text-center mb-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {isEn ? 'Revolutionary features built for surgeons' : '專為外科醫師打造的革命性功能'}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {(['autoRecord', 'aiTeaching', 'interactive', 'legal'] as const).map((key, i) => (
              <div key={key} className="card card-interactive p-7">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${featureColors[i]}12`, border: `1px solid ${featureColors[i]}25` }}>
                  <svg className="w-6 h-6" style={{ color: featureColors[i] }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={FEATURE_ICONS[i]} />
                  </svg>
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t(`landing.features.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  {t(`landing.features.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === WORKFLOW === */}
      <section className="py-20" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3" style={{ color: 'var(--text-primary)' }}>
            {isEn ? 'How It Works' : '運作流程'}
          </h2>
          <p className="text-center mb-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {isEn ? 'From recording to learning, fully automated by AI' : '從手術錄影到教學資源，全程 AI 自動處理'}
          </p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: isEn ? 'Upload' : '上傳影片', desc: isEn ? 'Upload video or sync from AI glasses' : '上傳手術錄影或從 AI 眼鏡同步' },
              { step: '02', title: isEn ? 'AI Process' : 'AI 處理', desc: isEn ? 'Auto transcribe, segment, annotate' : '語音轉文字、自動分段、標註' },
              { step: '03', title: isEn ? 'Review' : '醫師審閱', desc: isEn ? '5-min review and correct' : '5 分鐘內完成審閱和修正' },
              { step: '04', title: isEn ? 'Learn' : '學員學習', desc: isEn ? 'Interactive playback + AI Q&A' : '互動式播放、AI 問答、技能追蹤' },
            ].map((item, i) => (
              <div key={i} className="text-center relative">
                {i < 3 && <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px" style={{ background: 'linear-gradient(90deg, var(--border-bright), transparent)' }} />}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 relative z-10"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <svg className="w-6 h-6" style={{ color: 'var(--cyan)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={STEP_ICONS[i]} />
                  </svg>
                </div>
                <div className="text-[10px] font-mono mb-2 tracking-widest" style={{ color: 'var(--cyan)' }}>STEP {item.step}</div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="py-24 relative overflow-hidden grid-bg">
        <div className="glow-orb glow-orb-cyan" style={{ width: 500, height: 500, top: -200, left: '30%', position: 'absolute', opacity: 0.08 }} />
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            <span className="gradient-text">{isEn ? 'Start Using SurgAI' : '開始使用 SurgAI'}</span>
          </h2>
          <p className="text-base mb-10 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
            {isEn ? 'Every surgery is a valuable teaching resource. Let AI record, organize, and share — automatically.' : '每一台手術都是寶貴的教學資源。讓 AI 幫你自動記錄、整理、分享。'}
          </p>
          <Link href={user ? '/dashboard' : '/register'}
            className="btn-primary px-10 py-4 text-base rounded-xl inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isEn ? 'Get Started Free' : '免費開始'}
          </Link>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="py-12" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--cyan), var(--blue))' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Surg<span style={{ color: 'var(--cyan-bright)' }}>AI</span></span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>AI-Powered Surgical Video Intelligence Platform</p>
          <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}>&copy; 2026 SurgAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
