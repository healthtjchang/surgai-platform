'use client';

import { useEffect, useState, use } from 'react';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

interface Step { id: string; step_number: number; name_zh: string; name_en: string; description_zh: string; description_en: string; key_points_zh: string; key_points_en: string; duration_minutes: number; }
interface Instrument { id: string; name_zh: string; name_en: string; category: string; is_essential: number; }
interface Anatomy { id: string; name_zh: string; name_en: string; category: string; importance: string; description_zh: string; description_en: string; }

export default function ProcedureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [proc, setProc] = useState<Record<string, string | number> | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [anatomy, setAnatomy] = useState<Anatomy[]>([]);
  const [activeTab, setActiveTab] = useState<'steps' | 'instruments' | 'anatomy'>('steps');

  useEffect(() => {
    fetch(`/api/knowledge?procedure=${id}`).then(r => r.json()).then(data => {
      setProc(data.procedure);
      setSteps(data.steps || []);
      setInstruments(data.instruments || []);
      setAnatomy(data.anatomy || []);
    });
  }, [id]);

  if (!proc) return <div className="min-h-screen" style={{ background: "var(--bg-base)" }}><Navbar /><div className="flex items-center justify-center py-20 text-[var(--text-tertiary)]">Loading...</div></div>;

  const impColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    normal: 'bg-gray-100 text-[var(--text-secondary)] border-[var(--border)]',
  };
  const catColors: Record<string, string> = {
    organ: 'bg-blue-100 text-[var(--cyan-bright)]', vessel: 'bg-red-100 text-red-700',
    nerve: 'bg-yellow-100 text-yellow-700', duct: 'bg-green-100 text-green-700',
    landmark: 'bg-purple-100 text-purple-700', danger_zone: 'bg-red-200 text-red-800',
    structure: 'bg-gray-100 text-[var(--text-secondary)]',
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/knowledge" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--cyan)] mb-4 inline-block">
          &larr; {isEn ? 'Back to Knowledge Base' : '返回知識庫'}
        </Link>

        {/* Header */}
        <div className="card rounded-2xl border p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔬</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{isEn ? proc.name_en : proc.name_zh}</h1>
              <p className="text-[var(--text-tertiary)] text-sm mb-3">{isEn ? proc.name_zh : proc.name_en}</p>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">{isEn ? proc.description_en : proc.description_zh}</p>
              <div className="flex gap-4 text-xs text-[var(--text-tertiary)]">
                <span>&#128197; {proc.specialty_zh} / {proc.specialty_en}</span>
                {(proc.duration_min as number) > 0 && <span>&#9201; {proc.duration_min}-{proc.duration_max} min</span>}
                {proc.icd_code && <span>ICD: {proc.icd_code}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex card rounded-xl border overflow-hidden mb-6">
          {(['steps', 'instruments', 'anatomy'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition ${activeTab === tab ? 'btn-primary' : 'hover:bg-[var(--bg-base)]'}`}>
              {tab === 'steps' ? `${isEn ? 'Steps' : '手術步驟'} (${steps.length})` :
               tab === 'instruments' ? `${isEn ? 'Instruments' : '器械'} (${instruments.length})` :
               `${isEn ? 'Anatomy' : '解剖結構'} (${anatomy.length})`}
            </button>
          ))}
        </div>

        {/* Steps */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            {steps.map(step => (
              <div key={step.id} className="card rounded-xl border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 text-[var(--cyan-bright)] rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                    {step.step_number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{isEn ? step.name_en : step.name_zh}</h3>
                      {step.duration_minutes > 0 && (
                        <span className="text-xs text-[var(--text-tertiary)]">~{step.duration_minutes} min</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)] mb-2">{isEn ? step.name_zh : step.name_en}</p>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{isEn ? step.description_en : step.description_zh}</p>
                    {(step.key_points_zh || step.key_points_en) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <span className="text-xs font-medium text-amber-700">&#9888;&#65039; {isEn ? 'Key Points:' : '要點：'}</span>
                        <p className="text-sm text-amber-800 mt-1">{isEn ? step.key_points_en : step.key_points_zh}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instruments */}
        {activeTab === 'instruments' && (
          <div className="card rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--bg-base)] border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'Instrument' : '器械名稱'}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'English' : '英文'}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'Category' : '類別'}</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[var(--text-tertiary)]">{isEn ? 'Essential' : '必要'}</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map(inst => (
                  <tr key={inst.id} className="border-b hover:bg-[var(--bg-base)]">
                    <td className="px-6 py-3 text-sm font-medium">{inst.name_zh}</td>
                    <td className="px-6 py-3 text-sm text-[var(--text-secondary)]">{inst.name_en}</td>
                    <td className="px-6 py-3"><span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">{inst.category}</span></td>
                    <td className="px-6 py-3">{inst.is_essential ? <span className="text-green-600 text-sm">&#10003; {isEn ? 'Yes' : '必要'}</span> : <span className="text-[var(--text-tertiary)] text-sm">{isEn ? 'Optional' : '選用'}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Anatomy */}
        {activeTab === 'anatomy' && (
          <div className="grid md:grid-cols-2 gap-4">
            {anatomy.map(a => (
              <div key={a.id} className={`rounded-xl border p-5 ${impColors[a.importance] || impColors.normal}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{isEn ? a.name_en : a.name_zh}</h3>
                  <div className="flex gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${catColors[a.category] || catColors.structure}`}>{a.category}</span>
                    {a.importance === 'critical' && <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white">CRITICAL</span>}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">{isEn ? a.name_zh : a.name_en}</p>
                <p className="text-sm">{isEn ? a.description_en : a.description_zh}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
