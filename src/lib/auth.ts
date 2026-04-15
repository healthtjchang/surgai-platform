import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import getDb from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'surgai-dev-secret-change-in-production';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'surgeon' | 'trainee' | 'admin';
  locale: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, JWT_SECRET) as User;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getUserById(id: string) {
  const db = getDb();
  return db.prepare('SELECT id, email, name, role, locale FROM users WHERE id = ?').get(id) as User | undefined;
}
