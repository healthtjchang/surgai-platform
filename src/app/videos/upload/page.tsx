'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import Navbar from '@/components/layout/Navbar';

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [surgeryType, setSurgeryType] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [description, setDescription] = useState('');
  const [referenceMaterials, setReferenceMaterials] = useState('');
  const [terminologyList, setTerminologyList] = useState('');
  const [expectedSteps, setExpectedSteps] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('video/')) {
      setFile(droppedFile);
      if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;
    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('surgeryType', surgeryType);
      formData.append('difficulty', difficulty);
      formData.append('description', description);
      formData.append('referenceMaterials', referenceMaterials);
      formData.append('terminologyList', terminologyList);
      formData.append('expectedSteps', expectedSteps);

      setProgress(30);
      const res = await fetch('/api/videos', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setProgress(60);

      // Trigger AI processing
      await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: data.video.id }),
      });
      setProgress(100);

      router.push(`/videos/${data.video.id}`);
    } catch {
      alert('上傳失敗，請重試');
      setUploading(false);
      setProgress(0);
    }
  };

  const surgeryTypes = [
    'laparoscopic_cholecystectomy', 'appendectomy', 'hernia_repair',
    'thyroidectomy', 'colectomy', 'gastrectomy', 'other',
  ];
  const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('video.upload.title')}</h1>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              dragOver ? 'border-blue-500 bg-[rgba(6,182,212,0.08)]' : file ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {file ? (
              <div>
                <p className="text-4xl mb-4">✅</p>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                <button type="button" onClick={() => setFile(null)} className="mt-3 text-sm text-red-600 hover:underline">移除</button>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-4">📤</p>
                <p className="text-[var(--text-secondary)] mb-2">{t('video.upload.dragDrop')}</p>
                <p className="text-sm text-[var(--text-tertiary)]">{t('video.upload.supported')}</p>
                <label className="mt-4 inline-block px-6 py-2 btn-primary rounded-lg cursor-pointer  transition">
                  選擇檔案
                  <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="card rounded-xl border p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('video.upload.videoTitle')} *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="例：腹腔鏡膽囊切除術教學" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('video.upload.surgeryType')}</label>
                <select value={surgeryType} onChange={e => setSurgeryType(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- 選擇 --</option>
                  {surgeryTypes.map(st => (
                    <option key={st} value={st}>{t(`video.surgeryTypes.${st}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('video.upload.difficulty')}</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {difficulties.map(d => (
                    <option key={d} value={d}>{t(`video.difficulties.${d}`)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{t('video.upload.description')}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="術式說明、教學重點、特殊注意事項..." />
            </div>
          </div>

          {/* Course Reference Materials (Advanced) */}
          <div className="card rounded-xl border overflow-hidden">
            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between p-6 hover:bg-[var(--bg-base)] transition">
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <div className="text-left">
                  <p className="font-medium text-sm">課程資料與 AI 校正輔助</p>
                  <p className="text-xs text-[var(--text-tertiary)]">提供參考資料可大幅提升 AI 辨識精準度（選填）</p>
                </div>
              </div>
              <span className={`text-[var(--text-tertiary)] transition ${showAdvanced ? 'rotate-180' : ''}`}>&#9660;</span>
            </button>
            {showAdvanced && (
              <div className="px-6 pb-6 space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    📝 課程講義 / 手術計畫
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">貼上手術步驟或教學講義內容</span>
                  </label>
                  <textarea value={referenceMaterials} onChange={e => setReferenceMaterials(e.target.value)} rows={4}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                    placeholder="例：&#10;1. 建立氣腹 (12-15mmHg)&#10;2. 置放 4 個 trocar&#10;3. 暴露 Calot's triangle&#10;4. 達成 Critical View of Safety&#10;5. 夾閉並切斷膽囊管與膽囊動脈&#10;6. 從肝床分離膽囊&#10;7. 檢查止血後取出膽囊" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    📖 專用術語清單
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">AI 轉譯時會優先使用這些術語</span>
                  </label>
                  <textarea value={terminologyList} onChange={e => setTerminologyList(e.target.value)} rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                    placeholder="每行一個術語，格式：中文 = English&#10;例：&#10;膽囊三角 = Calot's Triangle&#10;安全視野 = Critical View of Safety&#10;氣腹 = Pneumoperitoneum" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    📋 預期手術步驟
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">AI 會根據這些步驟自動分段</span>
                  </label>
                  <textarea value={expectedSteps} onChange={e => setExpectedSteps(e.target.value)} rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                    placeholder="每行一個步驟，例：&#10;術前準備與定位&#10;建立氣腹與 trocar 置放&#10;Calot's triangle 暴露&#10;Critical View of Safety 確認&#10;膽囊切除與取出" />
                </div>
                <div className="bg-[rgba(6,182,212,0.08)] rounded-lg p-3 text-xs text-[var(--cyan-bright)]">
                  💡 提供越多參考資料，AI 轉譯和教案生成的準確度越高。這些資料也會用於術語對照和自動校正。
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {uploading && (
            <div className="card rounded-xl border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{progress < 60 ? '上傳中...' : progress < 100 ? 'AI 處理中...' : '完成！'}</span>
                <span className="text-sm text-[var(--text-tertiary)]">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={!file || !title || uploading}
            className="w-full py-4 btn-primary rounded-xl font-semibold text-lg  transition disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? t('video.upload.uploading') : t('video.upload.uploadButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
