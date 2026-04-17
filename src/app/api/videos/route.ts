import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import getDb, { randomUUID } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const surgeryType = searchParams.get('surgeryType');
    const status = searchParams.get('status');

    let query = 'SELECT v.*, u.name as surgeon_name FROM videos v LEFT JOIN users u ON v.surgeon_id = u.id';
    const conditions: string[] = [];
    const params: string[] = [];

    if (surgeryType && surgeryType !== 'all') {
      conditions.push('v.surgery_type = ?');
      params.push(surgeryType);
    }
    if (status && status !== 'all') {
      conditions.push('v.processing_status = ?');
      params.push(status);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY v.created_at DESC';

    const videos = db.prepare(query).all(...params);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Get videos error:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const surgeryType = formData.get('surgeryType') as string || '';
    const difficulty = formData.get('difficulty') as string || 'intermediate';
    const description = formData.get('description') as string || '';
    const referenceMaterials = formData.get('referenceMaterials') as string || '';
    const terminologyList = formData.get('terminologyList') as string || '';
    const expectedSteps = formData.get('expectedSteps') as string || '';

    if (!file || !title) {
      return NextResponse.json({ error: '請提供影片檔案和標題' }, { status: 400 });
    }

    const id = randomUUID();
    const ext = path.extname(file.name) || '.mp4';
    const fileName = `${id}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);

    // Stream write to avoid loading entire file into memory
    try {
      const stream = file.stream();
      const writeStream = createWriteStream(filePath);
      const reader = stream.getReader();

      await new Promise<void>((resolve, reject) => {
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);

        function pump(): void {
          reader.read().then(({ done, value }) => {
            if (done) {
              writeStream.end();
              return;
            }
            const canContinue = writeStream.write(Buffer.from(value));
            if (canContinue) {
              pump();
            } else {
              writeStream.once('drain', pump);
            }
          }).catch(reject);
        }
        pump();
      });
    } catch (writeError) {
      console.error('File write error:', writeError);
      // Fallback: try buffer approach for smaller files
      try {
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));
      } catch (fallbackError) {
        console.error('Fallback write also failed:', fallbackError);
        return NextResponse.json({ error: '影片儲存失敗，請確認伺服器有足夠的磁碟空間' }, { status: 500 });
      }
    }

    const db = getDb();

    // Verify user exists in DB (handle case where cookie points to deleted user)
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(user.id);
    const surgeonId = userExists ? user.id : null;

    db.prepare(`
      INSERT INTO videos (id, title, description, file_path, surgery_type, difficulty, surgeon_id, processing_status, reference_materials, terminology_list, expected_steps)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(id, title, description, `/uploads/${fileName}`, surgeryType, difficulty, surgeonId, referenceMaterials, terminologyList, expectedSteps);

    return NextResponse.json({ video: { id, title, processing_status: 'pending' } });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上傳失敗，請重試' }, { status: 500 });
  }
}
