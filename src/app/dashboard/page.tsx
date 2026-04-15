'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

interface Video {
  id: string; title: string; surgery_type: string; processing_status: string;
  created_at: string; surgeon_name: string; difficulty: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale, t } = useLocale();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const isEn = locale === 'en';

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);
  useEffect(() => { if (user) fetch('/api/videos').then(r => r.json()).then(d => setVideos(d.videos || [])); }, [user]);

  if (authLoading || !user) return null;

  const completed = videos.filter(v => v.processing_status === 'completed').length;
  const pending = videos.filter(v => v.processing_status !== 'completed').length;

  const stats = [
    { label: isEn ? 'Total Videos' : '影片總數', value: videos.length, color: 'var(--cyan)', d: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { label: isEn ? 'Processed' : '已處理', value: completed, color: 'var(--emerald)', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: isEn ? 'Pending' : '待處理', value: pending, color: 'var(--amber)', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: isEn ? 'Learning Hours' : '學習時數', value: `${Math.round(videos.length * 0.5)}h`, color: 'var(--violet)', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ];

  const actions = [
    { href: '/videos/upload', title: isEn ? 'Upload Video' : '上傳影片', desc: isEn ? 'AI auto-transcribe & generate' : 'AI 自動轉譯、標註、生成教案', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(59,130,246,0.12) 100%)', borderColor: 'rgba(6,182,212,0.2)', iconColor: 'var(--cyan)', d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { href: '/sessions/new', title: isEn ? 'New Case' : '新增案例', desc: isEn ? 'Multi-camera integration' : '整合多鏡頭影像來源', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.12) 100%)', borderColor: 'rgba(16,185,129,0.2)', iconColor: 'var(--emerald)', d: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { href: '/knowledge', title: isEn ? 'Knowledge Base' : '手術知識庫', desc: isEn ? 'Procedures, anatomy, instruments' : '術式、步驟、解剖與器械', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.12) 100%)', borderColor: 'rgba(139,92,246,0.2)', iconColor: 'var(--violet)', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Decorative orbs */}
        <div className="glow-orb glow-orb-cyan w-96 h-96 -top-48 -right-48" style={{ position: 'absolute' }} />
        <div className="glow-orb glow-orb-violet w-64 h-64 top-1/2 -left-32" style={{ position: 'absolute' }} />

        {/* Welcome */}
        <div className="mb-8 animate-fade-in relative">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%)', boxShadow: '0 0 20px rgba(6,182,212,0.2)' }}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.welcome')}，<span className="gradient-text">{user.name}</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {user.role === 'surgeon' ? (isEn ? 'Surgeon' : '主刀醫師') : (isEn ? 'Trainee' : '學員')}
                {videos.length > 0 && ` \u00B7 ${videos.length} ${isEn ? 'videos' : '部影片'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="card p-5" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}>
                  <svg className="w-5 h-5" style={{ color: stat.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.d} />
                  </svg>
                </div>
                <span className="text-2xl font-bold stat-number" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
          {isEn ? 'Quick Actions' : '快速操作'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {actions.map((a, i) => (
            <Link key={i} href={a.href}
              className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{ background: a.gradient, border: `1px solid ${a.borderColor}` }}>
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 0 40px ${a.borderColor}` }} />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${a.iconColor}15`, border: `1px solid ${a.iconColor}25` }}>
                  <svg className="w-6 h-6" style={{ color: a.iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={a.d} />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Videos */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            {isEn ? 'Recent Videos' : '最近影片'}
          </p>
          {videos.length > 0 && (
            <Link href="/videos" className="text-xs font-medium transition" style={{ color: 'var(--cyan)' }}>
              {isEn ? 'View all' : '查看全部'} &rarr;
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid var(--border)' }}>
              <svg className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>{t('video.list.empty')}</p>
            <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-tertiary)' }}>{isEn ? 'Upload your first surgical video' : '上傳您的第一部手術影片'}</p>
            <Link href="/videos/upload" className="inline-block btn-primary px-6 py-2.5 text-sm">{isEn ? 'Upload Video' : '上傳影片'}</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.slice(0, 5).map(video => (
              <Link key={video.id} href={`/videos/${video.id}`} className="card card-interactive flex items-center justify-between p-4 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid var(--border)' }}>
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold group-hover:text-cyan-300 transition" style={{ color: 'var(--text-primary)' }}>{video.title}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {video.surgery_type ? t(`video.surgeryTypes.${video.surgery_type}`) : ''} · {new Date(video.created_at).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                </div>
                <StatusBadge status={video.processing_status} t={t} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const cfg: Record<string, { color: string; bg: string }> = {
    pending: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)' },
    processing: { color: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
    completed: { color: 'var(--emerald)', bg: 'rgba(16,185,129,0.1)' },
    failed: { color: 'var(--rose)', bg: 'rgba(244,63,94,0.1)' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}20` }}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'processing' ? 'animate-pulse' : ''}`} style={{ background: c.color }} />
      {t(`video.status.${status}`)}
    </span>
  );
}
