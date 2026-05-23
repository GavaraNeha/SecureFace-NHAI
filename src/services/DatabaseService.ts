/**
 * DatabaseService.ts
 *
 * SQLite local database (react-native-sqlite-storage).
 *
 * Tables:
 *   personnel    – enrolled users + face embedding (binary blob)
 *   attendance   – authentication events pending sync
 *   sync_log     – history of AWS syncs
 */

import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);
SQLite.DEBUG(false);

let db: SQLite.SQLiteDatabase | null = null;

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabase({
    name: 'secureface.db',
    location: 'default',
  });

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS personnel (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      department  TEXT,
      embedding   BLOB NOT NULL,
      created_at  INTEGER NOT NULL,
      synced      INTEGER DEFAULT 0
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS attendance (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      timestamp   INTEGER NOT NULL,
      similarity  REAL NOT NULL,
      liveness_ok INTEGER NOT NULL,
      location_lat REAL,
      location_lon REAL,
      synced      INTEGER DEFAULT 0
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id         TEXT PRIMARY KEY,
      synced_at  INTEGER NOT NULL,
      records    INTEGER NOT NULL,
      status     TEXT NOT NULL
    );
  `);

  console.log('[DB] SQLite initialised ✓');
}

function getDB(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialised');
  return db;
}

// ── Personnel ─────────────────────────────────────────────────────────────────

export const DatabaseService = {

  async enrollPersonnel(data: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    embedding: Float32Array;
  }): Promise<void> {
    const embBuffer = Buffer.from(data.embedding.buffer).toString('base64');
    await getDB().executeSql(
      `INSERT OR REPLACE INTO personnel
         (id, name, employee_id, department, embedding, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [data.id, data.name, data.employeeId, data.department, embBuffer, Date.now()]
    );
  },

  async getAllEmbeddings(): Promise<{ userId: string; name: string; embedding: ArrayBuffer }[]> {
    const [result] = await getDB().executeSql(
      'SELECT id, name, embedding FROM personnel'
    );
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      const embBuffer = Buffer.from(row.embedding, 'base64').buffer;
      rows.push({ userId: row.id, name: row.name, embedding: embBuffer });
    }
    return rows;
  },

  async getPersonnelCount(): Promise<number> {
    const [result] = await getDB().executeSql('SELECT COUNT(*) as cnt FROM personnel');
    return result.rows.item(0).cnt;
  },

  async getAllPersonnel(): Promise<any[]> {
    const [result] = await getDB().executeSql(
      'SELECT id, name, employee_id, department, created_at FROM personnel ORDER BY name'
    );
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
    return rows;
  },

  // ── Attendance ────────────────────────────────────────────────────────────

  async logAttendance(data: {
    id: string;
    userId: string;
    similarity: number;
    livenessOk: boolean;
    lat?: number;
    lon?: number;
  }): Promise<void> {
    await getDB().executeSql(
      `INSERT INTO attendance
         (id, user_id, timestamp, similarity, liveness_ok, location_lat, location_lon, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        data.id, data.userId, Date.now(),
        data.similarity, data.livenessOk ? 1 : 0,
        data.lat ?? null, data.lon ?? null,
      ]
    );
  },

  async getUnsyncedAttendance(): Promise<any[]> {
    const [result] = await getDB().executeSql(
      `SELECT a.*, p.name, p.employee_id, p.department
       FROM attendance a
       LEFT JOIN personnel p ON a.user_id = p.id
       WHERE a.synced = 0
       ORDER BY a.timestamp`
    );
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
    return rows;
  },

  async getAttendanceHistory(limit = 50): Promise<any[]> {
    const [result] = await getDB().executeSql(
      `SELECT a.*, p.name, p.employee_id
       FROM attendance a
       LEFT JOIN personnel p ON a.user_id = p.id
       ORDER BY a.timestamp DESC
       LIMIT ?`,
      [limit]
    );
    const rows = [];
    for (let i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i));
    return rows;
  },

  async markAttendanceSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await getDB().executeSql(
      `UPDATE attendance SET synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  },

  async purgeLocalAfterSync(): Promise<void> {
    await getDB().executeSql('DELETE FROM attendance WHERE synced = 1');
    console.log('[DB] Purged synced attendance records ✓');
  },

  // ── Sync Log ──────────────────────────────────────────────────────────────

  async logSync(id: string, records: number, status: string): Promise<void> {
    await getDB().executeSql(
      'INSERT INTO sync_log (id, synced_at, records, status) VALUES (?, ?, ?, ?)',
      [id, Date.now(), records, status]
    );
  },
};
