import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const sessions = db.prepare(`
      SELECT ss.*, u.name as surgeon_name,
        (SELECT COUNT(*) FROM video_sources vs WHERE vs.session_id = ss.id) as source_count
      FROM surgical_sessions ss
      LEFT JOIN users u ON ss.surgeon_id = u.id
      ORDER BY ss.created_at DESC
    `).all();

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, surgeryType, procedureId, date, notes, videos } = await request.json();
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    const db = getDb();
    const sessionId = randomUUID();

    db.prepare(`
      INSERT INTO surgical_sessions (id, title, surgery_type, procedure_id, surgeon_id, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, title, surgeryType || '', procedureId || null, user.id, date || '', notes || '');

    // Add video sources
    if (videos?.length) {
      const insertSource = db.prepare(
        'INSERT INTO video_sources (id, session_id, video_id, source_type, label, time_offset_ms, is_primary, order_index) VALUES (?,?,?,?,?,?,?,?)'
      );
      videos.forEach((v: { videoId: string; sourceType: string; label: string; offsetMs: number; isPrimary: boolean }, i: number) => {
        insertSource.run(randomUUID(), sessionId, v.videoId, v.sourceType, v.label || '', v.offsetMs || 0, v.isPrimary ? 1 : 0, i);
      });
    }

    return NextResponse.json({ session: { id: sessionId, title } });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
