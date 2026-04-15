'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLocale } from '@/lib/locale-context';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

interface Specialty { id: string; name_zh: string; name_en: string; icon: string; }
interface Procedure { id: string; name_zh: string; name_en: string; description_zh: string; description_en: string; difficulty: string; duration_min: number; duration_max: number; specialty_zh?: string; icon?: string; }

export default function KnowledgePage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const isEn = locale === 'en';

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [activeSpec, setActiveSpec] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ terms: Array<{ zh: string; en: string; category: string }>; steps: Array<{ zh: string; en: string }>; instruments: Array<{ zh: string; en: string }> } | null>(null);
  const [saveMsg, setSaveMsg] = useState('');

  const loadData = useCallback(async (specId?: string | null, q?: string) => {
    const params = new URLSearchParams();
    if (specId) params.set('specialty', specId);
    if (q) params.set('q', q);
    const res = await fetch(`/api/knowledge?${params}`);
    const data = await res.json();
    if (data.specialties) setSpecialties(data.specialties);
    if (data.procedures) setProcedures(data.procedures);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filterBySpec = (id: string | null) => {
    setActiveSpec(id);
    loadData(id, search);
  };

  const doSearch = () => { loadData(activeSpec, search); };

  const extractTerms = async () => {
    if (!importText.trim()) return;
    setExtracting(true);
    setExtractResult(null);
    try {
      const res = await fetch('/api/knowledge/extract', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText }),
      });
      const data = await res.json();
      setExtractResult(data.extracted);
    } catch { setExtractResult(null); }
    setExtracting(false);
  };

  const saveExtractedToTerminology = async () => {
    if (!extractResult?.terms?.length) return;
    let saved = 0;
    for (const term of extractResult.terms) {
      try {
        await fetch('/api/terminology', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zh: term.zh, en: term.en, category: term.category }),
        });
        saved++;
      } catch { /* skip duplicates */ }
    }
    setSaveMsg(isEn ? `Saved ${saved} terms to glossary` : `已儲存 ${saved} 個術語至對照表`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const diffLabel: Record<string, { zh: string; en: string; color: string }> = {
    beginner: { zh: '初級', en: 'Beginner', color: 'bg-green-100 text-green-700' },
    intermediate: { zh: '中級', en: 'Intermediate', color: 'bg-yellow-100 text-yellow-700' },
    advanced: { zh: '進階', en: 'Advanced', color: 'bg-orange-100 text-orange-700' },
    expert: { zh: '專家', en: 'Expert', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{isEn ? 'Surgical Knowledge Base' : '外科手術知識庫'}</h1>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">{isEn ? 'Standard procedures, steps, instruments, and anatomy for all surgical specialties' : '所有外科專科的標準術式、流程、器械與解剖結構'}</p>
          </div>
          {user?.role === 'surgeon' && (
            <button onClick={() => setShowImport(!showImport)}
              className="px-4 py-2 btn-primary rounded-lg text-sm  transition">
              {isEn ? '+ Import Description' : '+ 匯入手術說明'}
            </button>
          )}
        </div>

        {/* Import Section */}
        {showImport && (
          <div className="card rounded-xl border p-6 mb-6 space-y-4">
            <h3 className="font-semibold">{isEn ? 'Import Surgical Description' : '匯入手術說明文字'}</h3>
            <p className="text-xs text-[var(--text-tertiary)]">{isEn ? 'Paste any surgical description text. AI will extract medical terms, steps, and instruments automatically.' : '貼上任何手術說明文字，AI 會自動提取醫學專有名詞、手術步驟和器械清單，並轉為中英文對照。'}</p>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={6}
              className="w-full px-4 py-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={isEn ? 'Paste surgical description here...' : '在此貼上手術說明文字...\n例：腹腔鏡膽囊切除術需先建立氣腹，壓力維持在12-15mmHg，然後放置4個trocar...'} />
            <button onClick={extractTerms} disabled={!importText.trim() || extracting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 transition">
              {extracting ? (isEn ? 'Extracting...' : 'AI 提取中...') : isEn ? 'Extract Terms with AI' : 'AI 自動提取術語'}
            </button>

            {/* Extract Results */}
            {extractResult && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{isEn ? 'Extracted Results' : '提取結果'}
                    <span className="text-[var(--text-tertiary)] font-normal ml-2">({extractResult.terms?.length || 0} {isEn ? 'terms' : '個術語'})</span>
                  </h4>
                  <div className="flex gap-2">
                    <button onClick={saveExtractedToTerminology}
                      className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition">
                      {isEn ? 'Save All to Glossary' : '全部儲存至術語庫'}
                    </button>
                  </div>
                </div>
                {saveMsg && <div className="text-xs text-green-600 bg-green-50 p-2 rounded">{saveMsg}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {extractResult.terms?.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-[var(--bg-base)] rounded text-sm">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        t.category === 'anatomy' ? 'bg-blue-100 text-[var(--cyan-bright)]' :
                        t.category === 'instrument' ? 'bg-green-100 text-green-700' :
                        t.category === 'procedure' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-[var(--text-secondary)]'
                      }`}>{t.category}</span>
                      <span className="font-medium">{t.zh}</span>
                      <span className="text-[var(--text-tertiary)]">=</span>
                      <span className="text-[var(--text-secondary)]">{t.en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder={isEn ? 'Search procedures, anatomy, instruments...' : '搜尋術式、解剖結構、器械...'}
            className="flex-1 px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={doSearch} className="px-6 py-3 btn-primary rounded-xl text-sm ">
            {isEn ? 'Search' : '搜尋'}
          </button>
        </div>

        {/* Specialty Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => filterBySpec(null)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${!activeSpec ? 'btn-primary' : 'bg-[var(--bg-card)] border hover:bg-[var(--bg-base)]'}`}>
            {isEn ? 'All' : '全部'} ({procedures.length})
          </button>
          {specialties.map(s => (
            <button key={s.id} onClick={() => filterBySpec(s.id)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${activeSpec === s.id ? 'btn-primary' : 'bg-[var(--bg-card)] border hover:bg-[var(--bg-base)]'}`}>
              {s.icon} {isEn ? s.name_en : s.name_zh}
            </button>
          ))}
        </div>

        {/* Procedures Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {procedures.map(proc => {
            const dl = diffLabel[proc.difficulty] || diffLabel.intermediate;
            return (
              <Link key={proc.id} href={`/knowledge/${proc.id}`}
                className="card rounded-xl border p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-2xl">{proc.icon || '🔬'}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${dl.color}`}>{isEn ? dl.en : dl.zh}</span>
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-[var(--cyan)] transition">
                  {isEn ? proc.name_en : proc.name_zh}
                </h3>
                {!isEn && proc.name_en && <p className="text-xs text-[var(--text-tertiary)] mb-2">{proc.name_en}</p>}
                <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 mb-3">
                  {isEn ? proc.description_en : proc.description_zh}
                </p>
                <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                  {proc.duration_min > 0 && <span>&#9201; {proc.duration_min}-{proc.duration_max} min</span>}
                  {proc.specialty_zh && <span>{proc.icon} {isEn ? '' : proc.specialty_zh}</span>}
                </div>
              </Link>
            );
          })}
        </div>
        {procedures.length === 0 && (
          <div className="text-center py-16 text-[var(--text-tertiary)]">
            <p className="text-4xl mb-4">📚</p>
            <p>{isEn ? 'No procedures found' : '未找到相關術式'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
