import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

const ACCESS_CODE = process.env.ACCESS_CODE || '1';

export async function POST(request: NextRequest) {
  try {
    const { email, password, accessCode } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: '請輸入電子郵件和密碼' }, { status: 400 });
    }

    if (!accessCode || accessCode !== ACCESS_CODE) {
      return NextResponse.json({ error: '體驗碼錯誤' }, { status: 403 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as {
      id: string; email: string; name: string; password_hash: string; role: string; locale: string;
    } | undefined;

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: '電子郵件或密碼錯誤' }, { status: 401 });
    }

    const token = generateToken({
      id: user.id, email: user.email, name: user.name,
      role: user.role as 'surgeon' | 'trainee' | 'admin', locale: user.locale,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    response.cookies.set('auth-token', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
    });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登入失敗' }, { status: 500 });
  }
}
