'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';

interface SearchResult {
  result_type: 'video' | 'transcript' | 'teaching';
  id?: string; video_id?: string; title?: string; video_title?: string;
  text?: string; content?: string; surgery_type?: string; start_time?: number;
  surgeon_name?: string; processing_status?: string;
}

export default function SearchPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results || []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Calot\'s triangle', '膽囊切除術', 'Critical View of Safety',
    '止血技巧', '腹腔鏡', '解剖結構',
  ];

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">{t('search.title')}</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder={t('search.placeholder')}
            className="w-full px-6 py-4 text-lg border-2 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
          />
          <button onClick={() => search()} disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 btn-primary rounded-xl  transition">
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {/* Suggestions */}
        {!searched && (
          <div className="mb-8">
            <p className="text-sm text-[var(--text-tertiary)] mb-3 text-center">試試搜尋：</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map(s => (
                <button key={s} onClick={() => { setQuery(s); search(s); }}
                  className="px-4 py-2 bg-[var(--bg-card)] border rounded-full text-sm hover:bg-[rgba(6,182,212,0.08)] hover:border-blue-300 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              {t('search.results')}: {results.length} 筆
            </p>
            {results.length === 0 ? (
              <div className="card rounded-xl border p-12 text-center">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-[var(--text-tertiary)]">{t('search.noResults')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((r, i) => (
                  <Link key={i}
                    href={r.result_type === 'video' ? `/videos/${r.id}` : `/videos/${r.video_id}`}
                    className="block card rounded-xl border p-4 hover:shadow-lg transition">
                    <div className="flex items-start gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        r.result_type === 'video' ? 'bg-blue-100 text-[var(--cyan-bright)]' :
                        r.result_type === 'transcript' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {r.result_type === 'video' ? '影片' : r.result_type === 'transcript' ? '逐字稿' : '教案'}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium">{r.title || r.video_title}</h3>
                        {r.text && (
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            {r.start_time !== undefined && <span className="text-[var(--cyan)] font-mono mr-2">[{fmt(r.start_time)}]</span>}
                            {r.text.slice(0, 200)}
                          </p>
                        )}
                        {r.content && <p className="text-sm text-[var(--text-secondary)] mt-1">{r.content.slice(0, 200)}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
