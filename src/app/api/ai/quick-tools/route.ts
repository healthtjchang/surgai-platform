import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// POST: Generate quick teaching content
// body: { videoId, tool: 'quiz' | 'keypoints' | 'pearls' | 'checklist' | 'subtitle_refine' }
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, tool } = await request.json();
    if (!videoId || !tool) return NextResponse.json({ error: 'videoId and tool required' }, { status: 400 });

    const db = getDb();
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId) as Record<string, string> | undefined;
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const transcripts = db.prepare('SELECT * FROM transcripts WHERE video_id = ? ORDER BY start_time').all(videoId) as Array<{ start_time: number; text: string }>;
    const fullTranscript = transcripts.map(t => `[${Math.floor(t.start_time / 60)}:${String(Math.floor(t.start_time % 60)).padStart(2, '0')}] ${t.text}`).join('\n');

    const materials = db.prepare("SELECT content FROM teaching_materials WHERE video_id = ? AND type = 'summary'").get(videoId) as { content: string } | undefined;

    const prompts: Record<string, string> = {
      quiz: `Based on this surgical video transcript, generate 5 multiple-choice quiz questions for surgical trainees. Each question should have 4 options (A-D) with the correct answer marked. Focus on anatomy, surgical technique, safety principles, and decision-making.

Format as JSON (no markdown):
{"questions":[{"q":"question","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"..."}]}`,

      keypoints: `Extract the top 10 key learning points from this surgical video, organized by importance. Each point should be a concise, actionable takeaway for surgical trainees.

Format as JSON (no markdown):
{"keypoints":[{"point":"...","category":"anatomy|technique|safety|decision","importance":"critical|high|normal"}]}`,

      pearls: `Generate 5 "clinical pearls" (practical tips) from this surgical video that would be valuable for residents. Each pearl should be a concise, memorable, and practical insight.

Format as JSON (no markdown):
{"pearls":[{"pearl":"...","context":"when/where this applies","tip":"practical how-to"}]}`,

      checklist: `Create a surgical safety checklist based on this video, with items grouped by phase (pre-op, intra-op, post-op). Each item should be actionable and specific.

Format as JSON (no markdown):
{"checklist":{"preop":[{"item":"...","critical":true}],"intraop":[{"item":"...","critical":true}],"postop":[{"item":"...","critical":false}]}}`,

      subtitle_refine: `Review this surgical video transcript and correct any obvious medical terminology errors. Return the corrected transcript segments. Only modify segments that have errors.

Format as JSON (no markdown):
{"corrections":[{"original":"original text","corrected":"corrected text","reason":"why corrected"}]}`,
    };

    const prompt = prompts[tool];
    if (!prompt) return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });

    let result;

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are a surgical education expert. All responses in Traditional Chinese (繁體中文) unless the content is a medical term that should be bilingual.

Video: ${video.title}
Summary: ${materials?.content || 'N/A'}

Transcript:
${fullTranscript.slice(0, 4000)}

Task: ${prompt}`
        }]
      });
      const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
      result = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } else {
      result = getDemoResult(tool, video.title as string);
    }

    // Save generated content
    db.prepare('INSERT INTO teaching_materials (id, video_id, type, content, content_en, metadata) VALUES (?,?,?,?,?,?)')
      .run(randomUUID(), videoId, `ai_${tool}`, JSON.stringify(result), '', JSON.stringify({ tool, generatedAt: new Date().toISOString() }));

    return NextResponse.json({ result, tool });
  } catch (error) {
    console.error('Quick tool error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

function getDemoResult(tool: string, title: string) {
  if (tool === 'quiz') {
    return { questions: [
      { q: `在${title}中，達成 Critical View of Safety 需要確認幾條結構連接膽囊？`, options: ['A. 1 條', 'B. 2 條', 'C. 3 條', 'D. 4 條'], answer: 'B', explanation: 'CVS 要求在 Calot\'s triangle 中僅有兩條管狀結構（膽囊管和膽囊動脈）連接膽囊。' },
      { q: '建立氣腹時，CO2 壓力應維持在多少 mmHg？', options: ['A. 5-8 mmHg', 'B. 8-10 mmHg', 'C. 12-15 mmHg', 'D. 18-20 mmHg'], answer: 'C', explanation: '標準腹腔鏡手術的氣腹壓力維持在 12-15 mmHg。' },
      { q: '膽囊動脈通常來自哪條血管的分支？', options: ['A. 左肝動脈', 'B. 右肝動脈', 'C. 胃十二指腸動脈', 'D. 腸繫膜上動脈'], answer: 'B', explanation: '膽囊動脈通常由右肝動脈分支而來，但解剖變異率高。' },
      { q: '大於幾 mm 的 trocar 傷口需要縫合筋膜？', options: ['A. 3mm', 'B. 5mm', 'C. 10mm', 'D. 12mm'], answer: 'C', explanation: '≥10mm 的 trocar 傷口需縫合筋膜以預防切口疝氣。' },
      { q: 'Calot\'s triangle 由哪三個結構構成邊界？', options: ['A. 膽囊管、肝總管、肝臟下緣', 'B. 膽囊管、總膽管、十二指腸', 'C. 膽囊動脈、門靜脈、肝臟', 'D. 膽囊管、膽囊動脈、腹壁'], answer: 'A', explanation: 'Calot\'s triangle 由膽囊管、肝總管（Common Hepatic Duct）和肝臟下緣構成。' },
    ]};
  }
  if (tool === 'keypoints') {
    return { keypoints: [
      { point: '必須達成 Critical View of Safety (CVS) 後才能切斷任何結構', category: 'safety', importance: 'critical' },
      { point: '氣腹壓力維持 12-15 mmHg，過高影響靜脈回流', category: 'technique', importance: 'critical' },
      { point: '辨識膽囊管和膽囊動脈是手術最關鍵的步驟', category: 'anatomy', importance: 'critical' },
      { point: '沿正確的解剖平面分離膽囊，避免進入肝實質', category: 'technique', importance: 'high' },
      { point: '夾子放置：近端 2 個、遠端 1 個', category: 'technique', importance: 'high' },
      { point: '確認無膽汁滲漏和活動性出血後才能結束手術', category: 'safety', importance: 'high' },
      { point: '≥10mm trocar 傷口需縫合筋膜預防疝氣', category: 'technique', importance: 'normal' },
      { point: '使用取物袋取出膽囊以避免傷口污染', category: 'technique', importance: 'normal' },
    ]};
  }
  if (tool === 'pearls') {
    return { pearls: [
      { pearl: '永遠不要在「看起來像」的時候切——要在「確定是」的時候切', context: '辨識膽囊管 vs 總膽管', tip: '達成 CVS 三要素後才下刀' },
      { pearl: '牽引方向決定暴露品質', context: '暴露 Calot\'s triangle', tip: '膽囊底部向頭側、右側牽引，頸部向外下方' },
      { pearl: '「如果出血了先不要慌」——盲目夾止血比出血本身更危險', context: '術中出血處理', tip: '先壓迫止血，看清楚再處理' },
    ]};
  }
  if (tool === 'checklist') {
    return { checklist: {
      preop: [
        { item: '確認患者身份與手術部位', critical: true },
        { item: '檢查影像資料（超音波/CT）', critical: true },
        { item: '確認器械完整（腹腔鏡、夾子、電燒）', critical: true },
      ],
      intraop: [
        { item: '氣腹壓力 12-15 mmHg', critical: true },
        { item: '達成 Critical View of Safety', critical: true },
        { item: '確認夾子位置正確後再切斷', critical: true },
        { item: '檢查肝床止血情況', critical: false },
        { item: '使用取物袋取出檢體', critical: false },
      ],
      postop: [
        { item: '確認無膽汁滲漏', critical: true },
        { item: '≥10mm trocar 傷口縫合筋膜', critical: false },
        { item: '清點器械和紗布', critical: true },
      ],
    }};
  }
  return { corrections: [] };
}
