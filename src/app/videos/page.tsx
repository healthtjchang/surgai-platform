'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';

interface Video {
  id: string; title: string; surgery_type: string; processing_status: string;
  created_at: string; surgeon_name: string; difficulty: string; duration: number;
}

export default function VideosPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [videos, setVideos] = useState<Video[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/videos').then(r => r.json()).then(d => setVideos(d.videos || [])).catch(() => {});
  }, []);

  const filtered = filter === 'all' ? videos : videos.filter(v => v.surgery_type === filter);
  const types = [...new Set(videos.map(v => v.surgery_type).filter(Boolean))];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('video.list.title')}</h1>
          {user && (
            <Link href="/videos/upload" className="px-6 py-2 btn-primary rounded-lg  transition text-sm">
              + {t('common.upload')}
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${filter === 'all' ? 'btn-primary' : 'bg-[var(--bg-card)] border hover:bg-[var(--bg-base)]'}`}>
            {t('video.list.all')} ({videos.length})
          </button>
          {types.map(type => (
            <button key={type} onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${filter === type ? 'btn-primary' : 'bg-[var(--bg-card)] border hover:bg-[var(--bg-base)]'}`}>
              {t(`video.surgeryTypes.${type}`) || type} ({videos.filter(v => v.surgery_type === type).length})
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {filtered.length === 0 ? (
          <div className="card rounded-xl border p-16 text-center">
            <p className="text-4xl mb-4">📹</p>
            <p className="text-[var(--text-tertiary)] text-lg">{t('video.list.empty')}</p>
            {user && (
              <Link href="/videos/upload" className="inline-block mt-4 px-6 py-2 btn-primary rounded-lg">
                {t('dashboard.uploadNew')}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(video => (
              <Link key={video.id} href={`/videos/${video.id}`}
                className="card card-interactive overflow-hidden group">
                <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                  <svg className="w-12 h-12 text-white/20 group-hover:text-white/40 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {video.duration > 0 && (
                    <span className="absolute bottom-2 right-2 text-[11px] bg-black/60 text-white px-2 py-0.5 rounded-md font-mono backdrop-blur-sm">
                      {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                    </span>
                  )}
                  <StatusPill status={video.processing_status} t={t} />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--cyan)] transition mb-1 line-clamp-1">{video.title}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mb-2.5">
                    {video.surgeon_name && `${video.surgeon_name} · `}
                    {video.surgery_type ? t(`video.surgeryTypes.${video.surgery_type}`) : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      video.difficulty === 'beginner' ? 'bg-emerald-50 text-emerald-600' :
                      video.difficulty === 'advanced' ? 'bg-orange-50 text-orange-600' :
                      video.difficulty === 'expert' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>{t(`video.difficulties.${video.difficulty}`)}</span>
                    <span className="text-[11px] text-[var(--text-secondary)]">{new Date(video.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const config: Record<string, string> = {
    completed: 'bg-emerald-500/90',
    processing: 'bg-[rgba(6,182,212,0.08)]0/90 animate-pulse',
    pending: 'bg-amber-500/90',
    failed: 'bg-red-500/90',
  };
  return (
    <span className={`absolute top-2.5 right-2.5 text-[11px] font-medium text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm ${config[status] || 'bg-[var(--bg-card)]0'}`}>
      {t(`video.status.${status}`)}
    </span>
  );
}
