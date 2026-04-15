import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';

// PATCH: Edit a transcript segment
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    const db = getDb();

    // Get original before update
    const original = db.prepare('SELECT * FROM transcripts WHERE id = ?').get(id) as {
      id: string; video_id: string; text: string;
    } | undefined;
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const originalText = original.text;

    // Update transcript
    db.prepare('UPDATE transcripts SET text = ? WHERE id = ?').run(text, id);

    // Record the correction for batch learning
    if (originalText !== text) {
      // Find what words changed — simple diff for common corrections
      const origWords = originalText.split(/\s+/);
      const newWords = text.split(/\s+/);

      // Record the full segment correction
      db.prepare(`
        INSERT INTO corrections (id, surgeon_id, video_id, original_text, corrected_text, context)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(randomUUID(), user.id, original.video_id, originalText, text, 'transcript_edit');

      // Also check for word-level patterns to enable batch correction
      // Find common substrings that differ
      const origStr = originalText;
      const newStr = text;
      // Simple: if the edit is just replacing one term, record it
      if (origStr.length > 0 && newStr.length > 0) {
        // Find the first difference
        let start = 0;
        while (start < origStr.length && start < newStr.length && origStr[start] === newStr[start]) start++;
        // Find the last difference
        let endOrig = origStr.length - 1;
        let endNew = newStr.length - 1;
        while (endOrig > start && endNew > start && origStr[endOrig] === newStr[endNew]) { endOrig--; endNew--; }

        const origDiff = origStr.slice(start, endOrig + 1);
        const newDiff = newStr.slice(start, endNew + 1);

        if (origDiff.length > 0 && origDiff.length <= 20 && newDiff.length > 0 && newDiff.length <= 20) {
          // Check if this pattern already exists
          const existing = db.prepare(
            'SELECT id, applied_count FROM corrections WHERE surgeon_id = ? AND original_text = ? AND corrected_text = ? AND is_auto_rule = 1'
          ).get(user.id, origDiff, newDiff) as { id: string; applied_count: number } | undefined;

          if (existing) {
            db.prepare('UPDATE corrections SET applied_count = applied_count + 1 WHERE id = ?').run(existing.id);
          } else {
            db.prepare(`
              INSERT INTO corrections (id, surgeon_id, video_id, original_text, corrected_text, context, is_auto_rule)
              VALUES (?, ?, ?, ?, ?, ?, 1)
            `).run(randomUUID(), user.id, original.video_id, origDiff, newDiff, 'word_pattern');
          }
        }
      }
    }

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error('Edit transcript error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
