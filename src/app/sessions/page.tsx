'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Session { id: string; title: string; surgery_type: string; date: string; surgeon_name: string; source_count: number; created_at: string; }

const SOURCE_LABELS: Record<string, { zh: string; en: string; icon: string }> = {
  ai_glasses: { zh: 'AI 眼鏡', en: 'AI Glasses', icon: '👓' },
  laparoscope: { zh: '腹腔鏡', en: 'Laparoscope', icon: '🔬' },
  microscope: { zh: '手術顯微鏡', en: 'Microscope', icon: '🔭' },
  endoscope: { zh: '內視鏡', en: 'Endoscope', icon: '📷' },
  room_camera: { zh: '手術室全景', en: 'Room Camera', icon: '🎥' },
  fluorescence: { zh: '螢光鏡 (ICG)', en: 'Fluorescence (ICG)', icon: '💚' },
  other: { zh: '其他', en: 'Other', icon: '📹' },
};

export { SOURCE_LABELS };

export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === 'en';
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetch('/api/sessions').then(r => r.json()).then(d => setSessions(d.sessions || [])).catch(() => {});
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{isEn ? 'Surgical Sessions' : '手術案例'}</h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">{isEn ? 'Multi-source video recordings organized by surgical case' : '依手術案例整合多鏡頭影像來源'}</p>
          </div>
          <Link href="/sessions/new" className="px-4 py-2 btn-primary rounded-lg text-sm  transition">
            + {isEn ? 'New Session' : '新增案例'}
          </Link>
        </div>

        {sessions.length === 0 ? (
          <div className="card rounded-xl border p-16 text-center">
            <p className="text-4xl mb-4">🎬</p>
            <p className="text-[var(--text-tertiary)] text-lg mb-2">{isEn ? 'No surgical sessions yet' : '尚無手術案例'}</p>
            <p className="text-[var(--text-tertiary)] text-sm mb-6">{isEn ? 'Create a session to combine multiple camera sources from the same surgery' : '建立案例以整合同一台手術的多個鏡頭來源'}</p>
            <Link href="/sessions/new" className="px-6 py-2 btn-primary rounded-lg text-sm ">
              {isEn ? 'Create First Session' : '建立第一個案例'}
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {sessions.map(s => (
              <Link key={s.id} href={`/sessions/${s.id}`} className="card rounded-xl border p-5 hover:shadow-lg transition group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold group-hover:text-[var(--cyan)] transition">{s.title}</h3>
                  <span className="text-xs bg-blue-100 text-[var(--cyan-bright)] px-2 py-0.5 rounded-full">{s.source_count} {isEn ? 'sources' : '個來源'}</span>
                </div>
                <p className="text-sm text-[var(--text-tertiary)] mb-2">{s.surgeon_name} · {s.surgery_type || (isEn ? 'Unclassified' : '未分類')}</p>
                <div className="text-xs text-[var(--text-tertiary)]">{s.date || new Date(s.created_at).toLocaleDateString('zh-TW')}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
