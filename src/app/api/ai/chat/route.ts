import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';
import { chatWithAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoId, message, conversationId, currentTime } = await request.json();
    if (!videoId || !message) {
      return NextResponse.json({ error: 'Video ID and message required' }, { status: 400 });
    }

    const db = getDb();

    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(videoId) as {
      id: string; title: string;
    } | undefined;
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const transcripts = db.prepare('SELECT * FROM transcripts WHERE video_id = ? ORDER BY start_time').all(videoId) as Array<{ start_time: number; end_time: number; text: string }>;
    const materials = db.prepare('SELECT * FROM teaching_materials WHERE video_id = ?').all(videoId) as Array<{ type: string; content: string }>;
    const annotations = db.prepare('SELECT * FROM annotations WHERE video_id = ? ORDER BY timestamp').all(videoId) as Array<{ timestamp: number; label: string; description: string }>;
    const chapters = db.prepare('SELECT * FROM chapters WHERE video_id = ? ORDER BY order_index').all(videoId) as Array<{ title: string; start_time: number; end_time: number; summary: string }>;

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    // === TIMESTAMP-AWARE CONTEXT ===
    let currentContext = '';
    const t = typeof currentTime === 'number' ? currentTime : null;

    if (t !== null) {
      // Find current chapter
      const currentChapter = chapters.find(c => t >= c.start_time && t < c.end_time);
      // Get transcript segments within ±20 seconds of current time
      const nearbyTranscripts = transcripts.filter(tr => Math.abs(tr.start_time - t) < 20 || (t >= tr.start_time && t < tr.end_time));
      // Get annotations within ±10 seconds
      const nearbyAnnotations = annotations.filter(a => Math.abs(a.timestamp - t) < 10);

      currentContext = `\n\n=== 學員當前正在觀看 ===\n目前播放時間：${fmt(t)}\n`;
      if (currentChapter) {
        currentContext += `目前章節：${currentChapter.title}\n章節摘要：${currentChapter.summary}\n`;
      }
      if (nearbyTranscripts.length > 0) {
        currentContext += `\n當前時間點前後的逐字稿（±20秒）：\n`;
        nearbyTranscripts.forEach(tr => {
          currentContext += `[${fmt(tr.start_time)}] ${tr.text}\n`;
        });
      }
      if (nearbyAnnotations.length > 0) {
        currentContext += `\n當前時間點附近的標註：\n`;
        nearbyAnnotations.forEach(a => {
          currentContext += `[${fmt(a.timestamp)}] ${a.label}: ${a.description}\n`;
        });
      }
      currentContext += `\n=== 回答重點 ===\n請優先根據「學員當前正在觀看」的內容回答。如果學員問「這個結構是什麼」「這個步驟」等指代性問題，指的就是上面 ${fmt(t)} 時間點的內容。\n`;
    }

    const transcript = transcripts.map(tr => `[${fmt(tr.start_time)}] ${tr.text}`).join('\n');
    const teachingContent = materials.map(m => m.content).join('\n\n');

    let convoId = conversationId;
    let messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (convoId) {
      const convo = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convoId) as { messages: string } | undefined;
      if (convo) messages = JSON.parse(convo.messages);
    } else {
      convoId = randomUUID();
    }

    messages.push({ role: 'user', content: message });

    let reply: string;
    if (process.env.ANTHROPIC_API_KEY) {
      reply = await chatWithAI(messages, {
        title: video.title,
        transcript: transcript + currentContext,
        teachingMaterials: teachingContent,
      });
    } else {
      reply = generateDemoReply(message, video.title, transcript, t, transcripts);
    }

    messages.push({ role: 'assistant', content: reply });

    const existing = db.prepare('SELECT id FROM conversations WHERE id = ?').get(convoId);
    if (existing) {
      db.prepare("UPDATE conversations SET messages = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(messages), convoId);
    } else {
      db.prepare('INSERT INTO conversations (id, video_id, user_id, title, messages) VALUES (?, ?, ?, ?, ?)').run(convoId, videoId, user.id, message.slice(0, 50), JSON.stringify(messages));
    }

    return NextResponse.json({ reply, conversationId: convoId, contextTime: t });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

function generateDemoReply(question: string, title: string, transcript: string, currentTime: number | null, transcripts: Array<{ start_time: number; text: string }>): string {
  const q = question.toLowerCase();
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const timeHint = currentTime !== null ? `（當前播放時間：${fmt(currentTime)}）\n\n` : '';

  // Find the nearest transcript segment
  let nearbyText = '';
  if (currentTime !== null) {
    const nearest = transcripts.find(tr => Math.abs(tr.start_time - currentTime) < 15);
    if (nearest) {
      nearbyText = `在 ${fmt(nearest.start_time)} 附近的手術內容：「${nearest.text}」\n\n`;
    }
  }

  if (q.includes('結構') || q.includes('anatomy') || q.includes('什麼')) {
    return `${timeHint}${nearbyText}解剖結構說明\n\n根據「${title}」影片內容，在手術過程中涉及的主要解剖結構包括：\n\n1. Calot's Triangle（膽囊三角）：由膽囊管、肝總管和肝臟下緣所構成的三角區域\n2. 膽囊管（Cystic Duct）：連接膽囊與總膽管的管道\n3. 膽囊動脈（Cystic Artery）：通常由右肝動脈分支而來\n\n學習要點：在進行膽囊切除術時，必須達成 Critical View of Safety (CVS)，即在 Calot's triangle 中清楚辨識出僅有兩條結構連接膽囊——膽囊管和膽囊動脈。\n\n您想進一步了解這些結構的變異型態嗎？`;
  }

  if (q.includes('步驟') || q.includes('step') || q.includes('技巧') || q.includes('technique')) {
    return `${timeHint}${nearbyText}手術步驟要點\n\n本手術的關鍵步驟如下：\n\nStep 1：建立氣腹\n在臍部做小切口放置 camera port，維持氣腹壓力 12-15 mmHg\n\nStep 2：暴露 Calot's Triangle\n牽引膽囊底部向上，使用鈍性和銳性分離暴露三角區域\n\nStep 3：達成 Critical View of Safety\n確認只有兩條結構連接膽囊——這是最關鍵的安全步驟\n\nStep 4：夾閉並切斷\n分別夾閉膽囊管和膽囊動脈，確認無誤後切斷\n\nStep 5：分離膽囊\n從肝床上分離膽囊，注意止血\n\n安全提醒：永遠不要在未達成 CVS 前切斷任何結構！`;
  }

  if (q.includes('安全') || q.includes('safety') || q.includes('注意')) {
    return `${timeHint}${nearbyText}安全注意事項\n\n最重要的安全原則\n\nCritical View of Safety (CVS) 是預防膽管損傷最重要的步驟：\n\n1. 必須清楚看到 Calot's triangle 中只有兩條結構連接膽囊\n2. 肝膽囊床的下三分之一必須被暴露\n3. 如果無法達成 CVS，考慮轉為開腹手術\n\n常見陷阱\n\n誤認總膽管為膽囊管：這是最嚴重的併發症原因\n出血時盲目夾止血：可能損傷周圍結構\n解剖變異：約 10-15% 的患者有膽囊動脈變異\n\n台灣相關數據\n\n膽管損傷是膽囊切除術最嚴重的併發症，也是台灣外科醫療糾紛的常見原因之一。完整的手術影像記錄是最好的法律保護。`;
  }

  return `${timeHint}${nearbyText}感謝您的提問！\n\n關於「${title}」這部影片，以下是我根據影片內容的回答：\n\n${transcript.split('\n').slice(0, 3).join('\n')}\n\n影片中主刀醫師特別強調了解剖辨識和安全操作的重要性。\n\n您可以嘗試問我：\n- 這個步驟涉及哪些解剖結構？\n- 這個手術的關鍵技巧是什麼？\n- 需要注意哪些安全事項？\n- 有什麼替代的手術方式？`;
}
