import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    if (!q.trim()) return NextResponse.json({ results: [] });

    const db = getDb();
    const searchTerm = `%${q}%`;

    // Search videos
    const videos = db.prepare(`
      SELECT v.id, v.title, v.surgery_type, v.difficulty, v.processing_status,
             v.created_at, u.name as surgeon_name, 'video' as result_type
      FROM videos v LEFT JOIN users u ON v.surgeon_id = u.id
      WHERE v.title LIKE ? OR v.description LIKE ? OR v.surgery_type LIKE ?
      ORDER BY v.created_at DESC LIMIT 20
    `).all(searchTerm, searchTerm, searchTerm);

    // Search transcripts
    const transcripts = db.prepare(`
      SELECT t.video_id, t.text, t.start_time, t.end_time,
             v.title as video_title, 'transcript' as result_type
      FROM transcripts t JOIN videos v ON t.video_id = v.id
      WHERE t.text LIKE ?
      ORDER BY t.start_time LIMIT 20
    `).all(searchTerm);

    // Search teaching materials
    const materials = db.prepare(`
      SELECT tm.video_id, tm.type, tm.content,
             v.title as video_title, 'teaching' as result_type
      FROM teaching_materials tm JOIN videos v ON tm.video_id = v.id
      WHERE tm.content LIKE ?
      LIMIT 20
    `).all(searchTerm);

    return NextResponse.json({
      results: [...videos, ...transcripts, ...materials],
      query: q,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
