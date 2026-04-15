import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';

// GET: List terminology (global + surgeon's own)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    let query = 'SELECT * FROM terminology WHERE (is_global = 1 OR surgeon_id = ?)';
    const params: (string | number)[] = [user.id];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    if (q) {
      query += ' AND (zh LIKE ? OR en LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    query += ' ORDER BY usage_count DESC, zh ASC';

    const terms = db.prepare(query).all(...params);
    return NextResponse.json({ terms });
  } catch (error) {
    console.error('Get terminology error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST: Add new term
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { zh, en, category } = await request.json();
    if (!zh || !en) return NextResponse.json({ error: '請填寫中英文' }, { status: 400 });

    const db = getDb();
    const id = randomUUID();
    db.prepare('INSERT INTO terminology (id, zh, en, category, surgeon_id, is_global) VALUES (?, ?, ?, ?, ?, 0)')
      .run(id, zh, en, category || 'other', user.id);

    return NextResponse.json({ term: { id, zh, en, category } });
  } catch (error) {
    console.error('Add term error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE: Remove a custom term
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    const db = getDb();
    db.prepare('DELETE FROM terminology WHERE id = ? AND surgeon_id = ? AND is_global = 0').run(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete term error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
