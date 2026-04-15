import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

// POST: Extract medical terminology from user-provided text
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    let extracted;

    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `從以下外科手術相關文字中提取所有醫學專有名詞，並生成中英文對照表。

文字：
${text}

請以 JSON 格式回傳（不要 markdown 代碼塊標記）：
{
  "terms": [
    { "zh": "中文術語", "en": "English Term", "category": "anatomy|instrument|procedure|pathology|medication|other" }
  ],
  "steps": [
    { "zh": "步驟名稱（中文）", "en": "Step Name (English)" }
  ],
  "instruments": [
    { "zh": "器械名稱（中文）", "en": "Instrument Name (English)" }
  ]
}

規則：
- 所有中文使用繁體中文
- category 只能是上述選項之一
- 提取所有解剖結構、器械、手術操作、病理名詞、藥物名稱
- steps 提取文字中提到的手術步驟（按順序）
- instruments 提取文字中提到的手術器械`
        }]
      });

      const respText = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const cleaned = respText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extracted = JSON.parse(cleaned);
    } else {
      // Demo extraction: simple pattern matching
      extracted = demoExtract(text);
    }

    return NextResponse.json({
      extracted,
      message: `已提取 ${extracted.terms?.length || 0} 個術語、${extracted.steps?.length || 0} 個步驟、${extracted.instruments?.length || 0} 個器械`,
    });
  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}

function demoExtract(text: string) {
  // Known medical terms to match against
  const knownTerms: Array<{ zh: string; en: string; category: string }> = [
    { zh: '膽囊', en: 'Gallbladder', category: 'anatomy' },
    { zh: '膽囊管', en: 'Cystic Duct', category: 'anatomy' },
    { zh: '膽囊動脈', en: 'Cystic Artery', category: 'anatomy' },
    { zh: '總膽管', en: 'Common Bile Duct', category: 'anatomy' },
    { zh: '闌尾', en: 'Appendix', category: 'anatomy' },
    { zh: '甲狀腺', en: 'Thyroid', category: 'anatomy' },
    { zh: '返喉神經', en: 'Recurrent Laryngeal Nerve', category: 'anatomy' },
    { zh: '腹腔鏡', en: 'Laparoscope', category: 'instrument' },
    { zh: '電燒', en: 'Electrocautery', category: 'instrument' },
    { zh: '超音波刀', en: 'Harmonic Scalpel', category: 'instrument' },
    { zh: '止血鉗', en: 'Hemostatic Clamp', category: 'instrument' },
    { zh: '氣腹', en: 'Pneumoperitoneum', category: 'procedure' },
    { zh: '止血', en: 'Hemostasis', category: 'procedure' },
    { zh: '縫合', en: 'Suture', category: 'procedure' },
    { zh: '切開', en: 'Incision', category: 'procedure' },
    { zh: '結紮', en: 'Ligation', category: 'procedure' },
    { zh: '沾黏', en: 'Adhesion', category: 'pathology' },
    { zh: '出血', en: 'Hemorrhage', category: 'pathology' },
    { zh: '腫瘤', en: 'Tumor', category: 'pathology' },
    { zh: '發炎', en: 'Inflammation', category: 'pathology' },
  ];

  const found = knownTerms.filter(t => text.includes(t.zh));
  return {
    terms: found,
    steps: [],
    instruments: found.filter(t => t.category === 'instrument'),
  };
}
