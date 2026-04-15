import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = getDb();

    const video = db.prepare(`
      SELECT v.*, u.name as surgeon_name
      FROM videos v LEFT JOIN users u ON v.surgeon_id = u.id
      WHERE v.id = ?
    `).get(id);

    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    const transcripts = db.prepare('SELECT * FROM transcripts WHERE video_id = ? ORDER BY start_time').all(id);
    const chapters = db.prepare('SELECT * FROM chapters WHERE video_id = ? ORDER BY order_index').all(id);
    const teachingMaterials = db.prepare('SELECT * FROM teaching_materials WHERE video_id = ?').all(id);
    const annotations = db.prepare('SELECT * FROM annotations WHERE video_id = ? ORDER BY timestamp').all(id);

    return NextResponse.json({
      video, transcripts, chapters, teachingMaterials, annotations,
    });
  } catch (error) {
    console.error('Get video error:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}
