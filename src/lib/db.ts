import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { seedKnowledgeBase } from './seed-knowledge';

const DB_PATH = path.join(process.cwd(), 'data', 'surgai.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'trainee',
      locale TEXT NOT NULL DEFAULT 'zh-TW',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ============ 手術案例（多鏡頭整合） ============

    CREATE TABLE IF NOT EXISTS surgical_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      patient_id_hash TEXT DEFAULT '',
      surgery_type TEXT DEFAULT '',
      procedure_id TEXT DEFAULT '',
      surgeon_id TEXT,
      date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      sync_method TEXT DEFAULT 'manual',
      sync_offset_ms INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (surgeon_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS video_sources (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'ai_glasses',
      label TEXT DEFAULT '',
      time_offset_ms INTEGER NOT NULL DEFAULT 0,
      is_primary INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES surgical_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_surgeon ON surgical_sessions(surgeon_id);
    CREATE INDEX IF NOT EXISTS idx_sources_session ON video_sources(session_id);
    CREATE INDEX IF NOT EXISTS idx_sources_video ON video_sources(video_id);

    -- ============ 影片 ============

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      file_path TEXT NOT NULL,
      thumbnail_path TEXT DEFAULT '',
      duration REAL DEFAULT 0,
      surgery_type TEXT DEFAULT '',
      difficulty TEXT DEFAULT 'intermediate',
      surgeon_id TEXT,
      processing_status TEXT NOT NULL DEFAULT 'pending',
      reference_materials TEXT DEFAULT '',
      terminology_list TEXT DEFAULT '',
      expected_steps TEXT DEFAULT '',
      recorded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (surgeon_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      text TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      title_en TEXT DEFAULT '',
      start_time REAL NOT NULL,
      end_time REAL NOT NULL,
      summary TEXT DEFAULT '',
      summary_en TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS teaching_materials (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      content_en TEXT DEFAULT '',
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      timestamp REAL NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      label_en TEXT DEFAULT '',
      description TEXT DEFAULT '',
      coordinates TEXT DEFAULT '{}',
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT DEFAULT '',
      messages TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      timestamp REAL NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- ============ 手術知識庫 ============

    CREATE TABLE IF NOT EXISTS specialties (
      id TEXT PRIMARY KEY,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      icon TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS procedures (
      id TEXT PRIMARY KEY,
      specialty_id TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_zh TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      difficulty TEXT DEFAULT 'intermediate',
      duration_min INTEGER DEFAULT 0,
      duration_max INTEGER DEFAULT 0,
      icd_code TEXT DEFAULT '',
      is_system INTEGER NOT NULL DEFAULT 1,
      surgeon_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (specialty_id) REFERENCES specialties(id),
      FOREIGN KEY (surgeon_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS procedure_steps (
      id TEXT PRIMARY KEY,
      procedure_id TEXT NOT NULL,
      step_number INTEGER NOT NULL,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      description_zh TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      key_points_zh TEXT DEFAULT '',
      key_points_en TEXT DEFAULT '',
      duration_minutes INTEGER DEFAULT 0,
      FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS procedure_instruments (
      id TEXT PRIMARY KEY,
      procedure_id TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      is_essential INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS procedure_anatomy (
      id TEXT PRIMARY KEY,
      procedure_id TEXT NOT NULL,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      category TEXT DEFAULT 'structure',
      importance TEXT DEFAULT 'normal',
      description_zh TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      FOREIGN KEY (procedure_id) REFERENCES procedures(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_procedures_specialty ON procedures(specialty_id);
    CREATE INDEX IF NOT EXISTS idx_steps_procedure ON procedure_steps(procedure_id);
    CREATE INDEX IF NOT EXISTS idx_instruments_procedure ON procedure_instruments(procedure_id);
    CREATE INDEX IF NOT EXISTS idx_anatomy_procedure ON procedure_anatomy(procedure_id);

    -- ============ 術語表 ============

    CREATE TABLE IF NOT EXISTS terminology (
      id TEXT PRIMARY KEY,
      zh TEXT NOT NULL,
      en TEXT NOT NULL,
      category TEXT DEFAULT 'anatomy',
      surgeon_id TEXT,
      is_global INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (surgeon_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY,
      surgeon_id TEXT NOT NULL,
      video_id TEXT,
      original_text TEXT NOT NULL,
      corrected_text TEXT NOT NULL,
      context TEXT DEFAULT '',
      applied_count INTEGER NOT NULL DEFAULT 1,
      is_auto_rule INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (surgeon_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_terminology_zh ON terminology(zh);
    CREATE INDEX IF NOT EXISTS idx_terminology_surgeon ON terminology(surgeon_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_surgeon ON corrections(surgeon_id);
    CREATE INDEX IF NOT EXISTS idx_corrections_original ON corrections(original_text);
    CREATE INDEX IF NOT EXISTS idx_videos_surgeon ON videos(surgeon_id);
    CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(processing_status);
    CREATE INDEX IF NOT EXISTS idx_transcripts_video ON transcripts(video_id);
    CREATE INDEX IF NOT EXISTS idx_chapters_video ON chapters(video_id);
    CREATE INDEX IF NOT EXISTS idx_teaching_video ON teaching_materials(video_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_video ON conversations(video_id);
    CREATE INDEX IF NOT EXISTS idx_notes_video ON notes(video_id);
  `);

  // Seed surgical knowledge base
  seedKnowledgeBase(db);

  // Seed global terminology
  const termCount = db.prepare('SELECT COUNT(*) as count FROM terminology WHERE is_global = 1').get() as { count: number };
  if (termCount.count === 0) {
    const terms = [
      ['膽囊', 'Gallbladder', 'anatomy'], ['膽囊管', 'Cystic Duct', 'anatomy'],
      ['膽囊動脈', 'Cystic Artery', 'anatomy'], ['總膽管', 'Common Bile Duct', 'anatomy'],
      ['肝總管', 'Common Hepatic Duct', 'anatomy'], ['肝門靜脈', 'Portal Vein', 'anatomy'],
      ['肝動脈', 'Hepatic Artery', 'anatomy'], ['膽囊三角', "Calot's Triangle", 'anatomy'],
      ['腹腔鏡', 'Laparoscope', 'instrument'], ['電燒', 'Electrocautery', 'instrument'],
      ['止血鉗', 'Hemostatic Clamp', 'instrument'], ['吸引管', 'Suction Tube', 'instrument'],
      ['內視鏡', 'Endoscope', 'instrument'], ['超音波刀', 'Harmonic Scalpel', 'instrument'],
      ['套管針', 'Trocar', 'instrument'], ['夾子', 'Clip', 'instrument'],
      ['氣腹', 'Pneumoperitoneum', 'procedure'], ['安全視野', 'Critical View of Safety', 'procedure'],
      ['鈍性分離', 'Blunt Dissection', 'procedure'], ['銳性分離', 'Sharp Dissection', 'procedure'],
      ['止血', 'Hemostasis', 'procedure'], ['結紮', 'Ligation', 'procedure'],
      ['縫合', 'Suture', 'procedure'], ['切開', 'Incision', 'procedure'],
      ['闌尾', 'Appendix', 'anatomy'], ['盲腸', 'Cecum', 'anatomy'],
      ['十二指腸', 'Duodenum', 'anatomy'], ['胰臟', 'Pancreas', 'anatomy'],
      ['脾臟', 'Spleen', 'anatomy'], ['腹膜', 'Peritoneum', 'anatomy'],
      ['筋膜', 'Fascia', 'anatomy'], ['腸繫膜', 'Mesentery', 'anatomy'],
      ['迷走神經', 'Vagus Nerve', 'anatomy'], ['返喉神經', 'Recurrent Laryngeal Nerve', 'anatomy'],
      ['甲狀腺', 'Thyroid Gland', 'anatomy'], ['副甲狀腺', 'Parathyroid Gland', 'anatomy'],
      ['腹主動脈', 'Abdominal Aorta', 'anatomy'], ['下腔靜脈', 'Inferior Vena Cava', 'anatomy'],
      ['沾黏', 'Adhesion', 'pathology'], ['出血', 'Hemorrhage', 'pathology'],
      ['膽汁滲漏', 'Bile Leak', 'pathology'], ['膽管損傷', 'Bile Duct Injury', 'pathology'],
      ['併發症', 'Complication', 'pathology'], ['解剖變異', 'Anatomical Variant', 'pathology'],
    ];
    const insertTerm = db.prepare('INSERT INTO terminology (id, zh, en, category, is_global) VALUES (?, ?, ?, ?, 1)');
    for (const [zh, en, cat] of terms) {
      insertTerm.run(randomUUID(), zh, en, cat);
    }
  }

  // Create demo user if none exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const demoHash = bcrypt.hashSync('demo123', 10);
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), 'surgeon@demo.com', 'Dr. Demo', demoHash, 'surgeon');
    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(randomUUID(), 'trainee@demo.com', 'Trainee Demo', demoHash, 'trainee');
  }
}

export default getDb;
export { randomUUID };
