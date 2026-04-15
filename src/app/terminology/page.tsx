'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import { useRouter } from 'next/navigation';

interface Term { id: string; zh: string; en: string; category: string; is_global: number; usage_count: number; }

const CATEGORIES = [
  { value: 'all', zh: '全部', en: 'All' },
  { value: 'anatomy', zh: '解剖結構', en: 'Anatomy' },
  { value: 'instrument', zh: '器械', en: 'Instruments' },
  { value: 'procedure', zh: '術式/操作', en: 'Procedures' },
  { value: 'pathology', zh: '病理', en: 'Pathology' },
  { value: 'other', zh: '其他', en: 'Other' },
];

export default function TerminologyPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const router = useRouter();
  const isEn = locale === 'en';

  const [terms, setTerms] = useState<Term[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [newZh, setNewZh] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newCat, setNewCat] = useState('anatomy');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search) params.set('q', search);
    fetch(`/api/terminology?${params}`).then(r => r.json()).then(d => setTerms(d.terms || [])).catch(() => {});
  }, [user, category, search]);

  const addTerm = async () => {
    if (!newZh || !newEn) return;
    setAdding(true);
    try {
      const res = await fetch('/api/terminology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zh: newZh, en: newEn, category: newCat }),
      });
      if (res.ok) {
        const data = await res.json();
        setTerms(prev => [{ ...data.term, is_global: 0, usage_count: 0 }, ...prev]);
        setNewZh(''); setNewEn('');
      }
    } catch { /* ignore */ }
    setAdding(false);
  };

  const deleteTerm = async (id: string) => {
    await fetch('/api/terminology', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setTerms(prev => prev.filter(t => t.id !== id));
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">{isEn ? 'Medical Terminology Glossary' : '醫學術語對照表'}</h1>
        <p className="text-[var(--text-tertiary)] mb-8">
          {isEn
            ? 'This glossary helps AI accurately recognize medical terms during transcription. Add your custom terms for better accuracy.'
            : '此對照表協助 AI 在語音轉文字時精準辨識醫學術語。您可新增自訂術語，提升轉譯準確度。'}
        </p>

        {/* Add new term */}
        <div className="card rounded-xl border p-6 mb-6">
          <h3 className="font-semibold mb-4">{isEn ? 'Add Custom Term' : '新增自訂術語'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" value={newZh} onChange={e => setNewZh(e.target.value)}
              placeholder={isEn ? 'Chinese term' : '中文術語'}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="text" value={newEn} onChange={e => setNewEn(e.target.value)}
              placeholder={isEn ? 'English term' : '英文術語'}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={newCat} onChange={e => setNewCat(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                <option key={c.value} value={c.value}>{isEn ? c.en : c.zh}</option>
              ))}
            </select>
            <button onClick={addTerm} disabled={!newZh || !newEn || adding}
              className="px-4 py-2 btn-primary rounded-lg text-sm  disabled:opacity-50 transition">
              {adding ? '...' : isEn ? 'Add' : '新增'}
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isEn ? 'Search terms...' : '搜尋術語...'}
            className="flex-1 px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex gap-1 overflow-x-auto">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap transition ${category === c.value ? 'btn-primary' : 'bg-[var(--bg-card)] border hover:bg-[var(--bg-base)]'}`}>
                {isEn ? c.en : c.zh}
              </button>
            ))}
          </div>
        </div>

        {/* Terms Table */}
        <div className="card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-base)] border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'Chinese' : '中文'}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'English' : '英文'}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'Category' : '類別'}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'Source' : '來源'}</th>
                <th className="px-4 py-3 text-xs font-medium text-[var(--text-tertiary)] w-16"></th>
              </tr>
            </thead>
            <tbody>
              {terms.map(term => {
                const catLabel = CATEGORIES.find(c => c.value === term.category);
                return (
                  <tr key={term.id} className="border-b hover:bg-[var(--bg-base)]">
                    <td className="px-4 py-3 text-sm font-medium">{term.zh}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{term.en}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        term.category === 'anatomy' ? 'bg-blue-100 text-[var(--cyan-bright)]' :
                        term.category === 'instrument' ? 'bg-green-100 text-green-700' :
                        term.category === 'procedure' ? 'bg-purple-100 text-purple-700' :
                        term.category === 'pathology' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-[var(--text-secondary)]'
                      }`}>
                        {isEn ? catLabel?.en : catLabel?.zh}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-tertiary)]">
                      {term.is_global ? (isEn ? 'System' : '系統內建') : (isEn ? 'Custom' : '自訂')}
                    </td>
                    <td className="px-4 py-3">
                      {!term.is_global && (
                        <button onClick={() => deleteTerm(term.id)} className="text-xs text-red-500 hover:text-red-700">
                          {isEn ? 'Delete' : '刪除'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {terms.length === 0 && (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              {isEn ? 'No terms found' : '未找到術語'}
            </div>
          )}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">
          {isEn ? `${terms.length} terms loaded` : `已載入 ${terms.length} 個術語`}
        </p>
      </div>
    </div>
  );
}
