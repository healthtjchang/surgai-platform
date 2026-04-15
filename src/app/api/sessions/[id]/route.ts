import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const session = db.prepare(`
      SELECT ss.*, u.name as surgeon_name
      FROM surgical_sessions ss LEFT JOIN users u ON ss.surgeon_id = u.id
      WHERE ss.id = ?
    `).get(id);
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Get all video sources with their video details
    const sources = db.prepare(`
      SELECT vs.*, v.title as video_title, v.file_path, v.duration, v.processing_status,
             v.surgery_type as video_surgery_type
      FROM video_sources vs
      JOIN videos v ON vs.video_id = v.id
      WHERE vs.session_id = ?
      ORDER BY vs.order_index
    `).all(id);

    // Get merged transcript from primary source
    const sourceArr = sources as Array<Record<string, unknown>>;
    const primarySource = sourceArr.find(s => s.is_primary) || sourceArr[0];
    let transcripts: unknown[] = [];
    let chapters: unknown[] = [];
    let teachingMaterials: unknown[] = [];
    if (primarySource) {
      const vid = primarySource.video_id as string;
      transcripts = db.prepare('SELECT * FROM transcripts WHERE video_id = ? ORDER BY start_time').all(vid);
      chapters = db.prepare('SELECT * FROM chapters WHERE video_id = ? ORDER BY order_index').all(vid);
      teachingMaterials = db.prepare('SELECT * FROM teaching_materials WHERE video_id = ?').all(vid);
    }

    return NextResponse.json({ session, sources, transcripts, chapters, teachingMaterials });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH: Update session (add source, adjust offset)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    // Add a new video source
    if (body.addSource) {
      const { videoId, sourceType, label, offsetMs, isPrimary } = body.addSource;
      const orderIdx = (db.prepare('SELECT MAX(order_index) as m FROM video_sources WHERE session_id = ?').get(id) as { m: number | null })?.m ?? -1;
      db.prepare('INSERT INTO video_sources (id, session_id, video_id, source_type, label, time_offset_ms, is_primary, order_index) VALUES (?,?,?,?,?,?,?,?)')
        .run(randomUUID(), id, videoId, sourceType || 'other', label || '', offsetMs || 0, isPrimary ? 1 : 0, orderIdx + 1);
    }

    // Update time offset for a source
    if (body.updateOffset) {
      const { sourceId, offsetMs } = body.updateOffset;
      db.prepare('UPDATE video_sources SET time_offset_ms = ? WHERE id = ? AND session_id = ?').run(offsetMs, sourceId, id);
    }

    // Update session metadata
    if (body.title) {
      db.prepare("UPDATE surgical_sessions SET title = ?, updated_at = datetime('now') WHERE id = ?").run(body.title, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
