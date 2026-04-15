import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';
import { transcribeWithWhisper, generateTeachingMaterials } from '@/lib/ai';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId } = await request.json();
    if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

    const db = getDb();
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId) as {
      id: string; title: string; file_path: string; surgery_type: string;
      reference_materials: string; terminology_list: string; expected_steps: string;
      surgeon_id: string;
    } | undefined;

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    // Update status to processing
    db.prepare("UPDATE videos SET processing_status = 'processing', updated_at = datetime('now') WHERE id = ?").run(videoId);

    try {
      // Step 1: Transcribe
      const audioPath = path.join(process.cwd(), 'public', video.file_path);
      const segments = await transcribeWithWhisper(audioPath);

      // Step 1.5: Auto-correct using surgeon's learned patterns + terminology
      const correctionRules = db.prepare(
        'SELECT original_text, corrected_text FROM corrections WHERE surgeon_id = ? AND is_auto_rule = 1 AND applied_count >= 2 ORDER BY applied_count DESC'
      ).all(video.surgeon_id) as Array<{ original_text: string; corrected_text: string }>;

      const terminologyTerms = db.prepare(
        'SELECT zh, en FROM terminology WHERE is_global = 1 OR surgeon_id = ?'
      ).all(video.surgeon_id) as Array<{ zh: string; en: string }>;

      // Also parse custom terminology from upload
      const customTerms: Array<{ zh: string; en: string }> = [];
      if (video.terminology_list) {
        for (const line of video.terminology_list.split('\n')) {
          const parts = line.split(/[=＝]/);
          if (parts.length === 2) {
            customTerms.push({ zh: parts[0].trim(), en: parts[1].trim() });
          }
        }
      }

      // Apply auto-corrections to transcribed segments
      for (const seg of segments) {
        let text = seg.text;
        for (const rule of correctionRules) {
          text = text.split(rule.original_text).join(rule.corrected_text);
        }
        seg.text = text;
      }

      // Save transcripts
      const insertTranscript = db.prepare(
        'INSERT INTO transcripts (id, video_id, start_time, end_time, text, confidence) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const seg of segments) {
        insertTranscript.run(randomUUID(), videoId, seg.start, seg.end, seg.text, 1.0);
      }

      // Update duration from last segment
      if (segments.length > 0) {
        const duration = segments[segments.length - 1].end;
        db.prepare('UPDATE videos SET duration = ? WHERE id = ?').run(duration, videoId);
      }

      // Step 2: Generate teaching materials
      const fullTranscript = segments.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n');

      // Build enriched context with reference materials + terminology
      let enrichedContext = '';
      if (video.reference_materials) {
        enrichedContext += `\n\n【課程講義/手術計畫】\n${video.reference_materials}`;
      }
      if (video.expected_steps) {
        enrichedContext += `\n\n【預期手術步驟】\n${video.expected_steps}`;
      }
      if (customTerms.length > 0 || terminologyTerms.length > 0) {
        const allTerms = [...customTerms, ...terminologyTerms.slice(0, 30)];
        enrichedContext += `\n\n【術語對照表】\n${allTerms.map(t => `${t.zh} = ${t.en}`).join('\n')}`;
      }

      let materials;
      if (process.env.ANTHROPIC_API_KEY) {
        materials = await generateTeachingMaterials(fullTranscript + enrichedContext, video.title, video.surgery_type);
      } else {
        // Demo materials
        materials = generateDemoMaterials(video.title, segments);
      }

      // Save summary
      db.prepare(
        'INSERT INTO teaching_materials (id, video_id, type, content, content_en) VALUES (?, ?, ?, ?, ?)'
      ).run(randomUUID(), videoId, 'summary', materials.summary, materials.summary_en);

      // Save chapters
      const insertChapter = db.prepare(
        'INSERT INTO chapters (id, video_id, title, title_en, start_time, end_time, summary, summary_en, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      materials.chapters.forEach((ch, i) => {
        insertChapter.run(randomUUID(), videoId, ch.title, ch.title_en, ch.startTime, ch.endTime, ch.summary, ch.summary_en, i);
      });

      // Save key moments as annotations
      const insertAnnotation = db.prepare(
        'INSERT INTO annotations (id, video_id, timestamp, type, label, label_en, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      materials.keyMoments.forEach(km => {
        insertAnnotation.run(randomUUID(), videoId, km.timestamp, 'key_moment', km.label, km.label_en, km.description);
      });

      // Save steps
      const insertStep = db.prepare(
        'INSERT INTO teaching_materials (id, video_id, type, content, content_en, metadata) VALUES (?, ?, ?, ?, ?, ?)'
      );
      materials.steps.forEach(step => {
        insertStep.run(randomUUID(), videoId, 'step', JSON.stringify({
          step: step.step, title: step.title, description: step.description,
          startTime: step.startTime, endTime: step.endTime,
        }), JSON.stringify({
          step: step.step, title: step.title_en, description: step.description_en,
          startTime: step.startTime, endTime: step.endTime,
        }), JSON.stringify({ startTime: step.startTime, endTime: step.endTime }));
      });

      // Update status to completed
      db.prepare("UPDATE videos SET processing_status = 'completed', updated_at = datetime('now') WHERE id = ?").run(videoId);

      return NextResponse.json({ success: true, message: 'Processing completed' });
    } catch (processError) {
      db.prepare("UPDATE videos SET processing_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(videoId);
      throw processError;
    }
  } catch (error) {
    console.error('AI process error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function generateDemoMaterials(title: string, segments: Array<{ start: number; end: number; text: string }>) {
  const totalDuration = segments.length > 0 ? segments[segments.length - 1].end : 300;
  const chapterDuration = totalDuration / 5;

  return {
    summary: `本影片為「${title}」教學示範。影片詳細展示了完整的手術流程，包括術前準備、器械配置、解剖結構辨識、手術操作步驟及術後確認。特別強調了安全操作要點和解剖辨識的重要性。適合 PGY2-4 住院醫師學習參考。`,
    summary_en: `This video demonstrates "${title}". It covers the complete surgical workflow including preoperative preparation, instrument setup, anatomical identification, surgical steps, and postoperative verification. Safety principles and anatomical recognition are emphasized. Suitable for PGY2-4 residents.`,
    chapters: [
      { title: '術前準備與器械配置', title_en: 'Preoperative Preparation', startTime: 0, endTime: chapterDuration, summary: '確認患者資料、手術適應症及器械準備', summary_en: 'Patient verification, surgical indications, and instrument preparation' },
      { title: '手術入路與暴露', title_en: 'Surgical Approach & Exposure', startTime: chapterDuration, endTime: chapterDuration * 2, summary: '建立手術通道，暴露手術區域', summary_en: 'Establishing surgical access and exposing the operative field' },
      { title: '關鍵解剖辨識', title_en: 'Critical Anatomy Identification', startTime: chapterDuration * 2, endTime: chapterDuration * 3, summary: '辨識並確認關鍵解剖結構', summary_en: 'Identifying and confirming critical anatomical structures' },
      { title: '核心手術操作', title_en: 'Core Surgical Procedure', startTime: chapterDuration * 3, endTime: chapterDuration * 4, summary: '執行主要手術步驟', summary_en: 'Performing the main surgical steps' },
      { title: '確認與結束', title_en: 'Verification & Closure', startTime: chapterDuration * 4, endTime: totalDuration, summary: '確認止血、檢查手術區域並關閉', summary_en: 'Hemostasis check, surgical field inspection, and closure' },
    ],
    keyMoments: [
      { timestamp: chapterDuration * 0.5, label: '重要：器械確認', label_en: 'Important: Instrument Check', description: '確認所有必要器械已準備就緒', description_en: 'Verify all necessary instruments are ready' },
      { timestamp: chapterDuration * 2.5, label: '關鍵：安全視野確認', label_en: 'Critical: Safety View Confirmation', description: '達成 Critical View of Safety', description_en: 'Achieving Critical View of Safety' },
      { timestamp: chapterDuration * 3.5, label: '技巧要點', label_en: 'Technical Key Point', description: '注意分離平面的選擇和止血技巧', description_en: 'Note the dissection plane selection and hemostasis technique' },
    ],
    steps: [
      { step: 1, title: '患者準備', title_en: 'Patient Preparation', description: '確認患者身份、手術部位及手術同意書', description_en: 'Verify patient identity, surgical site, and consent', startTime: 0, endTime: chapterDuration * 0.5 },
      { step: 2, title: '建立手術通道', title_en: 'Establish Surgical Access', description: '建立適當的手術入路', description_en: 'Establish appropriate surgical approach', startTime: chapterDuration * 0.5, endTime: chapterDuration * 1.5 },
      { step: 3, title: '解剖結構辨識', title_en: 'Anatomical Identification', description: '清楚辨識並標記所有關鍵解剖結構', description_en: 'Clearly identify and mark all critical anatomical structures', startTime: chapterDuration * 1.5, endTime: chapterDuration * 2.5 },
      { step: 4, title: '手術切除/修復', title_en: 'Resection/Repair', description: '在確認安全後執行主要手術操作', description_en: 'Perform the main surgical procedure after confirming safety', startTime: chapterDuration * 2.5, endTime: chapterDuration * 4 },
      { step: 5, title: '止血與關閉', title_en: 'Hemostasis & Closure', description: '仔細檢查止血情況，逐層關閉手術切口', description_en: 'Carefully check hemostasis and close the surgical incision layer by layer', startTime: chapterDuration * 4, endTime: totalDuration },
    ],
  };
}
