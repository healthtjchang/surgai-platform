'use client';

import { useEffect, useState, useRef, use, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';

interface Source { id: string; video_id: string; source_type: string; label: string; time_offset_ms: number; is_primary: number; video_title: string; file_path: string; duration: number; }
interface Transcript { id: string; start_time: number; end_time: number; text: string; }
interface Chapter { id: string; title: string; title_en: string; start_time: number; end_time: number; summary: string; }

const SOURCE_INFO: Record<string, { zh: string; en: string; icon: string; color: string }> = {
  ai_glasses: { zh: 'AI 眼鏡', en: 'AI Glasses', icon: '👓', color: 'bg-blue-100 text-blue-700' },
  laparoscope: { zh: '腹腔鏡', en: 'Laparoscope', icon: '🔬', color: 'bg-green-100 text-green-700' },
  microscope: { zh: '顯微鏡', en: 'Microscope', icon: '🔭', color: 'bg-purple-100 text-purple-700' },
  endoscope: { zh: '內視鏡', en: 'Endoscope', icon: '📷', color: 'bg-teal-100 text-teal-700' },
  room_camera: { zh: '手術室', en: 'Room', icon: '🎥', color: 'bg-orange-100 text-orange-700' },
  fluorescence: { zh: 'ICG', en: 'ICG', icon: '💚', color: 'bg-emerald-100 text-emerald-700' },
  other: { zh: '其他', en: 'Other', icon: '📹', color: 'bg-gray-100 text-gray-700' },
};

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { locale } = useLocale();
  const isEn = locale === 'en';

  const [session, setSession] = useState<Record<string, string> | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [layout, setLayout] = useState<'single' | 'side-by-side' | 'pip'>('single');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const primaryRef = useRef<HTMLVideoElement | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    fetch(`/api/sessions/${id}`).then(r => r.json()).then(data => {
      setSession(data.session);
      setSources(data.sources || []);
      setTranscripts(data.transcripts || []);
      setChapters(data.chapters || []);
      if (data.sources?.length) {
        const primary = data.sources.find((s: Source) => s.is_primary) || data.sources[0];
        setActiveSource(primary.id);
      }
    });
  }, [id]);

  // Sync all videos to primary timeline
  const syncVideos = useCallback((time: number) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    for (const source of sources) {
      const el = videoRefs.current[source.id];
      if (!el) continue;
      const adjustedTime = time + (source.time_offset_ms / 1000);
      if (Math.abs(el.currentTime - adjustedTime) > 0.3) {
        el.currentTime = Math.max(0, adjustedTime);
      }
    }

    syncingRef.current = false;
  }, [sources]);

  const handleTimeUpdate = useCallback(() => {
    if (!primaryRef.current) return;
    const time = primaryRef.current.currentTime;
    setCurrentTime(time);
    syncVideos(time);
  }, [syncVideos]);

  const handlePlayPause = useCallback(() => {
    const primary = primaryRef.current;
    if (!primary) return;

    if (primary.paused) {
      primary.play();
      for (const source of sources) {
        videoRefs.current[source.id]?.play();
      }
      setIsPlaying(true);
    } else {
      primary.pause();
      for (const source of sources) {
        videoRefs.current[source.id]?.pause();
      }
      setIsPlaying(false);
    }
  }, [sources]);

  const seekTo = useCallback((time: number) => {
    if (primaryRef.current) {
      primaryRef.current.currentTime = time;
      syncVideos(time);
    }
  }, [syncVideos]);

  const setVideoRef = useCallback((sourceId: string, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current[sourceId] = el;
      const source = sources.find(s => s.id === sourceId);
      if (source?.is_primary) primaryRef.current = el;
    }
  }, [sources]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const activeTranscript = transcripts.find(tr => currentTime >= tr.start_time && currentTime < tr.end_time);

  if (!session) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex items-center justify-center py-20 text-gray-400">Loading...</div></div>;

  const primarySource = sources.find(s => s.is_primary) || sources[0];
  const secondarySources = sources.filter(s => s.id !== primarySource?.id);
  const activeSourceObj = sources.find(s => s.id === activeSource) || primarySource;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/sessions" className="text-gray-400 hover:text-white text-sm">&larr; {isEn ? 'Sessions' : '案例列表'}</Link>
            <h1 className="font-semibold">{session.title}</h1>
            <span className="text-xs text-gray-400">{session.surgeon_name} · {sources.length} {isEn ? 'sources' : '個來源'}</span>
          </div>
          <div className="flex items-center gap-2">
            {(['single', 'side-by-side', 'pip'] as const).map(l => (
              <button key={l} onClick={() => setLayout(l)}
                className={`text-xs px-3 py-1.5 rounded transition ${layout === l ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                {l === 'single' ? (isEn ? 'Single' : '單一') : l === 'side-by-side' ? (isEn ? 'Split' : '並排') : 'PiP'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Main Video Area */}
          <div className="lg:col-span-3 space-y-3">
            {/* Player(s) */}
            {layout === 'single' && (
              <div className="bg-black rounded-xl overflow-hidden relative">
                {sources.map(source => (
                  <video
                    key={source.id}
                    ref={el => setVideoRef(source.id, el)}
                    src={source.file_path}
                    className={`w-full aspect-video ${source.id === (activeSourceObj?.id) ? '' : 'hidden'}`}
                    onTimeUpdate={source.is_primary ? handleTimeUpdate : undefined}
                    muted={!source.is_primary}
                  />
                ))}
                {activeTranscript && (
                  <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
                    <span className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg">{activeTranscript.text}</span>
                  </div>
                )}
              </div>
            )}

            {layout === 'side-by-side' && (
              <div className="grid grid-cols-2 gap-2">
                {sources.slice(0, 2).map(source => (
                  <div key={source.id} className="bg-black rounded-xl overflow-hidden relative">
                    <video
                      ref={el => setVideoRef(source.id, el)}
                      src={source.file_path}
                      className="w-full aspect-video"
                      onTimeUpdate={source.is_primary ? handleTimeUpdate : undefined}
                      muted={!source.is_primary}
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded ${SOURCE_INFO[source.source_type]?.color || 'bg-gray-600'}`}>
                        {SOURCE_INFO[source.source_type]?.icon} {isEn ? SOURCE_INFO[source.source_type]?.en : SOURCE_INFO[source.source_type]?.zh}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {layout === 'pip' && primarySource && (
              <div className="bg-black rounded-xl overflow-hidden relative">
                <video
                  ref={el => setVideoRef(primarySource.id, el)}
                  src={primarySource.file_path}
                  className="w-full aspect-video"
                  onTimeUpdate={handleTimeUpdate}
                />
                {secondarySources[0] && (
                  <div className="absolute bottom-4 right-4 w-1/4 rounded-lg overflow-hidden shadow-xl border-2 border-white/20">
                    <video
                      ref={el => setVideoRef(secondarySources[0].id, el)}
                      src={secondarySources[0].file_path}
                      className="w-full aspect-video"
                      muted
                    />
                    <div className="absolute top-1 left-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">
                        {SOURCE_INFO[secondarySources[0].source_type]?.icon}
                      </span>
                    </div>
                  </div>
                )}
                {activeTranscript && (
                  <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none">
                    <span className="bg-black/70 text-white text-sm px-4 py-2 rounded-lg">{activeTranscript.text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button onClick={handlePlayPause}
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition text-lg">
                {isPlaying ? '⏸' : '▶'}
              </button>
              <span className="text-sm font-mono text-gray-400">{fmt(currentTime)}</span>

              {/* Source Quick Switch (single mode) */}
              {layout === 'single' && (
                <div className="flex gap-1 flex-1 overflow-x-auto">
                  {sources.map(source => {
                    const info = SOURCE_INFO[source.source_type] || SOURCE_INFO.other;
                    return (
                      <button key={source.id} onClick={() => setActiveSource(source.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                          source.id === activeSource ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}>
                        {info.icon} {isEn ? info.en : info.zh}
                        {source.label && ` (${source.label})`}
                        {source.is_primary ? ' ★' : ''}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chapter Nav */}
              <div className="flex gap-1">
                {chapters.slice(0, 5).map(ch => (
                  <button key={ch.id} onClick={() => seekTo(ch.start_time)}
                    className={`text-xs px-2 py-1 rounded transition ${
                      currentTime >= ch.start_time && currentTime < ch.end_time ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}>
                    {isEn ? ch.title_en : ch.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-3">
            {/* Sources Panel */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3">{isEn ? 'Video Sources' : '影像來源'}</h3>
              <div className="space-y-2">
                {sources.map(source => {
                  const info = SOURCE_INFO[source.source_type] || SOURCE_INFO.other;
                  return (
                    <div key={source.id}
                      className={`p-2 rounded-lg cursor-pointer transition ${source.id === activeSource ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                      onClick={() => { setActiveSource(source.id); setLayout('single'); }}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{isEn ? info.en : info.zh}{source.label && ` — ${source.label}`}</p>
                          <p className="text-xs text-gray-400 truncate">{source.video_title}</p>
                        </div>
                        {source.is_primary ? <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">{isEn ? 'Main' : '主要'}</span> : null}
                      </div>
                      {source.time_offset_ms !== 0 && (
                        <p className="text-xs text-gray-500 mt-1 ml-8">{isEn ? 'Offset' : '偏移'}: {source.time_offset_ms > 0 ? '+' : ''}{source.time_offset_ms}ms</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-3">{isEn ? 'Transcript' : '逐字稿'}</h3>
              {transcripts.length === 0 ? (
                <p className="text-xs text-gray-500">{isEn ? 'No transcript available' : '無逐字稿'}</p>
              ) : transcripts.map(tr => (
                <button key={tr.id} onClick={() => seekTo(tr.start_time)}
                  className={`w-full text-left p-1.5 rounded text-xs transition ${
                    activeTranscript?.id === tr.id ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-gray-200'
                  }`}>
                  <span className="font-mono text-blue-400 mr-1">{fmt(tr.start_time)}</span>{tr.text}
                </button>
              ))}
            </div>

            {/* Layout Help */}
            <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-400">{isEn ? 'Layout Modes' : '佈局模式'}</p>
              <p>• <strong>{isEn ? 'Single' : '單一'}</strong>: {isEn ? 'Switch between sources' : '切換不同鏡頭來源'}</p>
              <p>• <strong>{isEn ? 'Split' : '並排'}</strong>: {isEn ? 'Two sources side by side' : '兩個來源並排播放'}</p>
              <p>• <strong>PiP</strong>: {isEn ? 'Picture-in-picture overlay' : '子母畫面重疊'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
