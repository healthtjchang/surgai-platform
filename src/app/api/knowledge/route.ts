import { NextRequest, NextResponse } from 'next/server';
import getDb, { randomUUID } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: List specialties + procedures (optionally filtered)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const specId = searchParams.get('specialty');
    const procId = searchParams.get('procedure');
    const q = searchParams.get('q');

    // Single procedure detail
    if (procId) {
      const proc = db.prepare('SELECT p.*, s.name_zh as specialty_zh, s.name_en as specialty_en FROM procedures p JOIN specialties s ON p.specialty_id = s.id WHERE p.id = ?').get(procId);
      if (!proc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const steps = db.prepare('SELECT * FROM procedure_steps WHERE procedure_id = ? ORDER BY step_number').all(procId);
      const instruments = db.prepare('SELECT * FROM procedure_instruments WHERE procedure_id = ? ORDER BY is_essential DESC, name_zh').all(procId);
      const anatomy = db.prepare('SELECT * FROM procedure_anatomy WHERE procedure_id = ? ORDER BY importance DESC, name_zh').all(procId);
      return NextResponse.json({ procedure: proc, steps, instruments, anatomy });
    }

    // Search across everything
    if (q) {
      const term = `%${q}%`;
      const procs = db.prepare(`
        SELECT p.*, s.name_zh as specialty_zh, s.name_en as specialty_en, s.icon
        FROM procedures p JOIN specialties s ON p.specialty_id = s.id
        WHERE p.name_zh LIKE ? OR p.name_en LIKE ? OR p.description_zh LIKE ?
        ORDER BY p.name_zh
      `).all(term, term, term);
      const anatResults = db.prepare(`
        SELECT pa.*, p.name_zh as proc_zh, p.name_en as proc_en, p.id as procedure_id
        FROM procedure_anatomy pa JOIN procedures p ON pa.procedure_id = p.id
        WHERE pa.name_zh LIKE ? OR pa.name_en LIKE ?
        LIMIT 30
      `).all(term, term);
      const instResults = db.prepare(`
        SELECT pi.*, p.name_zh as proc_zh, p.name_en as proc_en, p.id as procedure_id
        FROM procedure_instruments pi JOIN procedures p ON pi.procedure_id = p.id
        WHERE pi.name_zh LIKE ? OR pi.name_en LIKE ?
        LIMIT 30
      `).all(term, term);
      return NextResponse.json({ procedures: procs, anatomy: anatResults, instruments: instResults });
    }

    // List by specialty
    const specialties = db.prepare('SELECT * FROM specialties ORDER BY order_index').all();

    let procedures;
    if (specId) {
      procedures = db.prepare('SELECT p.*, s.icon FROM procedures p JOIN specialties s ON p.specialty_id = s.id WHERE p.specialty_id = ? ORDER BY p.name_zh').all(specId);
    } else {
      procedures = db.prepare('SELECT p.*, s.icon, s.name_zh as specialty_zh FROM procedures p JOIN specialties s ON p.specialty_id = s.id ORDER BY s.order_index, p.name_zh').all();
    }

    return NextResponse.json({ specialties, procedures });
  } catch (error) {
    console.error('Knowledge API error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST: Add user-defined procedure
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { specialtyId, nameZh, nameEn, descriptionZh, descriptionEn, difficulty, steps, instruments, anatomy } = await request.json();
    if (!specialtyId || !nameZh) return NextResponse.json({ error: '請填寫必填欄位' }, { status: 400 });

    const db = getDb();
    const procId = randomUUID();
    db.prepare('INSERT INTO procedures (id, specialty_id, name_zh, name_en, description_zh, description_en, difficulty, is_system, surgeon_id) VALUES (?,?,?,?,?,?,?,0,?)')
      .run(procId, specialtyId, nameZh, nameEn || '', descriptionZh || '', descriptionEn || '', difficulty || 'intermediate', user.id);

    if (steps?.length) {
      const insertStep = db.prepare('INSERT INTO procedure_steps (id, procedure_id, step_number, name_zh, name_en, description_zh, description_en) VALUES (?,?,?,?,?,?,?)');
      steps.forEach((s: { zh: string; en?: string; desc?: string; descEn?: string }, i: number) => {
        insertStep.run(randomUUID(), procId, i + 1, s.zh, s.en || '', s.desc || '', s.descEn || '');
      });
    }
    if (instruments?.length) {
      const insertInst = db.prepare('INSERT INTO procedure_instruments (id, procedure_id, name_zh, name_en, category, is_essential) VALUES (?,?,?,?,?,?)');
      instruments.forEach((inst: { zh: string; en?: string; cat?: string }) => {
        insertInst.run(randomUUID(), procId, inst.zh, inst.en || '', inst.cat || 'general', 1);
      });
    }
    if (anatomy?.length) {
      const insertAnat = db.prepare('INSERT INTO procedure_anatomy (id, procedure_id, name_zh, name_en, category, importance) VALUES (?,?,?,?,?,?)');
      anatomy.forEach((a: { zh: string; en?: string; cat?: string; imp?: string }) => {
        insertAnat.run(randomUUID(), procId, a.zh, a.en || '', a.cat || 'structure', a.imp || 'normal');
      });
    }

    return NextResponse.json({ procedure: { id: procId, name_zh: nameZh } });
  } catch (error) {
    console.error('Add procedure error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
