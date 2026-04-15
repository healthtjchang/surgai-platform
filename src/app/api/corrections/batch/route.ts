import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb from '@/lib/db';

// POST: Apply a correction pattern across all of this surgeon's videos
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { originalText, correctedText, videoIds } = await request.json();
    if (!originalText || !correctedText) {
      return NextResponse.json({ error: 'Original and corrected text required' }, { status: 400 });
    }

    const db = getDb();

    // Find all transcripts that contain the original text
    let query: string;
    let params: string[];

    if (videoIds && videoIds.length > 0) {
      // Apply only to specific videos
      const placeholders = videoIds.map(() => '?').join(',');
      query = `
        SELECT t.id, t.text, t.video_id
        FROM transcripts t
        JOIN videos v ON t.video_id = v.id
        WHERE v.surgeon_id = ? AND t.text LIKE ? AND t.video_id IN (${placeholders})
      `;
      params = [user.id, `%${originalText}%`, ...videoIds];
    } else {
      // Apply to all surgeon's videos
      query = `
        SELECT t.id, t.text, t.video_id
        FROM transcripts t
        JOIN videos v ON t.video_id = v.id
        WHERE v.surgeon_id = ? AND t.text LIKE ?
      `;
      params = [user.id, `%${originalText}%`];
    }

    const matches = db.prepare(query).all(...params) as Array<{
      id: string; text: string; video_id: string;
    }>;

    // Apply corrections
    const updateStmt = db.prepare('UPDATE transcripts SET text = ? WHERE id = ?');
    let count = 0;

    const applyBatch = db.transaction(() => {
      for (const match of matches) {
        const newText = match.text.split(originalText).join(correctedText);
        if (newText !== match.text) {
          updateStmt.run(newText, match.id);
          count++;
        }
      }
    });
    applyBatch();

    // Update the auto-rule count
    const existingRule = db.prepare(
      'SELECT id FROM corrections WHERE surgeon_id = ? AND original_text = ? AND corrected_text = ? AND is_auto_rule = 1'
    ).get(user.id, originalText, correctedText) as { id: string } | undefined;

    if (existingRule) {
      db.prepare('UPDATE corrections SET applied_count = applied_count + ? WHERE id = ?').run(count, existingRule.id);
    }

    return NextResponse.json({
      success: true,
      matched: matches.length,
      corrected: count,
      message: `已在 ${count} 段逐字稿中將「${originalText}」替換為「${correctedText}」`,
    });
  } catch (error) {
    console.error('Batch correction error:', error);
    return NextResponse.json({ error: 'Batch correction failed' }, { status: 500 });
  }
}
