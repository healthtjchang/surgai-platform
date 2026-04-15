'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';

const SOURCE_TYPES = [
  { value: 'ai_glasses', zh: '👓 AI 眼鏡（第一人稱）', en: '👓 AI Glasses (1st Person)' },
  { value: 'laparoscope', zh: '🔬 腹腔鏡', en: '🔬 Laparoscope' },
  { value: 'microscope', zh: '🔭 手術顯微鏡', en: '🔭 Surgical Microscope' },
  { value: 'endoscope', zh: '📷 內視鏡', en: '📷 Endoscope' },
  { value: 'room_camera', zh: '🎥 手術室全景', en: '🎥 Room Camera' },
  { value: 'fluorescence', zh: '💚 螢光鏡 (ICG)', en: '💚 Fluorescence (ICG)' },
  { value: 'other', zh: '📹 其他', en: '📹 Other' },
];

interface Video { id: string; title: string; processing_status: string; }
interface SourceEntry { videoId: string; sourceType: string; label: string; offsetMs: number; isPrimary: boolean; }

export default function NewSessionPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === 'en';

  const [title, setTitle] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [sources, setSources] = useState<SourceEntry[]>([{ videoId: '', sourceType: 'ai_glasses', label: '', offsetMs: 0, isPrimary: true }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetch('/api/videos').then(r => r.json()).then(d => setVideos(d.videos || [])).catch(() => {});
  }, [user]);

  const addSource = () => {
    setSources(prev => [...prev, { videoId: '', sourceType: 'laparoscope', label: '', offsetMs: 0, isPrimary: false }]);
  };

  const updateSource = (idx: number, field: string, value: string | number | boolean) => {
    setSources(prev => prev.map((s, i) => {
      if (i !== idx) return field === 'isPrimary' && value === true ? { ...s, isPrimary: false } : s;
      return { ...s, [field]: value };
    }));
  };

  const removeSource = (idx: number) => {
    setSources(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validSources = sources.filter(s => s.videoId);
    if (!title || validSources.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, surgeryType, date, notes, videos: validSources }),
      });
      const data = await res.json();
      router.push(`/sessions/${data.session.id}`);
    } catch { setSaving(false); }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{isEn ? 'New Surgical Session' : '新增手術案例'}</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-8">{isEn ? 'Combine multiple camera sources from the same surgery into one unified case' : '將同一台手術的多個鏡頭影像整合為一個統一案例'}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">{isEn ? 'Case Information' : '案例資訊'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{isEn ? 'Session Title' : '案例標題'} *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder={isEn ? 'e.g., Lap Cholecystectomy Case #42' : '例：腹腔鏡膽囊切除術 Case #42'}
                  className="w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{isEn ? 'Surgery Type' : '手術類型'}</label>
                <input type="text" value={surgeryType} onChange={e => setSurgeryType(e.target.value)}
                  placeholder={isEn ? 'e.g., Lap Cholecystectomy' : '例：腹腔鏡膽囊切除術'}
                  className="w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{isEn ? 'Date' : '手術日期'}</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Video Sources */}
          <div className="card rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{isEn ? 'Video Sources' : '影像來源'}</h3>
              <button type="button" onClick={addSource} className="text-sm text-[var(--cyan)] hover:text-[var(--cyan-bright)]">
                + {isEn ? 'Add Source' : '新增來源'}
              </button>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">{isEn ? 'Add all camera sources from this surgery. Set time offsets to synchronize them.' : '新增此手術的所有鏡頭來源。設定時間偏移值以同步對齊。'}</p>

            {sources.map((source, idx) => (
              <div key={idx} className={`border rounded-lg p-4 space-y-3 ${source.isPrimary ? 'border-blue-300 bg-[rgba(6,182,212,0.08)]/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{isEn ? 'Source' : '來源'} {idx + 1}</span>
                    {source.isPrimary && <span className="text-xs btn-primary px-2 py-0.5 rounded-full">{isEn ? 'Primary' : '主要'}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!source.isPrimary && (
                      <button type="button" onClick={() => updateSource(idx, 'isPrimary', true)}
                        className="text-xs text-[var(--cyan)] hover:underline">{isEn ? 'Set as primary' : '設為主要'}</button>
                    )}
                    {sources.length > 1 && (
                      <button type="button" onClick={() => removeSource(idx)} className="text-xs text-red-500 hover:underline">{isEn ? 'Remove' : '移除'}</button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">{isEn ? 'Source Type' : '來源類型'}</label>
                    <select value={source.sourceType} onChange={e => updateSource(idx, 'sourceType', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      {SOURCE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{isEn ? t.en : t.zh}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">{isEn ? 'Video' : '選擇影片'}</label>
                    <select value={source.videoId} onChange={e => updateSource(idx, 'videoId', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- {isEn ? 'Select' : '選擇'} --</option>
                      {videos.map(v => (
                        <option key={v.id} value={v.id}>{v.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">{isEn ? 'Label (optional)' : '標籤（選填）'}</label>
                    <input type="text" value={source.label} onChange={e => updateSource(idx, 'label', e.target.value)}
                      placeholder={isEn ? 'e.g., 30° scope' : '例：30度鏡'} className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-1">{isEn ? 'Time Offset (ms)' : '時間偏移 (毫秒)'}</label>
                    <input type="number" value={source.offsetMs} onChange={e => updateSource(idx, 'offsetMs', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none" />
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>{isEn ? 'Time Sync Tip:' : '時間同步提示：'}</strong>
              {isEn
                ? ' Set the primary source offset to 0. For other sources, enter the millisecond offset relative to the primary. Positive = this source started later; Negative = started earlier.'
                : ' 將主要來源偏移設為 0。其他來源輸入相對於主要來源的毫秒偏移量。正值 = 此來源較晚開始；負值 = 較早開始。'}
            </div>
          </div>

          <button type="submit" disabled={!title || !sources.some(s => s.videoId) || saving}
            className="w-full py-4 btn-primary rounded-xl font-semibold text-lg  disabled:opacity-50 transition">
            {saving ? '...' : isEn ? 'Create Session' : '建立手術案例'}
          </button>
        </form>
      </div>
    </div>
  );
}
