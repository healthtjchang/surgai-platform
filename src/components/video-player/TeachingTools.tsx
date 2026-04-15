'use client';

import { useState } from 'react';

interface Props {
  videoId: string;
  videoTitle: string;
  isEn: boolean;
  onAnnotateToggle: () => void;
  annotateActive: boolean;
}

interface QuizQuestion { q: string; options: string[]; answer: string; explanation: string; }
interface KeyPoint { point: string; category: string; importance: string; }
interface Pearl { pearl: string; context: string; tip: string; }

type ToolResult = {
  questions?: QuizQuestion[];
  keypoints?: KeyPoint[];
  pearls?: Pearl[];
  checklist?: { preop: Array<{ item: string; critical: boolean }>; intraop: Array<{ item: string; critical: boolean }>; postop: Array<{ item: string; critical: boolean }> };
};

export default function TeachingTools({ videoId, videoTitle, isEn, onAnnotateToggle, annotateActive }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const runTool = async (tool: string) => {
    setLoading(tool);
    setResult(null);
    setActiveTool(tool);
    try {
      const res = await fetch('/api/ai/quick-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, tool }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch { setResult(null); }
    setLoading(null);
  };

  const exportFile = (format: string) => {
    window.open(`/api/export?videoId=${videoId}&format=${format}`, '_blank');
  };

  const tools = [
    { id: 'quiz', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: isEn ? 'Quiz' : '測驗題', desc: isEn ? 'Auto-generate MCQ' : '自動生成選擇題' },
    { id: 'keypoints', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: isEn ? 'Key Points' : '學習重點', desc: isEn ? 'Extract key learnings' : '提取關鍵學習要點' },
    { id: 'pearls', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', label: isEn ? 'Clinical Pearls' : '臨床 Tips', desc: isEn ? 'Practical wisdom' : '實用臨床智慧' },
    { id: 'checklist', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: isEn ? 'Checklist' : '安全清單', desc: isEn ? 'Safety checklist' : '手術安全確認清單' },
  ];

  const impColor: Record<string, string> = { critical: '#f43f5e', high: '#f59e0b', normal: '#06b6d4' };

  return (
    <div className="space-y-4 p-4 h-full overflow-y-auto">
      {/* Annotate Toggle */}
      <button onClick={onAnnotateToggle}
        className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition ${annotateActive ? 'text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
        style={{ background: annotateActive ? 'rgba(6,182,212,0.15)' : 'rgba(148,163,184,0.06)', border: `1px solid ${annotateActive ? 'rgba(6,182,212,0.3)' : 'rgba(148,163,184,0.1)'}` }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <div className="text-left flex-1">
          <div>{isEn ? 'Annotate Video' : '影片標註工具'}</div>
          <div className="text-[10px] opacity-60">{isEn ? 'Draw arrows, circles, labels on video' : '在影片上繪製箭頭、圓圈、文字標記'}</div>
        </div>
        <span className={`w-2 h-2 rounded-full ${annotateActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
      </button>

      {/* AI Tools Grid */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">{isEn ? 'AI Quick Generate' : 'AI 快速生成'}</p>
        <div className="grid grid-cols-2 gap-2">
          {tools.map(t => (
            <button key={t.id} onClick={() => runTool(t.id)} disabled={loading !== null}
              className={`p-3 rounded-xl text-left transition ${activeTool === t.id && result ? 'ring-1 ring-cyan-500/30' : ''}`}
              style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <svg className="w-4 h-4 text-cyan-400 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              <div className="text-xs font-medium text-slate-200">{t.label}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
              {loading === t.id && <div className="mt-1.5 h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(6,182,212,0.1)' }}><div className="h-full bg-cyan-400 rounded-full animate-pulse" style={{ width: '60%' }} /></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Export */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">{isEn ? 'Export' : '匯出'}</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { fmt: 'srt', label: 'SRT', desc: isEn ? 'Subtitles' : '字幕' },
            { fmt: 'vtt', label: 'VTT', desc: isEn ? 'Web subs' : '網頁字幕' },
            { fmt: 'markdown', label: 'MD', desc: isEn ? 'Teaching' : '教案' },
          ].map(e => (
            <button key={e.fmt} onClick={() => exportFile(e.fmt)}
              className="p-2.5 rounded-xl text-center transition hover:bg-slate-800"
              style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
              <div className="text-xs font-mono font-bold text-cyan-400">{e.label}</div>
              <div className="text-[10px] text-slate-500">{e.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {result && (
        <div className="space-y-3">
          <div className="h-px" style={{ background: 'rgba(148,163,184,0.1)' }} />

          {/* Quiz */}
          {result.questions && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white">{isEn ? 'Generated Quiz' : '生成的測驗題'}</p>
              {result.questions.map((q, i) => (
                <div key={i} className="p-3 rounded-lg text-xs" style={{ background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <p className="font-medium text-slate-200 mb-2">{i + 1}. {q.q}</p>
                  {q.options.map((o, j) => (
                    <p key={j} className={`ml-2 mb-0.5 ${o.startsWith(q.answer) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>{o}</p>
                  ))}
                  <p className="mt-2 text-cyan-400/70 text-[10px]">{q.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* Key Points */}
          {result.keypoints && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white">{isEn ? 'Key Learning Points' : '學習重點'}</p>
              {result.keypoints.map((k, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: impColor[k.importance] || impColor.normal }} />
                  <span className="text-slate-300">{k.point}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pearls */}
          {result.pearls && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white">{isEn ? 'Clinical Pearls' : '臨床 Tips'}</p>
              {result.pearls.map((p, i) => (
                <div key={i} className="p-3 rounded-lg text-xs" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <p className="text-violet-300 font-medium mb-1">{p.pearl}</p>
                  <p className="text-slate-400">{p.context}</p>
                  <p className="text-slate-500 mt-1">{p.tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* Checklist */}
          {result.checklist && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white">{isEn ? 'Safety Checklist' : '安全清單'}</p>
              {(['preop', 'intraop', 'postop'] as const).map(phase => (
                <div key={phase}>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">
                    {phase === 'preop' ? (isEn ? 'Pre-op' : '術前') : phase === 'intraop' ? (isEn ? 'Intra-op' : '術中') : (isEn ? 'Post-op' : '術後')}
                  </p>
                  {result.checklist![phase].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${item.critical ? 'border-rose-500 text-rose-400' : 'border-slate-600 text-slate-500'}`}>
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span className={item.critical ? 'text-slate-200' : 'text-slate-400'}>{item.item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
