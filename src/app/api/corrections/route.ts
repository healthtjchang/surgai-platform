import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb from '@/lib/db';

// GET: List correction patterns for this surgeon
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const autoOnly = searchParams.get('autoOnly') === 'true';

    let query = 'SELECT * FROM corrections WHERE surgeon_id = ?';
    if (autoOnly) query += ' AND is_auto_rule = 1';
    query += ' ORDER BY applied_count DESC, created_at DESC';

    const corrections = db.prepare(query).all(user.id);
    return NextResponse.json({ corrections });
  } catch (error) {
    console.error('Get corrections error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE: Remove a correction rule
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    const db = getDb();
    db.prepare('DELETE FROM corrections WHERE id = ? AND surgeon_id = ?').run(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete correction error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
