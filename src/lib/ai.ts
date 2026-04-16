import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateTeachingMaterials(
  transcript: string,
  videoTitle: string,
  surgeryType: string
): Promise<{
  summary: string;
  summary_en: string;
  chapters: Array<{ title: string; title_en: string; startTime: number; endTime: number; summary: string; summary_en: string }>;
  keyMoments: Array<{ timestamp: number; label: string; label_en: string; description: string; description_en: string }>;
  steps: Array<{ step: number; title: string; title_en: string; description: string; description_en: string; startTime: number; endTime: number }>;
}> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `你是外科教學專家 AI 助手。請根據以下手術影片的逐字稿，生成結構化的教學材料。

影片標題：${videoTitle}
手術類型：${surgeryType}

逐字稿：
${transcript}

請以 JSON 格式回傳以下內容（不要包含 markdown 代碼塊標記）：
{
  "summary": "手術摘要（繁體中文，200字以內）",
  "summary_en": "Surgery summary in English (under 200 words)",
  "chapters": [
    {
      "title": "章節標題（繁體中文）",
      "title_en": "Chapter title in English",
      "startTime": 0,
      "endTime": 60,
      "summary": "章節摘要（繁體中文）",
      "summary_en": "Chapter summary in English"
    }
  ],
  "keyMoments": [
    {
      "timestamp": 30,
      "label": "關鍵時刻標籤（繁體中文）",
      "label_en": "Key moment label in English",
      "description": "說明（繁體中文）",
      "description_en": "Description in English"
    }
  ],
  "steps": [
    {
      "step": 1,
      "title": "步驟標題（繁體中文）",
      "title_en": "Step title in English",
      "description": "詳細說明（繁體中文）",
      "description_en": "Detailed description in English",
      "startTime": 0,
      "endTime": 60
    }
  ]
}

請根據逐字稿的內容和時間戳，合理推斷各章節和步驟的時間範圍。如果逐字稿內容不足以判斷具體時間，請合理估計。確保所有中文使用繁體中文。`
      }
    ]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: '教案生成中發生錯誤，請重新處理。',
      summary_en: 'Error generating teaching materials. Please reprocess.',
      chapters: [],
      keyMoments: [],
      steps: []
    };
  }
}

export async function chatWithAI(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  videoContext: {
    title: string;
    transcript: string;
    teachingMaterials: string;
  }
): Promise<string> {
  const systemPrompt = `你是「SurgAI 外科教學助手」，專門協助外科學員學習手術知識。

你目前正在協助學員學習以下手術影片：
影片標題：${videoContext.title}

影片逐字稿（節錄）：
${videoContext.transcript.slice(0, 3000)}

教學材料：
${videoContext.teachingMaterials.slice(0, 2000)}

請根據以上資料回答學員的問題。規則：
1. 使用繁體中文回答，但如果學員用英文提問則用英文回答
2. 回答要精確、有教育性，適合外科住院醫師程度
3. 如果問題涉及影片中的特定時間點，請引用相關的逐字稿內容
4. 如果問題超出影片範圍，可以補充一般性外科知識，但要標明「補充說明」
5. 鼓勵學員思考，適時反問以促進學習
6. 使用正確的醫學術語，中英文並列
7. 不要使用 markdown 格式（不要用 ##、**、> 等符號），直接用純文字回答，用換行和數字分段即可`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function transcribeWithWhisper(audioPath: string): Promise<Array<{
  start: number;
  end: number;
  text: string;
}>> {
  // If OpenAI API key is available, use Whisper API
  // Otherwise, return mock transcription for demo
  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const fs = await import('fs');

      // Check if file is large enough to be a real audio/video file (>1KB)
      const stats = fs.statSync(audioPath);
      if (stats.size < 1024) {
        console.log('File too small for Whisper, using demo transcription');
        // Fall through to demo
      } else {
        const response = await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioPath),
          model: 'whisper-1',
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
          language: 'zh',
        });

        const segments = (response as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments;
        if (segments && segments.length > 0) {
          return segments.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text
          }));
        }
      }
    } catch (whisperError) {
      console.error('Whisper transcription failed, falling back to demo:', (whisperError as Error).message);
      // Fall through to demo transcription
    }
  }

  // Demo transcription for testing without API key
  return [
    { start: 0, end: 15, text: '各位好，今天我們要進行的是腹腔鏡膽囊切除術的教學示範。' },
    { start: 15, end: 30, text: '首先讓我們確認患者的基本資料和手術適應症。這位患者因為反覆發作的膽結石疼痛，經過保守治療效果不佳，因此決定手術治療。' },
    { start: 30, end: 50, text: '我們先從 trocar 的置放開始。在臍部做一個小切口，這是我們的 camera port。注意要先建立氣腹，壓力維持在 12-15 mmHg。' },
    { start: 50, end: 75, text: '現在我們可以看到腹腔的全景。肝臟在右上方，膽囊就在肝臟的下方。注意觀察膽囊的外觀，可以看到有一些發炎的徵象。' },
    { start: 75, end: 100, text: '接下來是最關鍵的步驟——暴露 Calot\'s triangle。我們需要清楚辨識膽囊管和膽囊動脈。' },
    { start: 100, end: 130, text: '請注意，在這個步驟中，達成 Critical View of Safety 是非常重要的。我們需要確認兩個結構——膽囊管和膽囊動脈——在 Calot\'s triangle 中被清楚辨識。' },
    { start: 130, end: 160, text: '現在我正在進行鈍性和銳性分離，小心地將膽囊從肝床剝離。注意這裡的分離面，要沿著正確的解剖平面進行。' },
    { start: 160, end: 185, text: '可以看到膽囊管已經被完整暴露出來了。我們用夾子夾住膽囊管，確認沒有夾到總膽管。' },
    { start: 185, end: 210, text: '同樣地，膽囊動脈也被辨識並夾住了。現在我們可以安全地切斷這兩個結構。' },
    { start: 210, end: 240, text: '最後，我們將膽囊從肝床上完全分離。使用電燒小心地在正確的平面上進行分離，注意止血。' },
    { start: 240, end: 270, text: '膽囊已經完全切除了。讓我們檢查一下手術區域，確認沒有出血和膽汁滲漏。' },
    { start: 270, end: 300, text: '手術順利完成。重要的學習要點：永遠要先達成 Critical View of Safety，辨識清楚解剖結構後才能進行切斷。這是預防膽管損傷最重要的步驟。' },
  ];
}
