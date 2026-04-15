'use client';

import { useEffect, useState, useRef, use, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

interface Transcript { id: string; start_time: number; end_time: number; text: string; }
interface Chapter { id: string; title: string; title_en: string; start_time: number; end_time: number; summary: string; summary_en: string; }
interface TeachingMaterial { id: string; type: string; content: string; content_en: string; }
interface Annotation { id: string; timestamp: number; type: string; label: string; label_en: string; description: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; }
interface Correction { id: string; original_text: string; corrected_text: string; applied_count: number; is_auto_rule: number; }

type TabType = 'chapters' | 'transcript' | 'teaching' | 'corrections' | 'chat';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [video, setVideo] = useState<Record<string, string | number> | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('chapters');
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  // Batch correction state
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [batchFind, setBatchFind] = useState('');
  const [batchReplace, setBatchReplace] = useState('');
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/videos/${id}`).then(r => r.json()).then(data => {
      setVideo(data.video);
      setTranscripts(data.transcripts || []);
      setChapters(data.chapters || []);
      setMaterials(data.teachingMaterials || []);
      setAnnotations(data.annotations || []);
    });
  }, [id]);

  const loadCorrections = useCallback(() => {
    fetch('/api/corrections?autoOnly=true').then(r => r.json()).then(d => setCorrections(d.corrections || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && activeTab === 'corrections') loadCorrections();
  }, [user, activeTab, loadCorrections]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const seekTo = (time: number) => {
    if (videoRef.current) { videoRef.current.currentTime = time; videoRef.current.play(); }
  };

  const changeSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  // --- Transcript Editing ---
  const startEdit = (tr: Transcript) => {
    setEditingId(tr.id);
    setEditText(tr.text);
  };

  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  const saveEdit = async (trId: string) => {
    if (!editText.trim()) return;
    setSavingId(trId);
    try {
      const res = await fetch(`/api/transcripts/${trId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText }),
      });
      if (res.ok) {
        setTranscripts(prev => prev.map(t => t.id === trId ? { ...t, text: editText } : t));
        setEditingId(null);
        setEditText('');
      }
    } catch { /* ignore */ }
    setSavingId(null);
  };

  // --- Batch Correction ---
  const applyBatchCorrection = async (orig?: string, corr?: string) => {
    const findText = orig || batchFind;
    const replaceText = corr || batchReplace;
    if (!findText || !replaceText) return;
    setBatchLoading(true);
    setBatchResult(null);
    try {
      const res = await fetch('/api/corrections/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalText: findText, correctedText: replaceText }),
      });
      const data = await res.json();
      setBatchResult(data.message || `已校正 ${data.corrected} 處`);
      // Reload transcripts for current video
      const vRes = await fetch(`/api/videos/${id}`);
      const vData = await vRes.json();
      setTranscripts(vData.transcripts || []);
      loadCorrections();
    } catch {
      setBatchResult('批次校正失敗');
    }
    setBatchLoading(false);
  };

  // --- Chat ---
  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id, message: msg, conversationId }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.conversationId) setConversationId(data.conversationId);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，回答時發生錯誤。請重試。' }]);
    } finally { setChatLoading(false); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const isEn = locale === 'en';
  const isSurgeon = user?.role === 'surgeon' || user?.role === 'admin';
  const summary = materials.find(m => m.type === 'summary');
  const steps = materials.filter(m => m.type === 'step');
  const activeTranscript = transcripts.find(tr => currentTime >= tr.start_time && currentTime < tr.end_time);

  if (!video) return <div className="min-h-screen" style={{ background: "var(--bg-base)" }}><Navbar /><div className="flex items-center justify-center py-20"><p className="text-[var(--text-tertiary)]">{t('common.loading')}</p></div></div>;

  const tabs: TabType[] = isSurgeon
    ? ['chapters', 'transcript', 'corrections', 'teaching', 'chat']
    : ['chapters', 'transcript', 'teaching', 'chat'];

  const tabLabels: Record<TabType, string> = {
    chapters: isEn ? 'Chapters' : '章節',
    transcript: isEn ? 'Transcript' : '逐字稿',
    corrections: isEn ? 'Correct' : '校正',
    teaching: isEn ? 'Teaching' : '教案',
    chat: isEn ? 'AI Chat' : 'AI 助手',
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/videos" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--cyan)] mb-4 inline-block">&larr; {t('common.back')}</Link>
        <h1 className="text-2xl font-bold mb-1">{video.title as string}</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-6">
          {video.surgeon_name as string} · {video.surgery_type ? t(`video.surgeryTypes.${video.surgery_type}`) : ''} · {t(`video.difficulties.${video.difficulty}`)}
        </p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black rounded-xl overflow-hidden relative">
              <video ref={videoRef} src={video.file_path as string} controls className="w-full aspect-video"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)} />
              {activeTranscript && (
                <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
                  <span className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg">{activeTranscript.text}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={changeSpeed} className="text-xs px-3 py-1.5 bg-[var(--bg-card)] border rounded-lg hover:bg-[var(--bg-base)] font-mono">{playbackRate}x</button>
              <div className="flex gap-1 overflow-x-auto flex-1">
                {chapters.map((ch, i) => (
                  <button key={ch.id} onClick={() => seekTo(ch.start_time)}
                    className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${currentTime >= ch.start_time && currentTime < ch.end_time ? 'btn-primary' : 'bg-[var(--bg-card)] border hover:bg-[var(--bg-base)]'}`}>
                    {isEn ? ch.title_en : ch.title || `Ch.${i + 1}`}
                  </button>
                ))}
              </div>
            </div>
            {summary && (
              <div className="card rounded-xl border p-6">
                <h3 className="font-semibold mb-3">{t('video.detail.summary')}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{isEn ? summary.content_en : summary.content}</p>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex card rounded-xl border overflow-hidden">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-medium transition ${activeTab === tab ? 'btn-primary' : 'hover:bg-[var(--bg-base)]'}`}>
                  {tabLabels[tab]}
                </button>
              ))}
            </div>

            <div className="card rounded-xl border overflow-hidden" style={{ height: '520px' }}>

              {/* === CHAPTERS === */}
              {activeTab === 'chapters' && (
                <div className="p-4 space-y-2 overflow-y-auto h-full">
                  {chapters.length === 0 ? <p className="text-[var(--text-tertiary)] text-sm text-center py-8">AI 處理完成後將顯示章節</p> : chapters.map((ch, i) => (
                    <button key={ch.id} onClick={() => seekTo(ch.start_time)}
                      className={`w-full text-left p-3 rounded-lg transition ${currentTime >= ch.start_time && currentTime < ch.end_time ? 'bg-[rgba(6,182,212,0.08)] border-blue-200 border' : 'hover:bg-[var(--bg-base)]'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[var(--cyan)]">{fmt(ch.start_time)}</span>
                        <span className="font-medium text-sm">{isEn ? ch.title_en : ch.title || `Chapter ${i + 1}`}</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">{isEn ? ch.summary_en : ch.summary}</p>
                    </button>
                  ))}
                  {annotations.length > 0 && (
                    <>
                      <h4 className="font-medium text-sm mt-4 mb-2 px-1">{t('video.detail.keyMoments')}</h4>
                      {annotations.map(a => (
                        <button key={a.id} onClick={() => seekTo(a.timestamp)}
                          className="w-full text-left p-3 rounded-lg hover:bg-yellow-50 border border-yellow-100 flex items-start gap-2">
                          <span className="text-yellow-500 text-sm mt-0.5">&#9889;</span>
                          <div>
                            <span className="text-xs font-mono text-yellow-600 mr-2">{fmt(a.timestamp)}</span>
                            <span className="text-sm font-medium">{isEn ? a.label_en : a.label}</span>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{a.description}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* === TRANSCRIPT (Editable) === */}
              {activeTab === 'transcript' && (
                <div className="p-4 space-y-1 overflow-y-auto h-full">
                  {isSurgeon && transcripts.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3 text-xs text-amber-800">
                      &#9998; {isEn ? 'Click any transcript segment to edit. Corrections are auto-learned for batch apply.' : '點擊任一段逐字稿即可編輯。校正內容會自動學習，可批次套用。'}
                    </div>
                  )}
                  {transcripts.length === 0 ? <p className="text-[var(--text-tertiary)] text-sm text-center py-8">AI 處理完成後將顯示逐字稿</p> :
                  transcripts.map(tr => (
                    <div key={tr.id} className={`rounded-lg transition text-sm ${activeTranscript?.id === tr.id ? 'bg-[rgba(6,182,212,0.08)]' : 'hover:bg-[var(--bg-base)]'}`}>
                      {editingId === tr.id ? (
                        <div className="p-2 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-[var(--cyan)]">
                            <span className="font-mono">{fmt(tr.start_time)}</span>
                            <span className="text-amber-600 font-medium">{isEn ? 'Editing' : '編輯中'}</span>
                          </div>
                          <textarea
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="w-full p-2 border-2 border-blue-300 rounded-lg text-sm outline-none focus:border-blue-500 resize-none"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelEdit} className="text-xs px-3 py-1 border rounded hover:bg-gray-100">
                              {isEn ? 'Cancel' : '取消'}
                            </button>
                            <button
                              onClick={() => saveEdit(tr.id)}
                              disabled={savingId === tr.id}
                              className="text-xs px-3 py-1 btn-primary rounded  disabled:opacity-50"
                            >
                              {savingId === tr.id ? '...' : isEn ? 'Save' : '儲存'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => isSurgeon ? startEdit(tr) : seekTo(tr.start_time)}
                          className={`w-full text-left p-2 ${activeTranscript?.id === tr.id ? 'text-blue-900' : 'text-[var(--text-secondary)]'}`}
                        >
                          <span className="text-xs font-mono text-blue-500 mr-2">{fmt(tr.start_time)}</span>
                          {tr.text}
                          {isSurgeon && <span className="text-[var(--text-tertiary)] ml-1 opacity-0 group-hover:opacity-100">&#9998;</span>}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* === CORRECTIONS (Batch) === */}
              {activeTab === 'corrections' && (
                <div className="p-4 overflow-y-auto h-full space-y-4">
                  {/* Manual batch find & replace */}
                  <div className="bg-[rgba(6,182,212,0.08)] rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">{isEn ? 'Batch Find & Replace' : '批次尋找與替換'}</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {isEn ? 'Replace a word/phrase across ALL your videos at once.' : '一次替換所有影片中的特定詞彙。適用於口音造成的系統性轉譯錯誤。'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500 w-12 shrink-0">{isEn ? 'Find:' : '尋找：'}</span>
                        <input type="text" value={batchFind} onChange={e => setBatchFind(e.target.value)}
                          placeholder={isEn ? 'e.g. 大常' : '例：大常（錯誤）'}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 w-12 shrink-0">{isEn ? 'Replace:' : '替換：'}</span>
                        <input type="text" value={batchReplace} onChange={e => setBatchReplace(e.target.value)}
                          placeholder={isEn ? 'e.g. 大腸' : '例：大腸（正確）'}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                      <button onClick={() => applyBatchCorrection()} disabled={!batchFind || !batchReplace || batchLoading}
                        className="w-full py-2 btn-primary text-sm rounded-lg  disabled:opacity-50 transition">
                        {batchLoading ? (isEn ? 'Applying...' : '套用中...') : isEn ? 'Apply to All Videos' : '套用至所有影片'}
                      </button>
                    </div>
                    {batchResult && (
                      <div className="text-xs text-green-700 bg-green-50 p-2 rounded">{batchResult}</div>
                    )}
                  </div>

                  {/* Auto-learned patterns */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      {isEn ? 'Learned Patterns' : 'AI 學習到的校正模式'}
                      <span className="text-xs font-normal text-[var(--text-tertiary)]">({isEn ? 'from your edits' : '來自您的編輯'})</span>
                    </h4>
                    {corrections.length === 0 ? (
                      <p className="text-xs text-[var(--text-tertiary)] text-center py-6">
                        {isEn ? 'Edit transcripts to build correction patterns. The system learns from your edits.' : '編輯逐字稿後，系統會自動學習您的校正模式。多次相同修正會形成規則，可一鍵批次套用。'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {corrections.map(c => (
                          <div key={c.id} className="flex items-center gap-2 p-2 border rounded-lg text-sm">
                            <div className="flex-1 min-w-0">
                              <span className="text-red-500 line-through">{c.original_text}</span>
                              <span className="mx-2 text-[var(--text-tertiary)]">&rarr;</span>
                              <span className="text-green-600 font-medium">{c.corrected_text}</span>
                              <span className="text-xs text-[var(--text-tertiary)] ml-2">(&times;{c.applied_count})</span>
                            </div>
                            <button
                              onClick={() => applyBatchCorrection(c.original_text, c.corrected_text)}
                              className="text-xs px-2 py-1 bg-blue-100 text-[var(--cyan-bright)] rounded hover:bg-blue-200 shrink-0"
                            >
                              {isEn ? 'Apply All' : '全部套用'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Terminology quick reference */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      {isEn ? 'Terminology Reference' : '術語快速參考'}
                    </h4>
                    <Link href="/terminology" className="text-xs text-[var(--cyan)] hover:underline">
                      {isEn ? 'Manage full terminology glossary →' : '管理完整術語對照表 →'}
                    </Link>
                  </div>
                </div>
              )}

              {/* === TEACHING === */}
              {activeTab === 'teaching' && (
                <div className="p-4 space-y-4 overflow-y-auto h-full">
                  <h4 className="font-medium text-sm">{t('video.detail.steps')}</h4>
                  {steps.length === 0 ? <p className="text-[var(--text-tertiary)] text-sm text-center py-8">AI 處理完成後將顯示手術步驟</p> :
                  steps.map(step => {
                    const data = JSON.parse(isEn ? step.content_en : step.content);
                    return (
                      <button key={step.id} onClick={() => seekTo(data.startTime || 0)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-[var(--bg-base)] transition">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 bg-blue-100 text-[var(--cyan-bright)] rounded-full text-xs flex items-center justify-center font-bold">{data.step}</span>
                          <span className="font-medium text-sm">{data.title}</span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] ml-8">{data.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* === AI CHAT === */}
              {activeTab === 'chat' && (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-2xl mb-3">&#129302;</p>
                        <p className="text-sm text-[var(--text-secondary)] mb-4">{t('chat.welcome')}</p>
                        <div className="space-y-2">
                          {[t('chat.examples.anatomy'), t('chat.examples.technique'), t('chat.examples.safety')].map((ex, i) => (
                            <button key={i} onClick={() => setChatInput(ex)}
                              className="block w-full text-left text-xs px-3 py-2 bg-[var(--bg-base)] rounded-lg hover:bg-[rgba(6,182,212,0.08)] transition">
                              &#128161; {ex}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'btn-primary' : 'bg-gray-100 text-[var(--text-primary)]'}`}>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && <div className="flex justify-start"><div className="bg-gray-100 p-3 rounded-xl text-sm text-[var(--text-tertiary)] animate-pulse">{t('chat.thinking')}</div></div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={t('chat.placeholder')}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" disabled={chatLoading || !user} />
                      <button onClick={sendMessage} disabled={chatLoading || !chatInput.trim() || !user}
                        className="px-4 py-2 btn-primary rounded-lg text-sm  disabled:opacity-50 transition">{t('chat.send')}</button>
                    </div>
                    {!user && <p className="text-xs text-[var(--text-tertiary)] mt-2">請先登入以使用 AI 助手</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
