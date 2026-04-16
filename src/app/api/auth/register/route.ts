import { NextRequest, NextResponse } from 'next/server';
import getDb, { randomUUID } from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';

const ACCESS_CODE = process.env.ACCESS_CODE || '1';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, accessCode } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: '請填寫所有必填欄位' }, { status: 400 });
    }

    if (!accessCode || accessCode !== ACCESS_CODE) {
      return NextResponse.json({ error: '體驗碼錯誤' }, { status: 403 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json({ error: '此電子郵件已被註冊' }, { status: 409 });
    }

    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    const userRole = role === 'surgeon' ? 'surgeon' : 'trainee';

    db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, email, name, passwordHash, userRole);

    const token = generateToken({ id, email, name, role: userRole, locale: 'zh-TW' });

    const response = NextResponse.json({
      user: { id, email, name, role: userRole },
    });
    response.cookies.set('auth-token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
    });
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '註冊失敗' }, { status: 500 });
  }
}
